import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
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
import { actions, load } from '../../routes/plantations/+page.server';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: { id: number };
let bedA: { id: number };
let plantationId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-harvest-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userA = createUser('harvestA', 'passA');
	bedA = db.insert(schema.gardenBeds).values({
		userId: userA.id, name: 'Bed A', polygon: '[]', type: 'pixel'
	}).returning({ id: schema.gardenBeds.id }).get()!;
	plantationId = db.insert(schema.plantations).values({
		userId: userA.id, gardenBedId: bedA.id, plantName: 'Tomato', status: 'planned'
	}).returning({ id: schema.plantations.id }).get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

function formEvent(values: Record<string, string>, userId = userA.id) {
	return {
		locals: { user: { id: userId } },
		request: {
			formData: vi.fn().mockResolvedValue({ get: (key: string) => values[key] ?? null })
		}
	};
}

describe('harvest records addHarvest', () => {
	it('adds a harvest record and marks the plantation as harvested', async () => {
		const event = formEvent({ plantationId: String(plantationId), weightKg: '0.6', quantity: '5', condition: 'ripe', notes: 'nice' });
		const result = await actions.addHarvest(event as any);

		expect(result).toEqual({ success: true });

		const records = db.select().from(schema.harvestRecords).where(eq(schema.harvestRecords.plantationId, plantationId)).all();
		expect(records).toHaveLength(1);
		expect(records[0].weightKg).toBe(0.6);

		const p = db.select().from(schema.plantations).where(eq(schema.plantations.id, plantationId)).get();
		expect(p?.status).toBe('harvested');
	});

	it('rejects a harvest on another user plantation', async () => {
		const otherUser = createUser('harvestOther', 'passX');
		const bedB = db.insert(schema.gardenBeds).values({
			userId: otherUser.id, name: 'Bed B', polygon: '[]', type: 'pixel'
		}).returning({ id: schema.gardenBeds.id }).get()!;
		const pB = db.insert(schema.plantations).values({
			userId: otherUser.id, gardenBedId: bedB.id, plantName: 'Carrot', status: 'planned'
		}).returning({ id: schema.plantations.id }).get()!.id;

		const event = formEvent({ plantationId: String(pB), weightKg: '1' }, userA.id);
		const result = await actions.addHarvest(event as any);

		expect(result).toHaveProperty('status', 403);
		const records = db.select().from(schema.harvestRecords).where(eq(schema.harvestRecords.plantationId, pB)).all();
		expect(records).toHaveLength(0);
	});
});

describe('harvest records load grouping', () => {
	it('groups harvest records by plantation in load', async () => {
		const started = db.select().from(schema.plantations).where(eq(schema.plantations.id, plantationId)).get();
		// plantation was already marked harvested by the previous test
		void started;

		const data: any = await load({ locals: { user: { id: userA.id } }, depends: () => {} } as any);
		const harvests = data.harvestsByPlantation[plantationId] || [];
		expect(harvests.length).toBeGreaterThanOrEqual(1);
	});
});

describe('harvest records deleteHarvest', () => {
	it('deletes a harvest record owned by the user', async () => {
		const record = db.select().from(schema.harvestRecords).where(eq(schema.harvestRecords.plantationId, plantationId)).get()!;
		const event = formEvent({ id: String(record.id) });
		const result = await actions.deleteHarvest(event as any);

		expect(result).toEqual({ success: true });
		const remaining = db.select().from(schema.harvestRecords).where(eq(schema.harvestRecords.plantationId, plantationId)).all();
		expect(remaining).toHaveLength(0);
	});

	it('rejects deleting another user harvest record', async () => {
		const otherUser = createUser('harvestDelOther', 'passY');
		const bedB = db.insert(schema.gardenBeds).values({
			userId: otherUser.id, name: 'Bed C', polygon: '[]', type: 'pixel'
		}).returning({ id: schema.gardenBeds.id }).get()!;
		const pB = db.insert(schema.plantations).values({
			userId: otherUser.id, gardenBedId: bedB.id, plantName: 'Lettuce', status: 'planned'
		}).returning({ id: schema.plantations.id }).get()!.id;
		const recB = db.insert(schema.harvestRecords).values({
			userId: otherUser.id, plantationId: pB, weightKg: 2, harvestedAt: new Date().toISOString()
		}).returning({ id: schema.harvestRecords.id }).get()!.id;

		const event = formEvent({ id: String(recB) }, userA.id);
		const result = await actions.deleteHarvest(event as any);
		expect(result).toHaveProperty('status', 403);

		const still = db.select().from(schema.harvestRecords).where(eq(schema.harvestRecords.id, recB)).get();
		expect(still).toBeTruthy();
	});
});
