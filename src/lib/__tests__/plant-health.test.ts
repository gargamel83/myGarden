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
import { load, actions } from '../../routes/plantations/+page.server';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: { id: number };
let userB: { id: number };
let bedA: { id: number };
let bedB: { id: number };

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-health-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userA = createUser('healthA', 'passA');
	userB = createUser('healthB', 'passB');

	bedA = db.insert(schema.gardenBeds).values({
		userId: userA.id, name: 'Bed A', polygon: '[]', type: 'pixel'
	}).returning({ id: schema.gardenBeds.id }).get()!;
	bedB = db.insert(schema.gardenBeds).values({
		userId: userB.id, name: 'Bed B', polygon: '[]', type: 'pixel'
	}).returning({ id: schema.gardenBeds.id }).get()!;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
	db.delete(schema.plantHealthRecords).run();
	db.delete(schema.plantations).run();
});

function createPlantation(userId: number, bedId: number, plantName = 'Tomate'): number {
	return db.insert(schema.plantations).values({
		userId, gardenBedId: bedId, plantName, status: 'planted'
	}).returning({ id: schema.plantations.id }).get()!.id;
}

function formEvent(values: Record<string, string>, userId = userA.id) {
	return {
		locals: { user: { id: userId } },
		request: {
			formData: vi.fn().mockResolvedValue({ get: (key: string) => values[key] ?? null })
		}
	};
}

describe('plant health - addHealth', () => {
	it('creates a health record owned by the user', async () => {
		const plantationId = createPlantation(userA.id, bedA.id);

		const result = await actions.addHealth(formEvent({
			plantationId: String(plantationId),
			type: 'pest',
			severity: 'high',
			detectedAt: '2026-06-20',
			treatment: 'savon noir',
			notes: 'pucerons sur les jeunes pousses',
			photo: '/uploads/aphids.webp'
		}) as any);

		expect(result).toEqual({ success: true });

		const records = db.select().from(schema.plantHealthRecords)
			.where(eq(schema.plantHealthRecords.plantationId, plantationId)).all();
		expect(records).toHaveLength(1);
		expect(records[0].userId).toBe(userA.id);
		expect(records[0].type).toBe('pest');
		expect(records[0].severity).toBe('high');
		expect(records[0].detectedAt).toBe('2026-06-20');
		expect(records[0].treatment).toBe('savon noir');
		expect(records[0].resolvedAt).toBeNull();
	});

	it('defaults type to disease and severity to medium', async () => {
		const plantationId = createPlantation(userA.id, bedA.id);

		const result = await actions.addHealth(formEvent({ plantationId: String(plantationId) }) as any);

		expect(result).toEqual({ success: true });
		const record = db.select().from(schema.plantHealthRecords).get()!;
		expect(record.type).toBe('disease');
		expect(record.severity).toBe('medium');
	});

	it('returns 400 when plantationId is missing', async () => {
		const result = await actions.addHealth(formEvent({ type: 'pest' }) as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Plantation ID required' } });
	});

	it('returns 400 for an invalid type', async () => {
		const plantationId = createPlantation(userA.id, bedA.id);
		const result = await actions.addHealth(formEvent({ plantationId: String(plantationId), type: 'alien' }) as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Invalid health issue type' } });
	});

	it('returns 400 for an invalid severity', async () => {
		const plantationId = createPlantation(userA.id, bedA.id);
		const result = await actions.addHealth(formEvent({ plantationId: String(plantationId), severity: 'extreme' }) as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Invalid severity' } });
	});

	it('returns 404 for an unknown plantation', async () => {
		const result = await actions.addHealth(formEvent({ plantationId: '99999' }) as any);
		expect(result).toHaveProperty('status', 404);
	});

	it("rejects adding a record on another user's plantation", async () => {
		const plantationB = createPlantation(userB.id, bedB.id, 'Carotte');
		const result = await actions.addHealth(formEvent({ plantationId: String(plantationB) }) as any);
		expect(result).toHaveProperty('status', 403);
		expect(db.select().from(schema.plantHealthRecords).all()).toHaveLength(0);
	});
});

describe('plant health - resolve / reopen / delete', () => {
	function createRecord(userId = userA.id): number {
		const plantationId = createPlantation(userId, userId === userA.id ? bedA.id : bedB.id);
		return db.insert(schema.plantHealthRecords).values({
			userId,
			plantationId,
			type: 'disease',
			severity: 'medium',
			detectedAt: new Date().toISOString()
		}).returning({ id: schema.plantHealthRecords.id }).get()!.id;
	}

	it('marks a record as resolved then reopens it', async () => {
		const id = createRecord();

		expect(await actions.resolveHealth(formEvent({ id: String(id) }) as any)).toEqual({ success: true });
		let record = db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, id)).get()!;
		expect(record.resolvedAt).toBeTruthy();

		expect(await actions.reopenHealth(formEvent({ id: String(id) }) as any)).toEqual({ success: true });
		record = db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, id)).get()!;
		expect(record.resolvedAt).toBeNull();
	});

	it('deletes a record owned by the user', async () => {
		const id = createRecord();
		expect(await actions.deleteHealth(formEvent({ id: String(id) }) as any)).toEqual({ success: true });
		expect(db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, id)).get()).toBeUndefined();
	});

	it('returns 400 when the id is missing', async () => {
		expect(await actions.resolveHealth(formEvent({}) as any)).toMatchObject({ status: 400 });
		expect(await actions.deleteHealth(formEvent({}) as any)).toMatchObject({ status: 400 });
	});

	it('returns 404 for an unknown record', async () => {
		expect(await actions.resolveHealth(formEvent({ id: '99999' }) as any)).toHaveProperty('status', 404);
	});

	it("rejects resolving or deleting another user's record", async () => {
		const id = createRecord(userB.id);

		expect(await actions.resolveHealth(formEvent({ id: String(id) }) as any)).toHaveProperty('status', 403);
		expect(await actions.deleteHealth(formEvent({ id: String(id) }) as any)).toHaveProperty('status', 403);

		const record = db.select().from(schema.plantHealthRecords).where(eq(schema.plantHealthRecords.id, id)).get()!;
		expect(record).toBeTruthy();
		expect(record.resolvedAt).toBeNull();
	});
});

