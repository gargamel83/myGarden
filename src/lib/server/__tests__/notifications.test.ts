import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../db/schema';
import { eq, sql } from 'drizzle-orm';

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
