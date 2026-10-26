import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

const testDbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('../db/index', () => ({
	get db() { return testDbRef.current; }
}));

import { diseaseSeeds, seedDiseases } from '../db/seed-diseases';

let tmpDir: string;
let sqlite: Database.Database;
let db: BetterSQLite3Database<typeof schema>;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-diseases-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('disease seed data', () => {
	it('should contain at least 20 entries', () => {
		expect(diseaseSeeds.length).toBeGreaterThanOrEqual(20);
	});

	it('should have unique names', () => {
		const names = diseaseSeeds.map(d => d.name);
		const duplicates = names.filter((name, i) => names.indexOf(name) !== i);
		expect(duplicates).toEqual([]);
	});

	it('should have all descriptive fields filled in French', () => {
		for (const disease of diseaseSeeds) {
			expect(disease.name, 'missing name').toBeTruthy();
			expect(disease.symptoms, `${disease.name}: missing symptoms`).toBeTruthy();
			expect(disease.causes, `${disease.name}: missing causes`).toBeTruthy();
			expect(disease.treatments, `${disease.name}: missing treatments`).toBeTruthy();
			expect(disease.prevention, `${disease.name}: missing prevention`).toBeTruthy();
		}
	});

	it('should have 2 to 4 host plants as a JSON array', () => {
		for (const disease of diseaseSeeds) {
			const parsed = JSON.parse(disease.hostPlants as string);
			expect(Array.isArray(parsed), `${disease.name}: hostPlants is not an array`).toBe(true);
			expect(parsed.length, `${disease.name}: expected 2-4 host plants`).toBeGreaterThanOrEqual(2);
			expect(parsed.length, `${disease.name}: expected 2-4 host plants`).toBeLessThanOrEqual(4);
			for (const plant of parsed) {
				expect(typeof plant, `${disease.name}: host plant is not a string`).toBe('string');
			}
		}
	});

	it('should have a valid photos JSON array', () => {
		for (const disease of diseaseSeeds) {
			expect(() => JSON.parse(disease.photos as string), `${disease.name}: invalid photos JSON`).not.toThrow();
			const parsed = JSON.parse(disease.photos as string);
			expect(Array.isArray(parsed), `${disease.name}: photos is not an array`).toBe(true);
			for (const url of parsed) {
				expect(url, `${disease.name}: photo URL does not start with http`).toMatch(/^http/);
			}
		}
	});
});

describe('seedDiseases', () => {
	it('inserts every disease on the first run', () => {
		const inserted = seedDiseases(db, false);
		expect(inserted).toBe(diseaseSeeds.length);

		const rows = db.select().from(schema.diseases).all();
		expect(rows).toHaveLength(diseaseSeeds.length);
	});

	it('is idempotent: running it twice keeps the same row count', () => {
		const before = db.select().from(schema.diseases).all().length;
		const inserted = seedDiseases(db, false);
		const after = db.select().from(schema.diseases).all().length;

		expect(inserted).toBe(0);
		expect(after).toBe(before);
		expect(after).toBe(diseaseSeeds.length);
	});

	it('overwrites existing rows in force mode', () => {
		const target = diseaseSeeds[0];
		db.update(schema.diseases)
			.set({ symptoms: 'obsolète' })
			.where(eq(schema.diseases.name, target.name!))
			.run();

		const updated = seedDiseases(db, true);
		expect(updated).toBe(diseaseSeeds.length);

		const row = db.select().from(schema.diseases).where(eq(schema.diseases.name, target.name!)).get()!;
		expect(row.symptoms).toBe(target.symptoms);
		expect(db.select().from(schema.diseases).all()).toHaveLength(diseaseSeeds.length);
	});
});
