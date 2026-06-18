import { db } from '$lib/server/db';
import { gardenBeds, plantations, plants } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';
import { getRotationAlerts } from '$lib/server/rotation';
import { computeStatus } from '$lib/server/planting';

export const load: PageServerLoad = async (event) => {
	event.depends('app:plantations');
	const all = db.select({
		plantation: plantations,
		bedName: gardenBeds.name,
		plantName: plants.commonName,
		plantPhotos: plants.photos
	})
		.from(plantations)
		.leftJoin(gardenBeds, eq(plantations.gardenBedId, gardenBeds.id))
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.orderBy(plantations.createdAt)
		.all();

	const beds = db.select().from(gardenBeds).all();
	const plantList = db.select().from(plants).orderBy(asc(plants.commonName)).all();
	const rotationAlerts = await getRotationAlerts();

	return { plantations: all, beds, plants: plantList, rotationAlerts };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const gardenBedId = data.get('gardenBedId') as string;
		const plantName = data.get('plantName') as string;
		const plantId = data.get('plantId') as string;
		const variety = data.get('variety') as string;
		const sowingDate = data.get('sowingDate') as string;
		const plantingDate = data.get('plantingDate') as string;
		const harvestDate = data.get('harvestDate') as string;
		const quantity = data.get('quantity') as string;
		const notes = data.get('notes') as string;

		if (!gardenBedId || !plantName) {
			return fail(400, { error: 'Bed and plant name required' });
		}

		db.insert(plantations).values({
			gardenBedId: parseInt(gardenBedId),
			plantId: plantId ? parseInt(plantId) : null,
			plantName,
			variety: variety || null,
			sowingDate: sowingDate || null,
			plantingDate: plantingDate || null,
			harvestDate: harvestDate || null,
			quantity: quantity ? parseInt(quantity) : null,
			notes: notes || null,
			status: computeStatus(sowingDate || null, plantingDate || null, harvestDate || null)
		}).run();

		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const gardenBedId = data.get('gardenBedId') as string;
		const plantName = data.get('plantName') as string;
		const plantId = data.get('plantId') as string;
		const variety = data.get('variety') as string;
		const sowingDate = data.get('sowingDate') as string;
		const plantingDate = data.get('plantingDate') as string;
		const harvestDate = data.get('harvestDate') as string;
		const quantity = data.get('quantity') as string;
		const notes = data.get('notes') as string;

		if (!id || !gardenBedId || !plantName) {
			return fail(400, { error: 'Missing required fields' });
		}

		db.update(plantations).set({
			gardenBedId: parseInt(gardenBedId),
			plantId: plantId ? parseInt(plantId) : null,
			plantName,
			variety: variety || null,
			sowingDate: sowingDate || null,
			plantingDate: plantingDate || null,
			harvestDate: harvestDate || null,
			quantity: quantity ? parseInt(quantity) : null,
			notes: notes || null,
			status: computeStatus(sowingDate || null, plantingDate || null, harvestDate || null),
			updatedAt: new Date().toISOString()
		}).where(eq(plantations.id, parseInt(id))).run();

		return { success: true };
	},

	updateStatus: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const status = data.get('status') as string;

		if (!id) return fail(400, { error: 'ID required' });

		// Only set date to today if not already set by the user
		const existing = db.select().from(plantations).where(eq(plantations.id, parseInt(id))).get();
		const today = new Date().toISOString().split('T')[0];
		const updateData: Record<string, string> = { status, updatedAt: new Date().toISOString() };
		if (status === 'sown' && !existing?.sowingDate) updateData.sowingDate = today;
		if (status === 'planted' && !existing?.plantingDate) updateData.plantingDate = today;
		if (status === 'harvested' && !existing?.actualHarvestDate) updateData.actualHarvestDate = today;

		db.update(plantations).set(updateData).where(eq(plantations.id, parseInt(id))).run();
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id) {
			db.delete(plantations).where(eq(plantations.id, parseInt(id))).run();
		}
		return { success: true };
	}
};
