import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../server/db/schema';
import { eq } from 'drizzle-orm';

const testDbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('../server/db', () => ({
	get db() { return testDbRef.current; }
}));

vi.mock('../server/rotation', () => ({
	getRotationAlerts: vi.fn().mockResolvedValue([])
}));

import { createUser } from '../server/auth';
import { GET } from '../../routes/api/notifications/+server';
import { POST as POST_READ_ALL } from '../../routes/api/notifications/read-all/+server';
import { POST as POST_READ_ID } from '../../routes/api/notifications/[id]/read/+server';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let testUserId: number;
let otherUserId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	const userA = createUser('notif-api-user', 'pass');
	const userB = createUser('notif-api-other', 'pass');
	testUserId = userA.id;
	otherUserId = userB.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
	db.delete(schema.notifications).run();
});

describe('GET /api/notifications', () => {
	it('returns notifications for the authenticated user', async () => {
		db.insert(schema.notifications).values([
			{ userId: testUserId, type: 'test', key: 'get-test-1', message: 'notif A', isRead: false, createdAt: new Date().toISOString() },
			{ userId: testUserId, type: 'test', key: 'get-test-2', message: 'notif B', isRead: true, createdAt: new Date().toISOString() }
		]).run();

		const event = { locals: { user: { id: testUserId } } };
		const response = await GET(event as any);
		const result = await response.json();

		expect(result.notifications).toHaveLength(2);
		expect(result.notifications.map((n: any) => n.message)).toContain('notif A');
		expect(result.notifications.map((n: any) => n.message)).toContain('notif B');
		expect(result.unreadCount).toBe(1);
	});

	it('returns empty result when no notifications exist', async () => {
		const event = { locals: { user: { id: testUserId } } };
		const response = await GET(event as any);
		const result = await response.json();

		expect(result.notifications).toEqual([]);
		expect(result.unreadCount).toBe(0);
	});
});

describe('POST /api/notifications/read-all', () => {
	it('marks all notifications as read for the user', async () => {
		db.insert(schema.notifications).values([
			{ userId: testUserId, type: 'test', key: 'ra-test-1', message: 'unread A', isRead: false, createdAt: new Date().toISOString() },
			{ userId: testUserId, type: 'test', key: 'ra-test-2', message: 'unread B', isRead: false, createdAt: new Date().toISOString() },
			{ userId: testUserId, type: 'test', key: 'ra-test-3', message: 'already read', isRead: true, createdAt: new Date().toISOString() }
		]).run();

		const event = { locals: { user: { id: testUserId } } };
		const response = await POST_READ_ALL(event as any);

		expect(response.status).toBe(200);
		const all = db.select().from(schema.notifications).where(eq(schema.notifications.userId, testUserId)).all();
		expect(all.every(n => n.isRead)).toBe(true);
	});

	it('does not affect other user notifications', async () => {
		db.insert(schema.notifications).values([
			{ userId: otherUserId, type: 'test', key: 'ra-other-1', message: 'other notif', isRead: false, createdAt: new Date().toISOString() }
		]).run();

		const event = { locals: { user: { id: testUserId } } };
		await POST_READ_ALL(event as any);

		const otherNotifs = db.select().from(schema.notifications).where(eq(schema.notifications.userId, otherUserId)).all();
		expect(otherNotifs.every(n => n.isRead)).toBe(false);
	});
});

describe('POST /api/notifications/[id]/read', () => {
	it('marks a single notification as read', async () => {
		const inserted = db.insert(schema.notifications).values({
			userId: testUserId, type: 'test', key: 'rid-test-1', message: 'single', isRead: false, createdAt: new Date().toISOString()
		}).returning().get()!;

		const event = { params: { id: String(inserted.id) }, locals: { user: { id: testUserId } } };
		const response = await POST_READ_ID(event as any);

		expect(response.status).toBe(200);
		const updated = db.select().from(schema.notifications).where(eq(schema.notifications.id, inserted.id)).get()!;
		expect(updated.isRead).toBe(true);
	});

	it('returns 404 when notification does not exist', async () => {
		const event = { params: { id: '99999' }, locals: { user: { id: testUserId } } };
		const response = await POST_READ_ID(event as any);

		expect(response.status).toBe(404);
	});

	it('returns 404 when notification belongs to another user', async () => {
		const inserted = db.insert(schema.notifications).values({
			userId: otherUserId, type: 'test', key: 'rid-other-1', message: 'not mine', isRead: false, createdAt: new Date().toISOString()
		}).returning().get()!;

		const event = { params: { id: String(inserted.id) }, locals: { user: { id: testUserId } } };
		const response = await POST_READ_ID(event as any);

		expect(response.status).toBe(404);
		const stillUnread = db.select().from(schema.notifications).where(eq(schema.notifications.id, inserted.id)).get()!;
		expect(stillUnread.isRead).toBe(false);
	});

	it('returns 400 when id is NaN', async () => {
		const event = { params: { id: 'abc' }, locals: { user: { id: testUserId } } };
		const response = await POST_READ_ID(event as any);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toBe('Invalid id');
	});
});
