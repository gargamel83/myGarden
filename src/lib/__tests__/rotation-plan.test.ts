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

import { buildRotationPlan, type BedPlantHistory } from '../server/rotation';
import * as rotation from '../server/rotation';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let bedId: number;

beforeAll(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => {});
	tmpDir = mkdtempSync('/tmp/monjardin-plan-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	const userId = db.insert(schema.users).values({ username: 'planUser', passwordHash: 'x', createdAt: new Date().toISOString() }).returning({ id: schema.users.id }).get()!.id;

	bedId = db.insert(schema.gardenBeds).values({
		userId, name: 'Plan Bed', polygon: '[]', type: 'pixel'
	}).returning({ id: schema.gardenBeds.id }).get()!.id;

	// Seed plants across a few families
	const plants: Array<[string, string]> = [
		['Tomato', 'Solanaceae'],
		['Pepper', 'Solanaceae'],
		['Bean', 'Fabaceae'],
		['Pea', 'Fabaceae'],
		['Cabbage', 'Brassicaceae'],
		['Radish', 'Brassicaceae'],
		['Onion', 'Amaryllidaceae'],
		['Carrot', 'Apiaceae'],
		['Lettuce', 'Asteraceae']
	];
	for (const [name, family] of plants) {
		db.insert(schema.plants).values({
			commonName: name, family,
			sowingStart: '03-01', sowingEnd: '06-01'
		}).run();
	}
	// Reset the module-level cache so it picks up the seeded plants
	(rotation as any)._allPlants = null;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('buildRotationPlan', () => {
	it('generates one entry per year', () => {
		const plan = buildRotationPlan(bedId, 'Plan Bed', [], 3);
		expect(plan.entries).toHaveLength(3);
		expect(plan.entries[0].year).toBe(new Date().getFullYear());
		expect(plan.entries[1].year).toBe(new Date().getFullYear() + 1);
	});

	it('does not repeat the same family in consecutive years', () => {
		const plan = buildRotationPlan(bedId, 'Plan Bed', [], 5);
		for (let i = 1; i < plan.entries.length; i++) {
			if (plan.entries[i].family === '—') continue;
			expect(plan.entries[i].family).not.toBe(plan.entries[i - 1].family);
		}
	});

	it('avoid the family of a previously harvested crop when it is too recent', () => {
		const year = new Date().getFullYear();
		const history: BedPlantHistory[] = [
			{ plantId: 1, plantName: 'Tomato', family: 'Solanaceae', year: year - 1, status: 'harvested' }
		];
		const plan = buildRotationPlan(bedId, 'Plan Bed', history, 1);
		// Solanaceae should be avoided in the current year (only 1 year since)
		expect(plan.entries[0].family).not.toBe('Solanaceae');
	});

	it('includes suggested plant names for the chosen family', () => {
		const plan = buildRotationPlan(bedId, 'Plan Bed', [], 2);
		for (const entry of plan.entries) {
			if (entry.family === '—') continue;
			expect(entry.plantNames.length).toBeGreaterThan(0);
		}
	});
});
