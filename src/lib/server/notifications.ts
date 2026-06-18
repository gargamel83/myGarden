import { db } from './db';
import { notifications, plants, plantations, gardenBeds } from './db/schema';
import { eq, inArray, and, lte, sql } from 'drizzle-orm';
import { getRotationAlerts } from './rotation';

export interface AppNotification {
	id: number;
	type: string;
	key: string;
	message: string;
	link: string | null;
	isRead: boolean;
	createdAt: string;
}

export async function generateNotifications(): Promise<void> {
	const today = new Date();
	const currentMonth = today.getMonth() + 1;
	const currentDay = today.getDate();
	const currentMD = currentMonth * 100 + currentDay;
	const now = today.toISOString();

	const existing = new Set(
		db.select({ key: notifications.key }).from(notifications).all().map(n => n.key)
	);

	const toInsert: { type: string; key: string; message: string; link: string | null; createdAt: string }[] = [];

	// 1. Rotation warnings
	const rotationAlerts = await getRotationAlerts();
	for (const alert of rotationAlerts) {
		const key = `rotation-${alert.bedId}`;
		if (existing.has(key)) continue;
		toInsert.push({
			type: 'rotation',
			key,
			message: alert.message,
			link: '/garden',
			createdAt: now
		});
	}

	// 2. Upcoming sowings
	const allPlantations = db.select().from(plantations).all();
	const refPlantIds = [...new Set(allPlantations.filter(p => p.plantId).map(p => p.plantId as number))];
	const plantMap = new Map(
		db.select().from(plants).where(inArray(plants.id, refPlantIds)).all()
			.map(p => [p.id, p])
	);

	for (const p of allPlantations) {
		if (p.plantId && p.status === 'planned') {
			const plant = plantMap.get(p.plantId);
			if (plant?.sowingStart) {
				const [m, d] = plant.sowingStart.split('-').map(Number);
				const sowingMD = m * 100 + d;
				const daysLeft = sowingMD - currentMD;
				if (daysLeft >= 0 && daysLeft <= 30) {
					const key = `sowing-${p.id}`;
					if (existing.has(key)) continue;
					toInsert.push({
						type: 'sowing',
						key,
						message: `${plant.commonName} sowing starts in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
						link: `/plants/${plant.id}`,
						createdAt: now
					});
				}
			}
		}
	}

	// 3. Upcoming harvests
	for (const p of allPlantations) {
		const active = !['harvested', 'cancelled'].includes(p.status);
		if (p.plantId && active) {
			const plant = plantMap.get(p.plantId);
			if (plant?.harvestStart) {
				const [m, d] = plant.harvestStart.split('-').map(Number);
				const harvestMD = m * 100 + d;
				const daysLeft = harvestMD - currentMD;
				if (daysLeft >= -15 && daysLeft <= 30) {
					const key = `harvest-${p.id}`;
					if (existing.has(key)) continue;
					toInsert.push({
						type: 'harvest',
						key,
						message: `${plant.commonName} harvest ${daysLeft <= 0 ? 'started!' : `in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`}`,
						link: `/plants/${plant.id}`,
						createdAt: now
					});
				}
			}
		}
	}

	// 4. Stale plantations (planned > 14 days with no dates)
	const staleThreshold = new Date(today.getTime() - 14 * 86400000).toISOString();
	for (const p of allPlantations) {
		if (p.status === 'planned' && !p.sowingDate && !p.plantingDate && p.createdAt < staleThreshold) {
			const key = `stale-${p.id}`;
			if (existing.has(key)) continue;
			toInsert.push({
				type: 'stale',
				key,
				message: `${p.plantName} has been planned for over 14 days without starting`,
				link: '/plantations',
				createdAt: now
			});
		}
	}

	// Batch insert all new notifications
	for (const n of toInsert) {
		db.insert(notifications).values(n).run();
	}
}

export function getNotifications(): { notifications: AppNotification[]; unreadCount: number } {
	const all = db.select().from(notifications)
		.orderBy(sql`${notifications.isRead} ASC, ${notifications.createdAt} DESC`)
		.limit(20)
		.all();
	const unreadCount = db.select({ count: sql<number>`count(*)` })
		.from(notifications)
		.where(eq(notifications.isRead, false))
		.get()?.count || 0;
	return {
		notifications: all.map(n => ({ ...n, isRead: !!n.isRead })),
		unreadCount
	};
}

export function markRead(id: number): void {
	db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id)).run();
}

export function markAllRead(): void {
	db.update(notifications).set({ isRead: true }).run();
}
