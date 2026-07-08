import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
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

vi.mock('../server/rotation', () => ({
	getRotationAlerts: vi.fn(),
	getBedHistory: vi.fn(),
	getBedAdvice: vi.fn()
}));

vi.mock('sharp', () => ({
	default: vi.fn(() => ({
		resize: vi.fn(() => ({
			webp: vi.fn(() => ({
				toBuffer: vi.fn().mockResolvedValue(Buffer.from('test'))
			}))
		}))
	}))
}));

vi.mock('fs', async () => ({
	...(await vi.importActual('fs')),
	writeFileSync: vi.fn(),
	existsSync: vi.fn().mockReturnValue(true)
}));

import { load, actions } from '../../routes/garden/+page.server';
import { getRotationAlerts, getBedAdvice } from '../server/rotation';
import { eq } from 'drizzle-orm';

let tmpDir: string;
let sqlite: Database.Database;
let db: ReturnType<typeof drizzle>;
let testUserId: number;
let otherUserId: number;

function mockLoadEvent(userId: number) {
	return {
		depends: vi.fn(),
		locals: { user: { id: userId } }
	};
}

function mockActionEvent(userId: number, formValues: Record<string, any>) {
	return {
		locals: { user: { id: userId } },
		request: {
			formData: vi.fn().mockResolvedValue({
				get: (key: string) => formValues[key] ?? null
			})
		}
	};
}

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	testUserId = db.insert(schema.users).values({ username: 'gardenuser', passwordHash: 'hash' }).returning({ id: schema.users.id }).get()!.id;
	otherUserId = db.insert(schema.users).values({ username: 'otheruser', passwordHash: 'hash' }).returning({ id: schema.users.id }).get()!.id;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
	db.delete(schema.plantations).run();
	db.delete(schema.gardenPhotos).run();
	db.delete(schema.gardenBeds).run();
	vi.clearAllMocks();
});

describe('garden page load', () => {
	it('returns empty arrays when user has no data', async () => {
		vi.mocked(getRotationAlerts).mockResolvedValue([]);
		vi.mocked(getBedAdvice).mockReturnValue([]);

		const result = await load(mockLoadEvent(testUserId) as any);
		expect(result.photos).toEqual([]);
		expect(result.beds).toEqual([]);
		expect(result.rotationAlerts).toEqual([]);
		expect(result.bedHistories).toEqual({});
		expect(result.bedPlantations).toEqual({});
		expect(result.bedAdvice).toEqual({});
	});

	it('returns photos, beds, rotationAlerts for user', async () => {
		db.insert(schema.gardenPhotos).values({ userId: testUserId, label: 'Garden view', filename: 'photo1.webp' }).run();
		const bed = db.insert(schema.gardenBeds).values({ userId: testUserId, name: 'Bed A', polygon: '[[0,0],[10,0],[10,10],[0,10]]' }).returning().get()!;

		vi.mocked(getRotationAlerts).mockResolvedValue([
			{ bedId: bed.id, bedName: 'Bed A', message: 'Rotation needed', type: 'warning' }
		]);
		vi.mocked(getBedAdvice).mockReturnValue([{ commonName: 'Tomato' } as any]);

		const result = await load(mockLoadEvent(testUserId) as any);
		expect(result.photos).toHaveLength(1);
		expect(result.photos[0].label).toBe('Garden view');
		expect(result.beds).toHaveLength(1);
		expect(result.beds[0].name).toBe('Bed A');
		expect(result.rotationAlerts).toHaveLength(1);
		expect(result.rotationAlerts[0].bedId).toBe(bed.id);
		expect(result.rotationAlerts[0].type).toBe('warning');
		expect(result.bedAdvice[bed.id]).toEqual(['Tomato']);
	});

	it('does NOT return other user data', async () => {
		db.insert(schema.gardenPhotos).values({ userId: testUserId, label: 'Photo A', filename: 'a.webp' }).run();
		db.insert(schema.gardenBeds).values({ userId: testUserId, name: 'User Bed', polygon: '[[0,0]]' }).run();

		vi.mocked(getRotationAlerts).mockResolvedValue([]);
		vi.mocked(getBedAdvice).mockReturnValue([]);

		const result = await load(mockLoadEvent(otherUserId) as any);
		expect(result.photos).toEqual([]);
		expect(result.beds).toEqual([]);
	});
});

