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
	getRotationAlerts: vi.fn().mockResolvedValue([]),
	getBedHistory: vi.fn(),
	getBedAdvice: vi.fn(() => []),
	buildRotationPlan: vi.fn(() => ({ bedId: 0, bedName: '', entries: [] }))
}));

import { createUser } from '../server/auth';
import { actions, load } from '../../routes/garden/+page.server';
let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userA: { id: number };

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-zone-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;
	userA = createUser('zoneUser', 'passA');
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

function formEvent(values: Record<string, string>, userId = userA.id) {
	return {
		locals: { user: { id: userId } },
		request: { formData: vi.fn().mockResolvedValue({ get: (key: string) => values[key] ?? null }) }
	};
}

describe('garden zones', () => {
	it('saves a bed with a zone and load returns distinct zones', async () => {
		const event = formEvent({
			name: 'Bed Potager', polygon: '[[0,0],[10,0],[10,10]]', zone: 'Potager', coordinatesType: 'pixel', color: '#123456'
		});
		const result = await actions.saveBed(event as any);
		expect(result).toEqual({ success: true });

		const bed = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.name, 'Bed Potager')).get();
		expect(bed?.zone).toBe('Potager');

		const data: any = await load({ locals: { user: { id: userA.id } }, depends: () => {} } as any);
		expect(data.zones).toContain('Potager');
	});

	it('does not list zones of other users and allows no zone', async () => {
		const other = createUser('zoneOther', 'passB');
		db.insert(schema.gardenBeds).values({
			userId: other.id, name: 'Other Bed', polygon: '[]', zone: 'Serre', type: 'pixel'
		}).run();

		const data: any = await load({ locals: { user: { id: userA.id } }, depends: () => {} } as any);
		expect(data.zones).not.toContain('Serre');
		expect(data.zones).toContain('Potager');
	});

	it('saveAllBeds upserts the snapshot and removes deleted beds', async () => {
		const bed = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userA.id)).all();
		const keep = bed[0];
		const snapshot = [
			{ ...keep, name: 'Renamed', zone: 'Orangerie' },
			{ id: 0, userId: userA.id, name: 'New Bed', polygon: '[[1,1],[2,1],[2,2]]', type: 'pixel', color: '#000000', zone: null }
		];

		const event = {
			locals: { user: { id: userA.id } },
			request: { json: vi.fn().mockResolvedValue({ beds: snapshot }) }
		};
		const result = await actions.saveAllBeds(event as any);
		expect(result).toEqual({ success: true });

		const all = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, userA.id)).all();
		expect(all.length).toBe(2);
		expect(all.find(x => x.zone === 'Orangerie')?.name).toBe('Renamed');
		expect(all.some(x => x.name === 'New Bed')).toBe(true);

		// the 'Other Bed' of the other user must be untouched
		const others = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, db.select().from(schema.users).all().find(u => u.username === 'zoneOther')!.id)).all();
		expect(others.length).toBeGreaterThan(0);
	});
});
