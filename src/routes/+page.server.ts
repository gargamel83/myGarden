import { db } from '$lib/server/db';
import { gardenBeds, plants, plantations } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getRotationAlerts } from '$lib/server/rotation';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async () => {
	const bedCount = db.select({ count: sql<number>`count(*)` }).from(gardenBeds).get()?.count || 0;
	const plantCount = db.select({ count: sql<number>`count(*)` }).from(plants).get()?.count || 0;

	const allPlantations = db.select().from(plantations)
		.orderBy(plantations.createdAt)
		.all();

	const active = allPlantations.filter(p => !['harvested', 'cancelled'].includes(p.status));
	const harvested = allPlantations.filter(p => p.status === 'harvested');
	const planned = allPlantations.filter(p => p.status === 'planned');

	// Alertes : plantations planifiées dont la date de semis approche
	const today = new Date();
	const currentMonth = today.getMonth() + 1;
	const currentDay = today.getDate();
	const currentMD = currentMonth * 100 + currentDay;

	const sowingAlerts: { plantation: typeof plantations.$inferSelect; plant: typeof plants.$inferSelect | null; daysLeft: number }[] = [];

	// Prendre les plantations avec plantId et vérifier leur période de semis
	for (const p of allPlantations) {
		if (p.plantId && p.status === 'planned') {
			const plant = db.select().from(plants).where(eq(plants.id, p.plantId)).get();
			if (plant?.sowingStart) {
				const [m, d] = plant.sowingStart.split('-').map(Number);
				const sowingMD = m * 100 + d;
				const daysLeft = sowingMD - currentMD;
				if (daysLeft >= 0 && daysLeft <= 30) {
					sowingAlerts.push({ plantation: p, plant, daysLeft });
				}
			}
		}
	}

	// Récoltes à venir dans les 30 jours
	const harvestAlerts: { plantation: typeof plantations.$inferSelect; plant: typeof plants.$inferSelect | null; daysLeft: number }[] = [];
	for (const p of active) {
		if (p.plantId) {
			const plant = db.select().from(plants).where(eq(plants.id, p.plantId)).get();
			if (plant?.harvestStart) {
				const [m, d] = plant.harvestStart.split('-').map(Number);
				const harvestMD = m * 100 + d;
				const daysLeft = harvestMD - currentMD;
				if (daysLeft >= -15 && daysLeft <= 30) {
					harvestAlerts.push({ plantation: p, plant, daysLeft });
				}
			}
		}
	}

	const rotationAlerts = await getRotationAlerts();
	const recentActivity = [...allPlantations].reverse().slice(0, 5);

	return {
		stats: {
			bedCount,
			plantCount,
			activeCount: active.length,
			harvestedCount: harvested.length,
			plannedCount: planned.length
		},
		active: active.slice(0, 10),
		recentActivity,
		sowingAlerts,
		harvestAlerts,
		rotationAlerts: rotationAlerts.filter(a => a.type === 'warning').slice(0, 3)
	};
};
