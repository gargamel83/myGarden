import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';

import * as schema from '../server/db/schema';
import { buildCalendar } from '../server/ics';

const testDbRef = vi.hoisted(() => ({ current: null as any }));

vi.mock('../server/db', () => ({
	get db() { return testDbRef.current; }
}));

import { createUser } from '../server/auth';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let userId: number;

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-ics-');
	sqlite = new Database(join(tmpDir, 'test.db'));
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;
	userId = createUser('icsUser', 'passA').id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

function seedBed(name: string, userId: number): number {
	const res = db.insert(schema.gardenBeds).values({
		userId, name, polygon: '[]', type: 'pixel', color: '#000000'
	}).run();
	return Number(res.lastInsertRowid);
}

describe('buildCalendar (ics)', () => {
	it('returns an empty calendar with no plantations', () => {
		const cal = buildCalendar(userId + 999);
		expect(cal.name).toBe('monjardin-rappels.ics');
		expect(cal.content).toContain('BEGIN:VCALENDAR');
		expect(cal.content).toContain('END:VCALENDAR');
		expect(cal.content).not.toContain('BEGIN:VEVENT');
	});

	it('creates VEVENTs for sowing, planting and harvest dates', () => {
		const bed = seedBed('Potager', userId);
		const res = db.insert(schema.plantations).values({
			userId,
			gardenBedId: bed,
			plantId: null,
			plantName: 'Tomate',
			variety: 'Coeur de bœuf',
			sowingDate: '2026-03-15T00:00:00.000Z',
			plantingDate: '2026-05-01T00:00:00.000Z',
			harvestDate: '2026-07-20T00:00:00.000Z',
			status: 'sown'
		}).run();

		const cal = buildCalendar(userId);
		expect(cal.content).toContain('DTSTART;VALUE=DATE:20260315');
		expect(cal.content).toContain('DTSTART;VALUE=DATE:20260501');
		expect(cal.content).toContain('DTSTART;VALUE=DATE:20260720');
		expect(cal.content).toContain('SUMMARY:Semis: Tomate — Coeur de bœuf');
		expect(cal.content).toContain('(Potager)');
		expect((cal.content.match(/BEGIN:VEVENT/g) || []).length).toBe(3);
	});

	it('falls back to type periods (MM-DD) from the plant record', () => {
		const plant = db.insert(schema.plants).values({
			commonName: 'Carotte',
			family: 'Apiaceae',
			sowingStart: '04-01',
			harvestStart: '07-01'
		}).run();

		const bed = seedBed('Bed B', userId);
		db.insert(schema.plantations).values({
			userId,
			gardenBedId: bed,
			plantId: Number(plant.lastInsertRowid),
			plantName: 'Carotte',
			status: 'planned'
		}).run();

		const cal = buildCalendar(userId);
		expect(cal.content).toMatch(/DTSTART;VALUE=DATE:\d{4}0401/);
		expect(cal.content).toMatch(/DTSTART;VALUE=DATE:\d{4}0701/);
	});

	it('does not leak another user\'s plantations', () => {
		const otherUser = createUser('icsOther', 'passB').id;
		const bed = seedBed('Secret', otherUser);
		db.insert(schema.plantations).values({
			userId: otherUser,
			gardenBedId: bed,
			plantName: 'PlanteSecrete',
			sowingDate: '2026-02-02T00:00:00.000Z',
			status: 'sown'
		}).run();

		const cal = buildCalendar(userId);
		expect(cal.content).not.toContain('PlanteSecrete');
	});
});
