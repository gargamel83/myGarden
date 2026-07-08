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

import { createUser, createSession, getSessionUser, deleteSession, COOKIE_NAME } from '../server/auth';
import { actions as loginActions, load as loginLoad } from '../../routes/login/+page.server';
import { actions as registerActions, load as registerLoad } from '../../routes/register/+page.server';
import { actions as logoutActions } from '../../routes/logout/+page.server';

let tmpDir: string;
let sqlite: Database.Database;
let testUser: { id: number; username: string };

function mockFormData(values: Record<string, string>) {
	return {
		get: (key: string) => values[key] ?? null
	};
}

function mockCookies() {
	return {
		set: vi.fn(),
		get: vi.fn(),
		delete: vi.fn()
	};
}

function mockRequest(formValues: Record<string, string>) {
	return {
		formData: vi.fn().mockResolvedValue(mockFormData(formValues))
	};
}

beforeAll(() => {
	tmpDir = mkdtempSync('/tmp/monjardin-test-');
	const dbPath = join(tmpDir, 'test.db');
	sqlite = new Database(dbPath);
	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');
	const db = drizzle(sqlite, { schema });

	migrate(db, { migrationsFolder: 'drizzle' });

	testDbRef.current = db;

	testUser = createUser('pagetest', 'testpass123');
});

afterAll(() => {
	sqlite.close();
	rmSync(tmpDir, { recursive: true, force: true });
});

describe('Login page', () => {
	describe('load', () => {
		it('redirects to / when user is already logged in', async () => {
			const event = { locals: { user: { id: testUser.id, username: testUser.username } } };
			await expect(loginLoad(event as any)).rejects.toMatchObject({
				status: 303,
				location: '/'
			});
		});
	});

	describe('login action', () => {
		it('returns 400 when username/password missing', async () => {
			const cookies = mockCookies();

			const request1 = mockRequest({ username: '', password: '' });
			let result = await loginActions.login({ request: request1, cookies } as any);
			expect(result).toMatchObject({ status: 400, data: { error: 'Username and password required' } });

			const request2 = mockRequest({ username: 'test', password: '' });
			result = await loginActions.login({ request: request2, cookies } as any);
			expect(result).toMatchObject({ status: 400, data: { error: 'Username and password required' } });

			const request3 = mockRequest({ username: '', password: 'test' });
			result = await loginActions.login({ request: request3, cookies } as any);
			expect(result).toMatchObject({ status: 400, data: { error: 'Username and password required' } });
		});

		it('returns 401 when invalid username/password', async () => {
			const cookies = mockCookies();
			const request = mockRequest({ username: 'nonexistent', password: 'wrongpass' });

			const result = await loginActions.login({ request, cookies } as any);
			expect(result).toMatchObject({ status: 401, data: { error: 'Invalid username or password' } });
		});

		it('creates session and redirects (303) on success', async () => {
			const cookies = mockCookies();
			const request = mockRequest({ username: testUser.username, password: 'testpass123' });

			await expect(loginActions.login({ request, cookies } as any)).rejects.toMatchObject({
				status: 303,
				location: '/'
			});

			const token = cookies.set.mock.calls[0]?.[1];
			expect(token).toBeTruthy();
			expect(typeof token).toBe('string');

			const sessionUser = getSessionUser(token);
			expect(sessionUser).not.toBeNull();
			expect(sessionUser!.username).toBe(testUser.username);
		});

		it('sets cookie on success', async () => {
			const cookies = mockCookies();
			const request = mockRequest({ username: testUser.username, password: 'testpass123' });

			await expect(loginActions.login({ request, cookies } as any)).rejects.toThrow();

			expect(cookies.set).toHaveBeenCalledWith(
				COOKIE_NAME,
				expect.any(String),
				expect.objectContaining({
					path: '/',
					httpOnly: true,
					sameSite: 'strict',
					maxAge: 60 * 60 * 24 * 365
				})
			);
		});
	});
});

describe('Register page', () => {
	describe('load', () => {
		it('redirects to / when user is already logged in', async () => {
			const event = { locals: { user: { id: testUser.id, username: testUser.username } } };
			await expect(registerLoad(event as any)).rejects.toMatchObject({
				status: 303,
				location: '/'
			});
		});
	});

	describe('register action', () => {
		it('returns 400 when username too short (< 3 chars)', async () => {
			const cookies = mockCookies();
			const request = mockRequest({ username: 'ab', password: 'testpass123', confirm: 'testpass123' });

			const result = await registerActions.register({ request, cookies } as any);
			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Username must be at least 3 characters' }
			});
		});

		it('returns 400 when password too short (< 6 chars)', async () => {
			const cookies = mockCookies();
			const request = mockRequest({ username: 'validuser', password: '12345', confirm: '12345' });

			const result = await registerActions.register({ request, cookies } as any);
			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Password must be at least 6 characters' }
			});
		});

		it('returns 400 when passwords do not match', async () => {
			const cookies = mockCookies();
			const request = mockRequest({ username: 'validuser', password: 'abcdef', confirm: 'different' });

			const result = await registerActions.register({ request, cookies } as any);
			expect(result).toMatchObject({
				status: 400,
				data: { error: 'Passwords do not match' }
			});
		});

		it('returns 409 when username already taken', async () => {
			const cookies = mockCookies();
			const request = mockRequest({
				username: testUser.username,
				password: 'somepass',
				confirm: 'somepass'
			});

			const result = await registerActions.register({ request, cookies } as any);
			expect(result).toMatchObject({
				status: 409,
				data: { error: 'Username already taken' }
			});
		});

		it('creates user, creates session, sets cookie, and redirects (303) on success', async () => {
			const cookies = mockCookies();
			const username = 'newregisteruser';
			const password = 'testpass123';
			const request = mockRequest({ username, password, confirm: password });

			await expect(registerActions.register({ request, cookies } as any)).rejects.toMatchObject({
				status: 303,
				location: '/'
			});

			const token = cookies.set.mock.calls[0]?.[1];
			expect(token).toBeTruthy();
			expect(typeof token).toBe('string');

			const sessionUser = getSessionUser(token);
			expect(sessionUser).not.toBeNull();
			expect(sessionUser!.username).toBe(username);
		});
	});
});

describe('Logout page', () => {
	describe('logout action', () => {
		it('deletes session and clears cookie', async () => {
			const sessionToken = createSession(testUser.id);
			const cookies = mockCookies();
			cookies.get.mockReturnValue(sessionToken);
			const locals: any = { user: { id: testUser.id, username: testUser.username } };

			await expect(logoutActions.default({ cookies, locals } as any)).rejects.toMatchObject({
				status: 303,
				location: '/login'
			});

			expect(cookies.get).toHaveBeenCalledWith(COOKIE_NAME);
			expect(cookies.delete).toHaveBeenCalledWith(COOKIE_NAME, { path: '/' });
			expect(getSessionUser(sessionToken)).toBeNull();
		});

		it('sets locals.user to null', async () => {
			const sessionToken = createSession(testUser.id);
			const cookies = mockCookies();
			cookies.get.mockReturnValue(sessionToken);
			const locals: any = { user: { id: testUser.id, username: testUser.username } };

			await expect(logoutActions.default({ cookies, locals } as any)).rejects.toThrow();

			expect(locals.user).toBeNull();
		});

		it('redirects (303) to /login', async () => {
			const cookies = mockCookies();
			cookies.get.mockReturnValue(undefined);
			const locals: any = { user: { id: testUser.id, username: testUser.username } };

			await expect(logoutActions.default({ cookies, locals } as any)).rejects.toMatchObject({
				status: 303,
				location: '/login'
			});
		});
	});
});
