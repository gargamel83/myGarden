import { db } from '$lib/server/db';
import { gardenBeds, plants, plantations } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getRotationAlerts } from '$lib/server/rotation';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async (event) => {
	event.depends('app:dashboard');
	const bedCount = db.select({ count: sql<number>`count(*)` }).from(gardenBeds).get()?.count || 0;
	const plantCount = db.select({ count: sql<number>`count(*)` }).from(plants).get()?.count || 0;

	const allPlantations = db.select().from(plantations)
		.orderBy(plantations.createdAt)
		.all();

	const active = allPlantations.filter(p => !['harvested', 'cancelled'].includes(p.status));
	const harvested = allPlantations.filter(p => p.status === 'harvested');
	const planned = allPlantations.filter(p => p.status === 'planned');

	// Alerts: planned plantations whose sowing date is approaching
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

	// Harvests to come within 30 days
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

	// Advanced statistics
	const beds = db.select().from(gardenBeds).all();
	const totalArea = beds.reduce((sum, b) => sum + ((b.length || 0) * (b.width || 0)), 0);
	const avgBedSize = bedCount > 0 ? totalArea / bedCount : 0;

	// Top 5 most cultivated plants
	const plantCounts: Record<string, number> = {};
	for (const p of allPlantations) {
		plantCounts[p.plantName] = (plantCounts[p.plantName] || 0) + 1;
	}
	const topCrops = Object.entries(plantCounts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, count]) => ({ name, count }));

	// Occupation by month (number of active plantations)
	const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
	const occupationByMonth = monthNames.map((_, month) => {
		const m = month + 1;
		return allPlantations.filter(p => {
			if (p.status === 'cancelled') return false;
			const startDate = p.sowingDate || p.plantingDate;
			const endDate = p.actualHarvestDate || p.harvestDate;
			if (!startDate) return false;
			const startM = new Date(startDate).getMonth() + 1;
			if (endDate) {
				const endM = new Date(endDate).getMonth() + 1;
				return m >= startM && m <= endM;
			}
			return m >= startM;
		}).length;
	});

	const rotationAlerts = await getRotationAlerts();
	const recentActivity = [...allPlantations].reverse().slice(0, 5);

	return {
		stats: {
			bedCount,
			plantCount,
			activeCount: active.length,
			harvestedCount: harvested.length,
			plannedCount: planned.length,
			totalArea: Math.round(totalArea * 10) / 10,
			avgBedSize: Math.round(avgBedSize * 10) / 10
		},
		topCrops,
		occupationByMonth,
		active: active.slice(0, 10),
		recentActivity,
		sowingAlerts,
		harvestAlerts,
		rotationAlerts: rotationAlerts.filter(a => a.type === 'warning').slice(0, 3)
	};
};
