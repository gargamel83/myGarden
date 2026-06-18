import { db } from '$lib/server/db';
import { gardenBeds, plants, plantations } from '$lib/server/db/schema';
import { eq, inArray, sql } from 'drizzle-orm';
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

	const today = new Date();
	const currentMonth = today.getMonth() + 1;
	const currentDay = today.getDate();
	const currentMD = currentMonth * 100 + currentDay;

	const refPlantIds = [...new Set(allPlantations.filter(p => p.plantId).map(p => p.plantId as number))];
	const plantMap = new Map(
		db.select().from(plants).where(inArray(plants.id, refPlantIds)).all()
			.map(p => [p.id, p])
	);

	const sowingAlerts: { plantation: typeof plantations.$inferSelect; plant: typeof plants.$inferSelect | null; daysLeft: number }[] = [];

	for (const p of allPlantations) {
		if (p.plantId && p.status === 'planned') {
			const plant = plantMap.get(p.plantId) ?? null;
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

	const harvestAlerts: { plantation: typeof plantations.$inferSelect; plant: typeof plants.$inferSelect | null; daysLeft: number }[] = [];
	for (const p of active) {
		if (p.plantId) {
			const plant = plantMap.get(p.plantId) ?? null;
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

	// --- New advanced stats ---

	// 1. Success rate per bed
	const totalNonCancelled = allPlantations.filter(p => p.status !== 'cancelled').length;
	const successRate = totalNonCancelled > 0
		? Math.round((harvested.length / totalNonCancelled) * 100)
		: 0;

	// 2. Average cycle duration (days from sowing to harvest for completed cycles)
	const finished = allPlantations.filter(p =>
		p.status === 'harvested' && p.sowingDate && p.actualHarvestDate
	);
	const cycleDays = finished.map(p => {
		const diff = new Date(p.actualHarvestDate!).getTime() - new Date(p.sowingDate!).getTime();
		return Math.round(diff / 86400000);
	});
	const avgCycleDays = cycleDays.length > 0
		? Math.round(cycleDays.reduce((a, b) => a + b, 0) / cycleDays.length)
		: 0;

	// 3. New plantations per month (last 12 months)
	const now = new Date();
	const plantationsByMonth: { month: string; count: number }[] = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		const count = allPlantations.filter(p => {
			if (!p.createdAt) return false;
			const c = new Date(p.createdAt);
			return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
		}).length;
		plantationsByMonth.push({ month: monthKey, count });
	}

	// 4. Family distribution
	const familyCounts: Record<string, number> = {};
	for (const p of allPlantations) {
		if (p.plantId) {
			const plant = plantMap.get(p.plantId);
			const family = plant?.family || 'Inconnue';
			familyCounts[family] = (familyCounts[family] || 0) + 1;
		} else {
			familyCounts['Inconnue'] = (familyCounts['Inconnue'] || 0) + 1;
		}
	}
	const familyDistribution = Object.entries(familyCounts)
		.sort((a, b) => b[1] - a[1])
		.map(([family, count]) => ({ family, count }));

	// 5. Bed utilization (months occupied this year)
	const thisYear = now.getFullYear();
	const bedUtilization: { bedId: number; bedName: string; occupiedMonths: number }[] = beds.map(b => {
		const occupied = new Set<number>();
		const bedPlantations = allPlantations.filter(p => p.gardenBedId === b.id && p.status !== 'cancelled');
		for (const p of bedPlantations) {
			const startDate = p.sowingDate || p.plantingDate;
			const endDate = p.actualHarvestDate || p.harvestDate;
			if (!startDate) continue;
			const startM = new Date(startDate).getMonth() + 1;
			const startY = new Date(startDate).getFullYear();
			if (startY > thisYear) continue;
			if (endDate) {
				const endM = new Date(endDate).getMonth() + 1;
				const endY = new Date(endDate).getFullYear();
				for (let m = (startY < thisYear ? 1 : startM); m <= (endY > thisYear ? 12 : endM); m++) {
					occupied.add(m);
				}
			} else {
				for (let m = (startY < thisYear ? 1 : startM); m <= 12; m++) {
					occupied.add(m);
				}
			}
		}
		return { bedId: b.id, bedName: b.name, occupiedMonths: occupied.size };
	});

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
		rotationAlerts: rotationAlerts.filter(a => a.type === 'warning').slice(0, 3),
		advanced: {
			successRate,
			avgCycleDays,
			completedCycles: cycleDays.length,
			plantationsByMonth,
			familyDistribution,
			bedUtilization
		}
	};
};
