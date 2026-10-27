import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import * as schema from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	userId = db.insert(schema.users).values({ username: 'u1', passwordHash: 'x', createdAt: new Date().toISOString() }).returning({ id: schema.users.id }).get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('garden_tasks CRUD', () => {
	it('creates and toggles tasks with ownership', () => {
		const res = db.insert(schema.gardenTasks).values({ userId, title: 'Biner', month: 4, year: 2026, done: false, createdAt: new Date().toISOString() }).returning({ id: schema.gardenTasks.id }).get()!;
		let task = db.select().from(schema.gardenTasks).where(eq(schema.gardenTasks.id, res.id)).get()!;
		expect(task.done).toBe(false);
		db.update(schema.gardenTasks).set({ done: true }).where(eq(schema.gardenTasks.id, res.id)).run();
		task = db.select().from(schema.gardenTasks).where(eq(schema.gardenTasks.id, res.id)).get()!;
		expect(task.done).toBe(true);
		db.delete(schema.gardenTasks).where(eq(schema.gardenTasks.id, res.id)).run();
		expect(db.select().from(schema.gardenTasks).where(eq(schema.gardenTasks.id, res.id)).all().length).toBe(0);
	});

	it('filters by user and month', () => {
		const user2 = db.insert(schema.users).values({ username: 'u2', passwordHash: 'x', createdAt: new Date().toISOString() }).returning({ id: schema.users.id }).get()!.id;
		db.insert(schema.gardenTasks).values([
			{ userId, title: 'T1', month: 5, year: 2026, done: false, createdAt: new Date().toISOString() },
			{ userId: user2, title: 'T2', month: 5, year: 2026, done: false, createdAt: new Date().toISOString() }
		]).run();
		const rows = db.select().from(schema.gardenTasks).where(and(eq(schema.gardenTasks.userId, userId), eq(schema.gardenTasks.month, 5))).all();
		expect(rows.length).toBe(1);
		expect(rows[0].title).toBe('T1');
	});
});