describe('plant health - plantation deletion', () => {
	it('deletes the health records when the plantation is deleted', async () => {
		const plantationId = createPlantation(userA.id, bedA.id);
		db.insert(schema.plantHealthRecords).values({
			userId: userA.id, plantationId, detectedAt: '2026-06-01'
		}).run();

		const result = await actions.delete(formEvent({ id: String(plantationId) }) as any);
		expect(result).toEqual({ success: true });

		expect(db.select().from(schema.plantHealthRecords)
			.where(eq(schema.plantHealthRecords.plantationId, plantationId)).all()).toHaveLength(0);
		expect(db.select().from(schema.plantations)
			.where(eq(schema.plantations.id, plantationId)).get()).toBeUndefined();
	});
});

describe('plant health - load grouping', () => {	it('groups health records by plantation for the current user only', async () => {
		const plantationA1 = createPlantation(userA.id, bedA.id, 'Tomate');
		const plantationA2 = createPlantation(userA.id, bedA.id, 'Courgette');
		const plantationB = createPlantation(userB.id, bedB.id, 'Carotte');

		db.insert(schema.plantHealthRecords).values([
			{ userId: userA.id, plantationId: plantationA1, type: 'disease', severity: 'low', detectedAt: '2026-06-01' },
			{ userId: userA.id, plantationId: plantationA1, type: 'pest', severity: 'high', detectedAt: '2026-06-02' },
			{ userId: userA.id, plantationId: plantationA2, type: 'deficiency', severity: 'medium', detectedAt: '2026-06-03' },
			{ userId: userB.id, plantationId: plantationB, type: 'other', severity: 'low', detectedAt: '2026-06-04' }
		]).run();

		const data: any = await load({ locals: { user: { id: userA.id } }, depends: () => {} } as any);

		expect(data.healthByPlantation[plantationA1]).toHaveLength(2);
		expect(data.healthByPlantation[plantationA2]).toHaveLength(1);
		expect(data.healthByPlantation[plantationB]).toBeUndefined();
	});
});
