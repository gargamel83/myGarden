import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../db';
import { notifications } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

describe('notifications API', () => {
	beforeAll(() => {
		db.delete(notifications).run();
	});

	afterAll(() => {
		db.delete(notifications).run();
	});

	it('should insert and retrieve notifications', () => {
		db.insert(notifications).values({
			type: 'test',
			key: 'test-1',
			message: 'test notification',
			link: '/',
			createdAt: new Date().toISOString()
		}).run();

		const all = db.select().from(notifications).all();
		expect(all.length).toBeGreaterThan(0);
		expect(all.some(n => n.key === 'test-1')).toBe(true);
	});

	it('should respect unique key constraint', () => {
		expect(() => {
			db.insert(notifications).values({
				type: 'test',
				key: 'test-1',
				message: 'duplicate',
				link: '/',
				createdAt: new Date().toISOString()
			}).run();
		}).toThrow();
	});

	it('should mark notification as read', () => {
		const n = db.select().from(notifications).where(eq(notifications.key, 'test-1')).get()!;
		expect(n.isRead).toBeFalsy();

		db.update(notifications).set({ isRead: true }).where(eq(notifications.id, n.id)).run();
		const updated = db.select().from(notifications).where(eq(notifications.id, n.id)).get()!;
		expect(updated.isRead).toBeTruthy();
	});

	it('should only return top 20 latest', () => {
		for (let i = 0; i < 25; i++) {
			db.insert(notifications).values({
				type: 'bulk',
				key: `bulk-${i}`,
				message: `bulk ${i}`,
				createdAt: new Date(Date.now() + i).toISOString()
			}).run();
		}

		const all = db.select().from(notifications).orderBy(sql`${notifications.createdAt} DESC`).limit(20).all();
		expect(all.length).toBeLessThanOrEqual(20);
	});
});
