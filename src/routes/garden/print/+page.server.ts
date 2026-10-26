import { db } from '$lib/server/db';
import { gardenBeds, plantations, plants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const userId = event.locals.user!.id;

	const beds = db.select().from(gardenBeds).where(eq(gardenBeds.userId, userId)).all();
	const allPlantations = db
		.select({
			plantation: plantations,
			bedName: gardenBeds.name,
			plantName: plants.commonName
		})
		.from(plantations)
		.leftJoin(gardenBeds, eq(plantations.gardenBedId, gardenBeds.id))
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.where(eq(plantations.userId, userId))
		.all();

	const plantingsByBed: Record<number, Array<{ plantName: string; variety: string | null; status: string }>> = {};
	for (const row of allPlantations) {
		if (!row.plantation.gardenBedId) continue;
		if (!plantingsByBed[row.plantation.gardenBedId]) plantingsByBed[row.plantation.gardenBedId] = [];
		plantingsByBed[row.plantation.gardenBedId].push({
			plantName: row.plantName || row.plantation.plantName,
			variety: row.plantation.variety,
			status: row.plantation.status
		});
	}

	return {
		beds,
		plantingsByBed,
		user: event.locals.user,
		printedAt: new Date().toISOString()
	};
};
