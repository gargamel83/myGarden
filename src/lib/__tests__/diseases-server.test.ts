import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import * as schema from '$lib/server/db/schema';

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

describe('diseases server data', () => {
	it('can query diseases table', () => {
		db.insert(schema.diseases).values({ name: 'Mildiou', latinName: 'Plasmopara viticola', symptoms: 'taches', causes: 'humide', treatments: 'bouillie bordelaise', prevention: 'aérer', hostPlants: JSON.stringify(['Tomate']), photos: '[]', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).run();
		const rows = db.select().from(schema.diseases).all();
		expect(rows.length).toBe(1);
		expect(rows[0].name).toBe('Mildiou');
	});
});
