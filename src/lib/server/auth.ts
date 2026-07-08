import { db } from './db';
import { users, sessions } from './db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 365; // 1 year
const COOKIE_NAME = 'session';

export interface SessionUser {
	id: number;
	username: string;
}

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const key = scryptSync(password, salt, 64).toString('hex');
	return `${salt}:${key}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [salt, key] = stored.split(':');
	const derived = scryptSync(password, salt, 64).toString('hex');
	try {
		return timingSafeEqual(Buffer.from(key), Buffer.from(derived));
	} catch {
		return false;
	}
}

function generateToken(): string {
	return randomBytes(32).toString('hex');
}

export function createUser(username: string, password: string): SessionUser {
	const existing = db.select({ id: users.id }).from(users).where(eq(users.username, username)).get();
	if (existing) {
		throw new Error('Username already taken');
	}

	const passwordHash = hashPassword(password);
	const result = db.insert(users).values({ username, passwordHash }).returning({ id: users.id, username: users.username }).get();
	if (!result) throw new Error('Failed to create user');
	return result;
}

export function authenticateUser(username: string, password: string): SessionUser | null {
	const user = db.select().from(users).where(eq(users.username, username)).get();
	if (!user) return null;
	if (!verifyPassword(password, user.passwordHash)) return null;
	return { id: user.id, username: user.username };
}

export function createSession(userId: number): string {
	const token = generateToken();
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
	db.insert(sessions).values({ userId, token, expiresAt }).run();
	return token;
}

export function getSessionUser(token: string | undefined): SessionUser | null {
	if (!token) return null;
	const session = db.select({
		userId: sessions.userId,
		username: users.username
	})
		.from(sessions)
		.innerJoin(users, eq(sessions.userId, users.id))
		.where(eq(sessions.token, token))
		.get();
	if (!session) return null;
	return { id: session.userId, username: session.username };
}

export function deleteSession(token: string): void {
	db.delete(sessions).where(eq(sessions.token, token)).run();
}

export { COOKIE_NAME };
