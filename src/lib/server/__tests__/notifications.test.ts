import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';

// --- Mock setup ---
// Use a mutable ref so the hoisted vi.mock can point to the test DB created in beforeAll
const testDbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('../db', () => ({
	get db() { return testDbRef.current; }
}));

vi.mock('../rotation', () => ({
	getRotationAlerts: vi.fn().mockResolvedValue([])
}));

import { generateNotifications, getNotifications, markAllRead } from '../notifications';

// --- Test DB setup ---
let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('notifications API', () => {
	it('should insert and retrieve notifications', () => {
		db.insert(schema.notifications).values({
			type: 'test',
			key: 'test-1',
			message: 'test notification',
			link: '/',
			createdAt: new Date().toISOString()
		}).run();

		const all = db.select().from(schema.notifications).all();
		expect(all.length).toBeGreaterThan(0);
		expect(all.some(n => n.key === 'test-1')).toBe(true);
	});

	it('should respect unique key constraint', () => {
		expect(() => {
			db.insert(schema.notifications).values({
				type: 'test',
				key: 'test-1',
				message: 'duplicate',
				link: '/',
				createdAt: new Date().toISOString()
			}).run();
		}).toThrow();
	});

	it('should mark notification as read', () => {
		const n = db.select().from(schema.notifications).where(eq(schema.notifications.key, 'test-1')).get()!;
		expect(n.isRead).toBeFalsy();

		db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.id, n.id)).run();
		const updated = db.select().from(schema.notifications).where(eq(schema.notifications.id, n.id)).get()!;
		expect(updated.isRead).toBeTruthy();
	});

	it('should only return top 20 latest', () => {
		for (let i = 0; i < 25; i++) {
			db.insert(schema.notifications).values({
				type: 'bulk',
				key: `bulk-${i}`,
				message: `bulk ${i}`,
				createdAt: new Date(Date.now() + i).toISOString()
			}).run();
		}

		const all = db.select().from(schema.notifications).orderBy(sql`${schema.notifications.createdAt} DESC`).limit(20).all();
		expect(all.length).toBeLessThanOrEqual(20);
	});
});

