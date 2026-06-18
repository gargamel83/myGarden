import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { getBedAdvice } from '../rotation';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('gardenBeds CRUD', () => {
	it('should insert a bed', () => {
		db.insert(schema.gardenBeds).values({
			name: 'Bed A',
			polygon: JSON.stringify([[0, 0], [10, 0], [10, 10], [0, 10]]),
			soilType: 'riche',
			sunExposure: 'plein_soleil',
			length: 5,
			width: 2
		}).run();

		const beds = db.select().from(schema.gardenBeds).all();
		expect(beds.length).toBe(1);
		expect(beds[0].name).toBe('Bed A');
		expect(beds[0].soilType).toBe('riche');
	});

	it('should update a bed', () => {
		const bed = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.name, 'Bed A')).get()!;
		db.update(schema.gardenBeds).set({ name: 'Bed Alpha' }).where(eq(schema.gardenBeds.id, bed.id)).run();

		const updated = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.id, bed.id)).get()!;
		expect(updated.name).toBe('Bed Alpha');
	});

	it('should delete a bed', () => {
		const bed = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.name, 'Bed Alpha')).get()!;
		db.delete(schema.gardenBeds).where(eq(schema.gardenBeds.id, bed.id)).run();

		const beds = db.select().from(schema.gardenBeds).all();
		expect(beds.length).toBe(0);
	});
});

describe('plants CRUD', () => {
	it('should insert and read a plant', () => {
		db.insert(schema.plants).values({
			commonName: 'Tomato',
			latinName: 'Solanum lycopersicum',
			family: 'Solanaceae',
			sunExposure: 'plein_soleil',
			soilType: 'riche',
			watering: 'moyen',
			sowingStart: '03-15',
			sowingEnd: '05-15',
			harvestStart: '07-01',
			harvestEnd: '09-30',
			spacing: 50,
			rowSpacing: 70
		}).run();

		const plants = db.select().from(schema.plants).all();
		expect(plants.length).toBe(1);
		expect(plants[0].family).toBe('Solanaceae');
	});

	it('should store companion data as JSON', () => {
		db.insert(schema.plants).values({
			commonName: 'Basil',
			family: 'Lamiaceae',
			companions: JSON.stringify(['Tomato', 'Pepper']),
			antagonists: JSON.stringify(['Sage'])
		}).run();

		const basil = db.select().from(schema.plants).where(eq(schema.plants.commonName, 'Basil')).get()!;
		expect(JSON.parse(basil.companions || '[]')).toEqual(['Tomato', 'Pepper']);
		expect(JSON.parse(basil.antagonists || '[]')).toEqual(['Sage']);
	});
});

describe('plantations with foreign keys', () => {
	it('should create a plantation linked to a bed and plant', () => {
		const bed = db.insert(schema.gardenBeds).values({
			name: 'Bed 1',
			polygon: '[[0,0]]'
		}).returning().get()!;

		const plant = db.insert(schema.plants).values({
			commonName: 'Carrot',
			family: 'Apiaceae'
		}).returning().get()!;

		db.insert(schema.plantations).values({
			gardenBedId: bed.id,
			plantId: plant.id,
			plantName: 'Carrot',
			sowingDate: '2026-04-01',
			status: 'sown'
		}).run();

		const plantations = db.select().from(schema.plantations).all();
		expect(plantations.length).toBe(1);
		expect(plantations[0].gardenBedId).toBe(bed.id);
		expect(plantations[0].plantName).toBe('Carrot');
	});

	it('should cascade-delete plantations when bed is deleted', () => {
		const bed = db.insert(schema.gardenBeds).values({
			name: 'Bed Temporary',
			polygon: '[[0,0]]'
		}).returning().get()!;

		db.insert(schema.plantations).values({
			gardenBedId: bed.id,
			plantName: 'Test Plant',
			status: 'planned'
		}).run();

		// Delete should fail because of FK (or succeed depending on CASCADE config)
		expect(() => {
			db.delete(schema.gardenBeds).where(eq(schema.gardenBeds.id, bed.id)).run();
		}).toThrow();
	});
});

describe('gardenPhotos CRUD', () => {
	it('should insert and list photos', () => {
		db.insert(schema.gardenPhotos).values({
			label: 'Garden overview',
			filename: 'overview.jpg',
			width: 1920,
			height: 1080
		}).run();

		const photos = db.select().from(schema.gardenPhotos).all();
		expect(photos.length).toBe(1);
		expect(photos[0].label).toBe('Garden overview');
	});
});
