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

import { load } from '../../routes/diseases/+page.server';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-diseases-page-');
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

describe('Diseases page - load', () => {
	it('returns an empty list when the library is empty', async () => {
		const depends = vi.fn();
		const result: any = await load({ depends } as any);
		expect(depends).toHaveBeenCalledWith('app:diseases');
		expect(result.diseases).toEqual([]);
	});

	it('returns diseases sorted by name with parsed host plants and photos', async () => {
		db.insert(schema.diseases).values([
			{
				name: 'Oïdium',
				latinName: 'Erysiphe spp.',
				symptoms: 'Feutrage blanc',
				hostPlants: '["Courgette","Vigne"]',
				photos: '["https://example.org/oidium.jpg"]'
			},
			{
				name: 'Mildiou',
				latinName: 'Phytophthora infestans',
				symptoms: 'Taches brunes',
				hostPlants: '["Tomate","Pomme de terre"]',
				photos: '[]'
			}
		]).run();

		const result: any = await load({ depends: () => {} } as any);

		expect(result.diseases.map((d: { name: string }) => d.name)).toEqual(['Mildiou', 'Oïdium']);
		expect(result.diseases[0].hostPlants).toEqual(['Tomate', 'Pomme de terre']);
		expect(result.diseases[0].photos).toEqual([]);
		expect(result.diseases[1].hostPlants).toEqual(['Courgette', 'Vigne']);
		expect(result.diseases[1].photos).toEqual(['https://example.org/oidium.jpg']);
	});
});
