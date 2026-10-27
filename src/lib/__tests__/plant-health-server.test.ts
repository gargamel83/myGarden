import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import * as schema from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userId: number;
let bedId: number;
let plantId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	userId = db.insert(schema.users).values({ username: 'u1', passwordHash: 'x', createdAt: new Date().toISOString() }).returning({ id: schema.users.id }).get()!.id;
	bedId = db.insert(schema.gardenBeds).values({ userId, name: 'A1', polygon: '[[0,0],[1,0],[1,1]]', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).returning({ id: schema.gardenBeds.id }).get()!.id;
	plantId = db.insert(schema.plants).values({ commonName: 'Tomate', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).returning({ id: schema.plants.id }).get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('plant_health_records', () => {
	it('creates, resolves and reopens records', () => {
		const pid = db.insert(schema.plantations).values({ userId, gardenBedId: bedId, plantId, plantName: 'Tomate', status: 'planted', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }).returning({ id: schema.plantations.id }).get()!.id;
		const hid = db.insert(schema.plantHealthRecords).values({ userId, plantationId: pid, type: 'disease', severity: 'high', detectedAt: new Date().toISOString(), createdAt: new Date().toISOString() }).returning({ id: schema.plantHealthRecords.id }).get()!.id;
		let rec = db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, hid)).get()!;
		expect(rec.resolvedAt).toBeNull();
		const now = new Date().toISOString();
		db.update(schema.plantHealthRecords).set({ resolvedAt: now }).where(eq(schema.plantHealthRecords.id, hid)).run();
		rec = db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, hid)).get()!;
		expect(rec.resolvedAt).not.toBeNull();
		db.update(schema.plantHealthRecords).set({ resolvedAt: null }).where(eq(schema.plantHealthRecords.id, hid)).run();
		rec = db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, hid)).get()!;
		expect(rec.resolvedAt).toBeNull();
		db.delete(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, hid)).run();
		expect(db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, hid)).all().length).toBe(0);
	});
});
