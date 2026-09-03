import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../server/db/schema';
import { eq, and } from 'drizzle-orm';

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
let plantId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-fav-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	userA = createUser('favA', 'passA');
	userB = createUser('favB', 'passB');

	plantId = db.insert(schema.plants).values({ commonName: 'Tomato' }).returning().get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('plantFavorites', () => {
	it('adds a favorite for userA', () => {
		db.insert(schema.plantFavorites).values({ userId: userA.id, plantId }).run();
		const favs = db.select().from(schema.plantFavorites).where(eq(schema.plantFavorites.userId, userA.id)).all();
		expect(favs).toHaveLength(1);
		expect(favs[0].plantId).toBe(plantId);
	});

	it('userA cannot favorite the same plant twice (unique constraint)', () => {
		expect(() => {
			db.insert(schema.plantFavorites).values({ userId: userA.id, plantId }).run();
		}).toThrow();
	});

	it('userB does not see userA favorites', () => {
		const favs = db.select().from(schema.plantFavorites).where(eq(schema.plantFavorites.userId, userB.id)).all();
		expect(favs).toHaveLength(0);
	});

	it('removes a favorite', () => {
		db.delete(schema.plantFavorites)
			.where(and(eq(schema.plantFavorites.userId, userA.id), eq(schema.plantFavorites.plantId, plantId)))
			.run();
		const favs = db.select().from(schema.plantFavorites).where(eq(schema.plantFavorites.userId, userA.id)).all();
		expect(favs).toHaveLength(0);
	});

	it('can be re-added after removal', () => {
		db.insert(schema.plantFavorites).values({ userId: userA.id, plantId }).run();
		const favs = db.select().from(schema.plantFavorites).where(eq(schema.plantFavorites.userId, userA.id)).all();
		expect(favs).toHaveLength(1);
	});
});