describe('generateNotifications, getNotifications, markAllRead', () => {
	beforeEach(() => {
		db.delete(schema.notifications).run();
		db.delete(schema.plantations).run();
		db.delete(schema.plants).run();
		db.delete(schema.gardenBeds).run();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	describe('generateNotifications', () => {
		it('should generate a sowing notification when sowing is within 30 days', async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));

			db.insert(schema.plants).values({ id: 1, commonName: 'Tomate', family: 'Solanaceae', sowingStart: '07-20' }).run();
			db.insert(schema.gardenBeds).values({ id: 1, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
			db.insert(schema.plantations).values({ id: 1, gardenBedId: 1, plantId: 1, plantName: 'Tomate', status: 'planned' }).run();

			await generateNotifications();

			const result = getNotifications();
			expect(result.notifications).toHaveLength(1);
			expect(result.notifications[0].type).toBe('sowing');
			expect(result.notifications[0].key).toBe('sowing-1');
			expect(result.notifications[0].message).toContain('sowing starts in 13 days');
			expect(result.notifications[0].link).toBe('/plants/1');
			expect(result.unreadCount).toBe(1);
		});

		it('should generate a harvest notification when harvest is in range', async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));

			db.insert(schema.plants).values({ id: 1, commonName: 'Carotte', family: 'Apiaceae', harvestStart: '07-15' }).run();
			db.insert(schema.gardenBeds).values({ id: 1, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
			db.insert(schema.plantations).values({ id: 1, gardenBedId: 1, plantId: 1, plantName: 'Carotte', status: 'growing' }).run();

			await generateNotifications();

			const result = getNotifications();
			expect(result.notifications).toHaveLength(1);
			expect(result.notifications[0].type).toBe('harvest');
			expect(result.notifications[0].key).toBe('harvest-1');
			expect(result.notifications[0].message).toContain('harvest in 8 days');
			expect(result.notifications[0].link).toBe('/plants/1');
			expect(result.unreadCount).toBe(1);
		});

		it('should generate a stale notification for planned plantations with no start date older than 14 days', async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));

			const twentyDaysAgo = new Date('2026-06-17T12:00:00Z').toISOString();

			db.insert(schema.gardenBeds).values({ id: 1, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
			db.insert(schema.plantations).values({
				id: 1,
				gardenBedId: 1,
				plantName: 'Laitue',
				status: 'planned',
				createdAt: twentyDaysAgo
			}).run();

			await generateNotifications();

			const result = getNotifications();
			expect(result.notifications).toHaveLength(1);
			expect(result.notifications[0].type).toBe('stale');
			expect(result.notifications[0].key).toBe('stale-1');
			expect(result.notifications[0].message).toContain('planned for over 14 days');
			expect(result.notifications[0].link).toBe('/plantations');
			expect(result.unreadCount).toBe(1);
		});

		it('should skip duplicate keys on subsequent calls', async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));

			db.insert(schema.plants).values({ id: 1, commonName: 'Tomate', family: 'Solanaceae', sowingStart: '07-20' }).run();
			db.insert(schema.gardenBeds).values({ id: 1, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
			db.insert(schema.plantations).values({ id: 1, gardenBedId: 1, plantId: 1, plantName: 'Tomate', status: 'planned' }).run();

			await generateNotifications();
			expect(getNotifications().notifications).toHaveLength(1);

			await generateNotifications();
			expect(getNotifications().notifications).toHaveLength(1);
		});

		it('should not generate a sowing notification when start date is beyond 30 days', async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));

			db.insert(schema.plants).values({ id: 1, commonName: 'Haricot', family: 'Fabaceae', sowingStart: '09-01' }).run();
			db.insert(schema.gardenBeds).values({ id: 1, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
			db.insert(schema.plantations).values({ id: 1, gardenBedId: 1, plantId: 1, plantName: 'Haricot', status: 'planned' }).run();

			await generateNotifications();

			const result = getNotifications();
			expect(result.notifications).toHaveLength(0);
			expect(result.unreadCount).toBe(0);
		});

		it('should not generate a stale notification if plantation has a sowingDate', async () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date('2026-07-07T12:00:00Z'));

			const twentyDaysAgo = new Date('2026-06-17T12:00:00Z').toISOString();

			db.insert(schema.gardenBeds).values({ id: 1, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
			db.insert(schema.plantations).values({
				id: 1,
				gardenBedId: 1,
				plantName: 'Laitue',
				status: 'planned',
				sowingDate: '2026-07-01',
				createdAt: twentyDaysAgo
			}).run();

			await generateNotifications();

			const result = getNotifications();
			expect(result.notifications).toHaveLength(0);
			expect(result.unreadCount).toBe(0);
		});
	});

	describe('getNotifications', () => {
		it('should return unread first, then ordered by createdAt descending', () => {
			const base = new Date('2026-07-07T12:00:00Z');
			db.insert(schema.notifications).values([
				{ type: 'test', key: 'n1', message: 'old read', isRead: true, createdAt: new Date(base.getTime() - 2000).toISOString() },
				{ type: 'test', key: 'n2', message: 'new unread', isRead: false, createdAt: base.toISOString() },
				{ type: 'test', key: 'n3', message: 'old unread', isRead: false, createdAt: new Date(base.getTime() - 1000).toISOString() },
				{ type: 'test', key: 'n4', message: 'new read', isRead: true, createdAt: new Date(base.getTime() - 500).toISOString() }
			]).run();

			const result = getNotifications();
			expect(result.notifications.map(n => n.key)).toEqual(['n2', 'n3', 'n4', 'n1']);
			expect(result.unreadCount).toBe(2);
		});

		it('should limit to 20 results', () => {
			for (let i = 0; i < 25; i++) {
				db.insert(schema.notifications).values({
					type: 'test',
					key: `limit-${i}`,
					message: `n${i}`,
					createdAt: new Date(Date.now() + i).toISOString()
				}).run();
			}

			const result = getNotifications();
			expect(result.notifications).toHaveLength(20);
		});

		it('should return 0 unread when all notifications are read', () => {
			db.insert(schema.notifications).values([
				{ type: 'test', key: 'r1', message: 'r1', isRead: true, createdAt: new Date().toISOString() },
				{ type: 'test', key: 'r2', message: 'r2', isRead: true, createdAt: new Date().toISOString() }
			]).run();

			const result = getNotifications();
			expect(result.unreadCount).toBe(0);
		});

		it('should return empty arrays when no notifications exist', () => {
			const result = getNotifications();
			expect(result.notifications).toEqual([]);
			expect(result.unreadCount).toBe(0);
		});
	});

	describe('markAllRead', () => {
		it('should mark all unread notifications as read', () => {
			db.insert(schema.notifications).values([
				{ type: 'test', key: 'mr1', message: 'mr1', isRead: false, createdAt: new Date().toISOString() },
				{ type: 'test', key: 'mr2', message: 'mr2', isRead: true, createdAt: new Date().toISOString() },
				{ type: 'test', key: 'mr3', message: 'mr3', isRead: false, createdAt: new Date().toISOString() }
			]).run();

			markAllRead();

			const all = db.select().from(schema.notifications).orderBy(schema.notifications.key).all();
			expect(all.every(n => n.isRead)).toBe(true);
		});

		it('should set unreadCount to 0 after marking all read', () => {
			db.insert(schema.notifications).values([
				{ type: 'test', key: 'mr4', message: 'mr4', isRead: false, createdAt: new Date().toISOString() },
				{ type: 'test', key: 'mr5', message: 'mr5', isRead: false, createdAt: new Date().toISOString() }
			]).run();

			markAllRead();

			const result = getNotifications();
			expect(result.unreadCount).toBe(0);
		});

		it('should be idempotent when all notifications are already read', () => {
			db.insert(schema.notifications).values([
				{ type: 'test', key: 'mr6', message: 'mr6', isRead: true, createdAt: new Date().toISOString() }
			]).run();

			expect(() => markAllRead()).not.toThrow();

			const result = getNotifications();
			expect(result.unreadCount).toBe(0);
		});
	});
});