describe('saveBed action', () => {
	it('creates a new bed with correct userId', async () => {
		const event = mockActionEvent(testUserId, {
			name: 'New Bed',
			polygon: '[[0,0],[1,0],[1,1],[0,1]]'
		});
		const result = await actions.saveBed(event as any);
		expect(result).toEqual({ success: true });

		const beds = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.userId, testUserId)).all();
		expect(beds).toHaveLength(1);
		expect(beds[0].name).toBe('New Bed');
		expect(beds[0].userId).toBe(testUserId);
	});

	it('updates existing bed', async () => {
		const bed = db.insert(schema.gardenBeds).values({ userId: testUserId, name: 'Old Name', polygon: '[[0,0]]' }).returning().get()!;
		const event = mockActionEvent(testUserId, {
			id: String(bed.id),
			name: 'Updated Name',
			polygon: '[[0,0],[1,1]]'
		});
		const result = await actions.saveBed(event as any);
		expect(result).toEqual({ success: true });

		const updated = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.id, bed.id)).get();
		expect(updated!.name).toBe('Updated Name');
	});

	it('returns 400 when name is missing', async () => {
		const event = mockActionEvent(testUserId, { name: '', polygon: '[[0,0]]' });
		const result = await actions.saveBed(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Name and polygon required' } });
	});

	it('returns 400 when polygon is missing', async () => {
		const event = mockActionEvent(testUserId, { name: 'Bed', polygon: '' });
		const result = await actions.saveBed(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Name and polygon required' } });
	});
});

describe('deleteBed action', () => {
	it('deletes a bed owned by the user', async () => {
		const bed = db.insert(schema.gardenBeds).values({ userId: testUserId, name: 'To Delete', polygon: '[[0,0]]' }).returning().get()!;
		const event = mockActionEvent(testUserId, { id: String(bed.id) });
		const result = await actions.deleteBed(event as any);
		expect(result).toEqual({ success: true });

		const deleted = db.select().from(schema.gardenBeds).where(eq(schema.gardenBeds.id, bed.id)).get();
		expect(deleted).toBeUndefined();
	});

	it('returns 403 when trying to delete another user bed', async () => {
		const bed = db.insert(schema.gardenBeds).values({ userId: testUserId, name: 'Not Yours', polygon: '[[0,0]]' }).returning().get()!;
		const event = mockActionEvent(otherUserId, { id: String(bed.id) });
		const result = await actions.deleteBed(event as any);
		expect(result).toMatchObject({ status: 403, data: { error: 'Not authorized' } });
	});

	it('returns 400 when bed has linked plantations', async () => {
		const bed = db.insert(schema.gardenBeds).values({ userId: testUserId, name: 'Linked Bed', polygon: '[[0,0]]' }).returning().get()!;
		db.insert(schema.plantations).values({ userId: testUserId, gardenBedId: bed.id, plantName: 'Tomato', status: 'planned' }).run();
		const event = mockActionEvent(testUserId, { id: String(bed.id) });
		const result = await actions.deleteBed(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'Cannot delete this bed: there are linked plantations' } });
	});
});

describe('upload action', () => {
	it('returns 400 when no file provided', async () => {
		const event = mockActionEvent(testUserId, { label: 'My Photo' });
		const result = await actions.upload(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'File required' } });
	});

	it('returns 400 when file is empty', async () => {
		const file = { size: 0, name: 'empty.jpg' } as any;
		const event = mockActionEvent(testUserId, { label: 'Empty', photo: file });
		const result = await actions.upload(event as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'File required' } });
	});

	it('creates photo record in DB', async () => {
		const file = {
			size: 1024,
			name: 'test.jpg',
			type: 'image/jpeg',
			arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3, 4]).buffer)
		};
		const event = mockActionEvent(testUserId, { label: 'My Garden Photo', photo: file });
		const result = await actions.upload(event as any);
		expect(result).toMatchObject({ success: true });

		const photos = db.select().from(schema.gardenPhotos).where(eq(schema.gardenPhotos.userId, testUserId)).all();
		expect(photos).toHaveLength(1);
		expect(photos[0].label).toBe('My Garden Photo');
		expect(photos[0].userId).toBe(testUserId);
		expect(typeof photos[0].filename).toBe('string');
	});
});
