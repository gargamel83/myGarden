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
import { load, actions } from '../../routes/plantations/+page.server';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: { id: number; username: string };
let userB: { id: number; username: string };
let bedA: { id: number };
let plantA: { id: number };

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userA = createUser('userA', 'passA');
	userB = createUser('userB', 'passB');

	bedA = db.insert(schema.gardenBeds).values({
		userId: userA.id,
		name: 'Bed A',
		polygon: '[[0,0],[10,0],[10,10],[0,10]]'
	}).returning().get()!;

	plantA = db.insert(schema.plants).values({
		commonName: 'Tomato',
		latinName: 'Solanum lycopersicum',
		photos: 'tomato.jpg'
	}).returning().get()!;

	db.insert(schema.plantations).values({
		userId: userA.id,
		gardenBedId: bedA.id,
		plantId: plantA.id,
		plantName: 'Tomato',
		status: 'planned'
	}).run();
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('Plantations page - load', () => {
	it('returns empty arrays when user has no data', async () => {
		const event = {
			depends: vi.fn(),
			locals: { user: { id: 9999 } }
		};
		const result = await load(event as any);
		expect(event.depends).toHaveBeenCalledWith('app:plantations');
		expect(result.plantations).toEqual([]);
		expect(result.beds).toEqual([]);
		expect(result.plants.length).toBeGreaterThan(0);
		expect(result.rotationAlerts).toEqual([]);
		expect(result.bedNames).toEqual([]);
	});

	it('returns plantations, beds, plants, rotationAlerts for user', async () => {
		const event = {
			depends: vi.fn(),
			locals: { user: { id: userA.id } }
		};
		const result = await load(event as any);
		expect(result.plantations).toHaveLength(1);
		expect(result.plantations[0].plantName).toBe('Tomato');
		expect(result.plantations[0].bedName).toBe('Bed A');
		expect(result.plantations[0].plantPhotos).toBe('tomato.jpg');
		expect(result.beds).toHaveLength(1);
		expect(result.beds[0].name).toBe('Bed A');
		expect(result.plants.length).toBeGreaterThan(0);
		expect(result.rotationAlerts).toEqual([]);
		expect(result.bedNames).toEqual(['Bed A']);
	});

	it('does NOT return other user plantations', async () => {
		const event = {
			depends: vi.fn(),
			locals: { user: { id: userB.id } }
		};
		const result = await load(event as any);
		expect(result.plantations).toHaveLength(0);
		expect(result.beds).toHaveLength(0);
		expect(result.plants.length).toBeGreaterThan(0);
	});
});

describe('Plantations page - create action', () => {
	it('creates a plantation with correct userId', async () => {
		const formValues: Record<string, string> = {
			gardenBedId: String(bedA.id),
			plantName: 'Carrot',
			plantId: String(plantA.id),
			variety: 'Nantes',
			quantity: '20',
			notes: 'Test notes'
		};
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: (key: string) => formValues[key] ?? null })
			}
		};
		const result = await actions.create(event as any);
		expect(result).toEqual({ success: true });

		const created = db.select().from(schema.plantations)
			.where(eq(schema.plantations.plantName, 'Carrot')).all();
		expect(created).toHaveLength(1);
		expect(created[0].userId).toBe(userA.id);
		expect(created[0].gardenBedId).toBe(bedA.id);
		expect(created[0].plantName).toBe('Carrot');
		expect(created[0].variety).toBe('Nantes');
		expect(created[0].quantity).toBe(20);
		expect(created[0].status).toBe('planned');
	});

	it('returns 400 when gardenBedId/plantName missing', async () => {
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: () => null })
			}
		};
		const result = await actions.create(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Bed and plant name required' } });
	});

	it('sets correct status using computeStatus', async () => {
		const formValues: Record<string, string> = {
			gardenBedId: String(bedA.id),
			plantName: 'Lettuce',
			sowingDate: '2025-04-01',
			plantingDate: '2025-05-01',
			harvestDate: '2025-06-15'
		};
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: (key: string) => formValues[key] ?? null })
			}
		};
		const result = await actions.create(event as any);
		expect(result).toEqual({ success: true });

		const created = db.select().from(schema.plantations)
			.where(eq(schema.plantations.plantName, 'Lettuce')).all();
		expect(created).toHaveLength(1);
		expect(created[0].status).toBe('harvested');
		expect(created[0].sowingDate).toBe('2025-04-01');
		expect(created[0].plantingDate).toBe('2025-05-01');
		expect(created[0].harvestDate).toBe('2025-06-15');
	});
});

describe('Plantations page - update action', () => {
	it('updates an existing plantation', async () => {
		const plantation = db.insert(schema.plantations).values({
			userId: userA.id,
			gardenBedId: bedA.id,
			plantName: 'Bean',
			status: 'planned'
		}).returning().get()!;

		const formValues: Record<string, string> = {
			id: String(plantation.id),
			gardenBedId: String(bedA.id),
			plantName: 'Bean Updated',
			variety: 'Pole',
			quantity: '10'
		};
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: (key: string) => formValues[key] ?? null })
			}
		};
		const result = await actions.update(event as any);
		expect(result).toEqual({ success: true });

		const updated = db.select().from(schema.plantations)
			.where(eq(schema.plantations.id, plantation.id)).get()!;
		expect(updated.plantName).toBe('Bean Updated');
		expect(updated.variety).toBe('Pole');
		expect(updated.quantity).toBe(10);
	});

	it('returns 400 when required fields missing', async () => {
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: () => null })
			}
		};
		const result = await actions.update(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Missing required fields' } });
	});
});

describe('Plantations page - updateStatus action', () => {
	it("updates status to 'sown' and sets sowingDate to today", async () => {
		const plantation = db.insert(schema.plantations).values({
			userId: userA.id,
			gardenBedId: bedA.id,
			plantName: 'Radish',
			status: 'planned'
		}).returning().get()!;

		const today = new Date().toISOString().split('T')[0];
		const formValues: Record<string, string> = {
			id: String(plantation.id),
			status: 'sown'
		};
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: (key: string) => formValues[key] ?? null })
			}
		};
		const result = await actions.updateStatus(event as any);
		expect(result).toEqual({ success: true });

		const updated = db.select().from(schema.plantations)
			.where(eq(schema.plantations.id, plantation.id)).get()!;
		expect(updated.status).toBe('sown');
		expect(updated.sowingDate).toBe(today);
	});

	it('returns 400 when ID missing', async () => {
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: () => null })
			}
		};
		const result = await actions.updateStatus(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'ID required' } });
	});
});

describe('Plantations page - delete action', () => {
	it('deletes a plantation', async () => {
		const plantation = db.insert(schema.plantations).values({
			userId: userA.id,
			gardenBedId: bedA.id,
			plantName: 'ToDelete',
			status: 'planned'
		}).returning().get()!;

		const formValues: Record<string, string> = {
			id: String(plantation.id)
		};
		const event = {
			locals: { user: { id: userA.id } },
			request: {
				formData: vi.fn().mockResolvedValue({ get: (key: string) => formValues[key] ?? null })
			}
		};
		const result = await actions.delete(event as any);
		expect(result).toEqual({ success: true });

		const deleted = db.select().from(schema.plantations)
			.where(eq(schema.plantations.id, plantation.id)).get();
		expect(deleted).toBeUndefined();
	});
});
