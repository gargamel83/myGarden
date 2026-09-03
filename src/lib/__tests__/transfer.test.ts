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

import { createUser } from '../server/auth';
import { exportUserData, importUserData } from '../server/transfer';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: { id: number };
let userB: { id: number };
let tomatoId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-xfer-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userA = createUser('xferA', 'passA');
	userB = createUser('xferB', 'passB');
	tomatoId = db.insert(schema.plants).values({ commonName: 'Tomato' }).returning().get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('exportUserData', () => {
	it('exports beds, plantations, photos and favorites for a user', () => {
		const bed = db.insert(schema.gardenBeds).values({
			userId: userA.id,
			name: 'Carre A',
			polygon: '[[0,0],[10,0],[10,10]]',
			type: 'pixel',
			soilType: 'riche'
		}).returning().get()!;

		db.insert(schema.plantations).values({
			userId: userA.id,
			gardenBedId: bed.id,
			plantId: tomatoId,
			plantName: 'Tomato',
			status: 'sown',
			quantity: 3
		}).run();

		db.insert(schema.gardenPhotos).values({
			userId: userA.id,
			label: 'Plan',
			filename: 'plan.webp'
		}).run();

		db.insert(schema.plantFavorites).values({ userId: userA.id, plantId: tomatoId }).run();

		const data = exportUserData(userA.id);
		expect(data.version).toBe(1);
		expect(data.gardenBeds).toHaveLength(1);
		expect(data.gardenBeds[0].name).toBe('Carre A');
		expect(data.gardenBeds[0].plantations).toHaveLength(1);
		expect(data.gardenBeds[0].plantations[0].plantName).toBe('Tomato');
		expect(data.gardenPhotos).toHaveLength(1);
		expect(data.favoritePlantIds).toContain(tomatoId);
	});

	it('does not export other users data', () => {
		const data = exportUserData(userB.id);
		expect(data.gardenBeds).toHaveLength(0);
		expect(data.gardenPhotos).toHaveLength(0);
		expect(data.favoritePlantIds).toHaveLength(0);
	});
});

describe('importUserData', () => {
	it('recreates beds, plantations, photos and favorites for userB', () => {
		const data = exportUserData(userA.id);
		const counts = importUserData(userB.id, data);

		expect(counts.beds).toBe(1);
		expect(counts.plantations).toBe(1);
		expect(counts.photos).toBe(1);
		expect(counts.favorites).toBe(1);

		const beds = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userB.id)).all();
		expect(beds).toHaveLength(1);
		expect(beds[0].name).toBe('Carre A');

		const plantations = db.select().from(schema.plantations).where(eq(schema.plantations.userId, userB.id)).all();
		expect(plantations).toHaveLength(1);
		expect(plantations[0].plantName).toBe('Tomato');

		const favs = db.select().from(schema.plantFavorites).where(eq(schema.plantFavorites.userId, userB.id)).all();
		expect(favs).toHaveLength(1);
	});
});
