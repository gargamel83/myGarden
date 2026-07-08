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

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: { id: number; username: string };
let userB: { id: number; username: string };

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
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('gardenBeds isolation', () => {
	it('userA can see their own garden bed', () => {
		db.insert(schema.gardenBeds).values({
			userId: userA.id,
			name: 'Bed A',
			polygon: '[[0,0],[10,0],[10,10],[0,10]]'
		}).run();

		const beds = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userA.id)).all();
		expect(beds).toHaveLength(1);
		expect(beds[0].name).toBe('Bed A');
	});

	it('userB cannot see userA garden beds', () => {
		const beds = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userB.id)).all();
		expect(beds).toHaveLength(0);
	});
});

describe('plantations isolation', () => {
	it('userA can see their own plantation', () => {
		const bed = db.insert(schema.gardenBeds).values({
			userId: userA.id,
			name: 'Bed for Plantation',
			polygon: '[[0,0]]'
		}).returning().get()!;

		db.insert(schema.plantations).values({
			userId: userA.id,
			gardenBedId: bed.id,
			plantName: 'Tomato',
			status: 'planned'
		}).run();

		const plantations = db.select().from(schema.plantations).where(eq(schema.plantations.userId, userA.id)).all();
		expect(plantations).toHaveLength(1);
		expect(plantations[0].plantName).toBe('Tomato');
	});

	it('userB cannot see userA plantations', () => {
		const plantations = db.select().from(schema.plantations).where(eq(schema.plantations.userId, userB.id)).all();
		expect(plantations).toHaveLength(0);
	});
});

describe('notifications isolation', () => {
	it('userA can see their own notification', () => {
		db.insert(schema.notifications).values({
			userId: userA.id,
			type: 'test',
			key: 'iso-test-a',
			message: 'notification for userA',
			createdAt: new Date().toISOString()
		}).run();

		const notifs = db.select().from(schema.notifications).where(eq(schema.notifications.userId, userA.id)).all();
		expect(notifs).toHaveLength(1);
		expect(notifs[0].message).toBe('notification for userA');
	});

	it('userB cannot see userA notifications', () => {
		const notifs = db.select().from(schema.notifications).where(eq(schema.notifications.userId, userB.id)).all();
		expect(notifs).toHaveLength(0);
	});
});

describe('gardenPhotos isolation', () => {
	it('userA can see their own photo', () => {
		db.insert(schema.gardenPhotos).values({
			userId: userA.id,
			label: 'Photo A',
			filename: 'photo-a.jpg'
		}).run();

		const photos = db.select().from(schema.gardenPhotos).where(eq(schema.gardenPhotos.userId, userA.id)).all();
		expect(photos).toHaveLength(1);
		expect(photos[0].label).toBe('Photo A');
	});

	it('userB cannot see userA photos', () => {
		const photos = db.select().from(schema.gardenPhotos).where(eq(schema.gardenPhotos.userId, userB.id)).all();
		expect(photos).toHaveLength(0);
	});
});

describe('cross-user insert isolation', () => {
	it('data inserted for userB does not affect userA query results', () => {
		const bed = db.insert(schema.gardenBeds).values({
			userId: userB.id,
			name: 'Bed B',
			polygon: '[[0,0]]'
		}).returning().get()!;

		db.insert(schema.plantations).values({
			userId: userB.id,
			gardenBedId: bed.id,
			plantName: 'Carrot',
			status: 'sown'
		}).run();

		db.insert(schema.notifications).values({
			userId: userB.id,
			type: 'test',
			key: 'iso-test-b',
			message: 'notification for userB',
			createdAt: new Date().toISOString()
		}).run();

		db.insert(schema.gardenPhotos).values({
			userId: userB.id,
			label: 'Photo B',
			filename: 'photo-b.jpg'
		}).run();

		const aBeds = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userA.id)).all();
		expect(aBeds).toHaveLength(2);

		const aPlantations = db.select().from(schema.plantations).where(eq(schema.plantations.userId, userA.id)).all();
		expect(aPlantations).toHaveLength(1);

		const aNotifs = db.select().from(schema.notifications).where(eq(schema.notifications.userId, userA.id)).all();
		expect(aNotifs).toHaveLength(1);

		const aPhotos = db.select().from(schema.gardenPhotos).where(eq(schema.gardenPhotos.userId, userA.id)).all();
		expect(aPhotos).toHaveLength(1);

		const allBeds = db.select().from(schema.gardenBeds).all();
		expect(allBeds).toHaveLength(3);
	});
});
