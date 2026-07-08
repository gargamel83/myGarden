import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { eq } from 'drizzle-orm';

import * as schema from '../server/db/schema';

const testDbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('../server/db', () => ({
	get db() { return testDbRef.current; }
}));

vi.mock('$lib/server/rotation', () => ({
	getRotationAlerts: vi.fn().mockResolvedValue([])
}));

import { load } from '../../routes/+page.server';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userId: number;

function mkEvent(uid: number) {
	return { depends: vi.fn(), locals: { user: { id: uid } } } as any;
}

function insertBed(name: string, overrides: Partial<typeof schema.gardenBeds.$inferInsert> = {}) {
	return db.insert(schema.gardenBeds).values({
		userId,
		name,
		polygon: '[[0,0],[10,0],[10,10],[0,10]]',
		length: 10,
		width: 10,
		...overrides
	}).returning().get()!;
}

function insertPlantation(overrides: Partial<typeof schema.plantations.$inferInsert>) {
	return db.insert(schema.plantations).values({
		userId: overrides.userId ?? userId,
		gardenBedId: overrides.gardenBedId!,
		plantName: overrides.plantName ?? 'TestPlant',
		status: overrides.status ?? 'active',
		...overrides
	}).run();
}

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userId = db.insert(schema.users).values({
		username: 'dashboard-test-user',
		passwordHash: 'x'
	}).returning().get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

afterEach(() => {
	db.delete(schema.plantations).where(eq(schema.plantations.userId, userId)).run();
	db.delete(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userId)).run();
});

describe('dashboard page server load function', () => {
	it('should return empty stats when user has no data', async () => {
		const result: any = await load(mkEvent(userId));

		expect(result.stats.bedCount).toBe(0);
		expect(result.stats.plantCount).toBe(0);
		expect(result.stats.activeCount).toBe(0);
		expect(result.stats.harvestedCount).toBe(0);
		expect(result.stats.plannedCount).toBe(0);
		expect(result.stats.totalArea).toBe(0);
		expect(result.stats.avgBedSize).toBe(0);
		expect(result.active).toEqual([]);
		expect(result.recentActivity).toEqual([]);
		expect(result.topCrops).toEqual([]);
		expect(result.occupationByMonth).toHaveLength(12);
		expect(result.rotationAlerts).toEqual([]);
		expect(result.sowingAlerts).toEqual([]);
		expect(result.harvestAlerts).toEqual([]);
		expect(result.advanced.successRate).toBe(0);
		expect(result.advanced.avgCycleDays).toBe(0);
		expect(result.advanced.completedCycles).toBe(0);
		expect(result.advanced.plantationsByMonth).toHaveLength(12);
		expect(result.advanced.familyDistribution).toEqual([]);
		expect(result.advanced.bedUtilization).toEqual([]);
	});

	it('should return correct bedCount', async () => {
		insertBed('Bed A');
		insertBed('Bed B');

		const result: any = await load(mkEvent(userId));

		expect(result.stats.bedCount).toBe(2);
		expect(result.stats.totalArea).toBe(200);
		expect(result.stats.avgBedSize).toBe(100);
	});

	it('should not count other user beds', async () => {
		const otherId = db.insert(schema.users).values({
			username: 'other-user-beds',
			passwordHash: 'x'
		}).returning().get()!.id;

		insertBed('My Bed');
		db.insert(schema.gardenBeds).values([
			{ userId: otherId, name: 'Other 1', polygon: '[[0,0],[5,0],[5,5],[0,5]]' },
			{ userId: otherId, name: 'Other 2', polygon: '[[0,0],[5,0],[5,5],[0,5]]' }
		]).run();

		const result: any = await load(mkEvent(userId));

		expect(result.stats.bedCount).toBe(1);
	});

	it('should count active/harvested/planned plantations', async () => {
		const bed = insertBed('Bed');
		insertPlantation({ gardenBedId: bed.id, plantName: 'Tomato', status: 'active' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Carrot', status: 'sown' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Lettuce', status: 'harvested' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Bean', status: 'planned' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Radish', status: 'cancelled' });

		const result: any = await load(mkEvent(userId));

		expect(result.stats.activeCount).toBe(3);
		expect(result.stats.harvestedCount).toBe(1);
		expect(result.stats.plannedCount).toBe(1);
	});

	it('should return rotationAlerts', async () => {
		const result: any = await load(mkEvent(userId));

		expect(result).toHaveProperty('rotationAlerts');
		expect(Array.isArray(result.rotationAlerts)).toBe(true);
	});

	it('should return topCrops sorted by count', async () => {
		const bed = insertBed('Bed');
		insertPlantation({ gardenBedId: bed.id, plantName: 'Tomato', status: 'active' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Tomato', status: 'planned' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Tomato', status: 'harvested' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Carrot', status: 'active' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Carrot', status: 'harvested' });
		insertPlantation({ gardenBedId: bed.id, plantName: 'Bean', status: 'planned' });

		const result: any = await load(mkEvent(userId));

		expect(result.topCrops).toEqual([
			{ name: 'Tomato', count: 3 },
			{ name: 'Carrot', count: 2 },
			{ name: 'Bean', count: 1 },
		]);
	});

	it('should filter active plantations to 10 items', async () => {
		const bed = insertBed('Bed');

		for (let i = 0; i < 15; i++) {
			insertPlantation({ gardenBedId: bed.id, plantName: `Plant ${i}`, status: 'active' });
		}

		const result: any = await load(mkEvent(userId));

		expect(result.active).toHaveLength(10);
		expect(result.stats.activeCount).toBe(15);
	});
});
