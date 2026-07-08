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

import { createUser, authenticateUser, createSession, getSessionUser, deleteSession } from '../server/auth';

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

	testDbRef.current = db;
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('createUser', () => {
	it('should create a user and return id and username', () => {
		const user = createUser('alice', 'secret123');
		expect(user.id).toBeGreaterThan(0);
		expect(user.username).toBe('alice');
	});

	it('should throw when username already exists', () => {
		expect(() => createUser('alice', 'other')).toThrow('Username already taken');
	});

	it('should store a non-empty password hash with salt', () => {
		const user = db.select().from(schema.users).where(eq(schema.users.username, 'alice')).get()!;
		expect(user.passwordHash).toBeTruthy();
		expect(user.passwordHash).toContain(':');
	});
});

describe('authenticateUser', () => {
	it('should return user on correct password', () => {
		const user = authenticateUser('alice', 'secret123');
		expect(user).not.toBeNull();
		expect(user!.username).toBe('alice');
	});

	it('should return null on wrong password', () => {
		expect(authenticateUser('alice', 'wrongpass')).toBeNull();
	});

	it('should return null on non-existent user', () => {
		expect(authenticateUser('nobody', 'x')).toBeNull();
	});
});

describe('sessions', () => {
	it('createSession should return a token string', () => {
		const token = createSession(1);
		expect(token).toBeTruthy();
		expect(typeof token).toBe('string');
		expect(token.length).toBeGreaterThan(16);
	});

	it('getSessionUser should return user for valid token', () => {
		const token = createSession(1);
		const user = getSessionUser(token);
		expect(user).not.toBeNull();
		expect(user!.id).toBe(1);
	});

	it('getSessionUser should return null for invalid token', () => {
		expect(getSessionUser('invalid-token')).toBeNull();
	});

	it('getSessionUser should return null for undefined', () => {
		expect(getSessionUser(undefined)).toBeNull();
	});

	it('deleteSession should remove the session', () => {
		const token = createSession(1);
		expect(getSessionUser(token)).not.toBeNull();
		deleteSession(token);
		expect(getSessionUser(token)).toBeNull();
	});
});

describe('data isolation', () => {
	it('different users have different sessions', () => {
		const userA = createUser('bob', 'pass123');
		const userB = createUser('carol', 'pass456');

		const tokenA = createSession(userA.id);
		const tokenB = createSession(userB.id);

		expect(getSessionUser(tokenA)!.id).toBe(userA.id);
		expect(getSessionUser(tokenB)!.id).toBe(userB.id);
		expect(getSessionUser(tokenA)!.id).not.toBe(getSessionUser(tokenB)!.id);
	});
});
