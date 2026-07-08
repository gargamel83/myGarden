import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../server/db/schema';

const testDbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('../server/db', () => ({
	get db() { return testDbRef.current; }
}));

import { getRotationAlerts } from '../server/rotation';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: number;
let userB: number;

beforeAll(() => {
	// Silence getAllPlants cache warning
	vi.spyOn(console, 'warn').mockImplementation(() => {});

	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userA = db.insert(schema.users).values({ username: 'alertA', passwordHash: 'x', createdAt: new Date().toISOString() }).returning({ id: schema.users.id }).get()!.id;
	userB = db.insert(schema.users).values({ username: 'alertB', passwordHash: 'x', createdAt: new Date().toISOString() }).returning({ id: schema.users.id }).get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('getRotationAlerts with userId', () => {
	it('should return no alerts when user has no beds', async () => {
		const alerts = await getRotationAlerts(userA);
		expect(alerts).toEqual([]);
	});

	it('should return no alerts for user with a bed but no harvests', async () => {
		db.insert(schema.gardenBeds).values({ id: 1, userId: userA, name: 'Bed A', polygon: '[]', type: 'pixel' }).run();
		const alerts = await getRotationAlerts(userA);
		expect(alerts).toEqual([]);
	});

	it('should not return alerts for userB data when querying for userA', async () => {
		db.insert(schema.gardenBeds).values({ id: 2, userId: userB, name: 'Bed B', polygon: '[]', type: 'pixel' }).run();
		const alerts = await getRotationAlerts(userA);
		expect(alerts).toEqual([]);
	});

	it('should return info alert for userA bed with harvested plantation', async () => {
		db.insert(schema.plants).values({ id: 1, commonName: 'Tomate', family: 'Solanaceae' }).run();
		db.insert(schema.plantations).values({
			id: 1,
			userId: userA,
			gardenBedId: 1,
			plantId: 1,
			plantName: 'Tomate',
			status: 'harvested',
			actualHarvestDate: new Date('2025-08-01').toISOString()
		}).run();

		const alerts = await getRotationAlerts(userA);
		expect(alerts.length).toBeGreaterThanOrEqual(1);
		expect(alerts[0].type).toBe('info');
		expect(alerts[0].bedId).toBe(1);
	});

	it('should isolate alerts per user', async () => {
		const userAAlerts = await getRotationAlerts(userA);
		const userBAlerts = await getRotationAlerts(userB);
		expect(userAAlerts.length).toBeGreaterThanOrEqual(1);
		expect(userBAlerts).toEqual([]);
	});

	it('should return all alerts when called without userId', async () => {
		const allAlerts = await getRotationAlerts();
		expect(allAlerts.length).toBeGreaterThanOrEqual(1);
	});
});
