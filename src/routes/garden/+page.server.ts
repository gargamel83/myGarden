import { db } from '$lib/server/db';
import { gardenBeds, gardenPhotos, plantations, plants } from '$lib/server/db/schema';
import { eq, inArray, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import type { PageServerLoad, Actions } from './$types.js';
import { getRotationAlerts, getBedHistory, getBedAdvice } from '$lib/server/rotation';

export const load: PageServerLoad = async (event) => {
	event.depends('app:garden');
	const photos = db.select().from(gardenPhotos).orderBy(gardenPhotos.createdAt).all();
	const beds = db.select().from(gardenBeds).orderBy(gardenBeds.createdAt).all();

	const rotationAlerts = await getRotationAlerts();
	const bedIds = beds.map(b => b.id);

	// Batch load all bed histories in a single query
	const allHistory = db.select({
		bedId: plantations.gardenBedId,
		plantId: plantations.plantId,
		plantName: plantations.plantName,
		status: plantations.status,
		harvestDate: plantations.actualHarvestDate,
		plantFamily: plants.family
	})
		.from(plantations)
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.where(inArray(plantations.gardenBedId, bedIds))
		.orderBy(plantations.createdAt)
		.all();

	const bedHistories: Record<number, Awaited<ReturnType<typeof getBedHistory>>> = {};
	for (const bedId of bedIds) {
		bedHistories[bedId] = allHistory
			.filter(h => h.bedId === bedId)
			.map(p => ({
				plantId: p.plantId,
				plantName: p.plantName,
				family: p.plantFamily,
				year: p.harvestDate ? new Date(p.harvestDate).getFullYear() : new Date().getFullYear(),
				status: p.status
			}));
	}

	// Load active plantations per bed
	const allPlantations = db.select({
		id: plantations.id,
		gardenBedId: plantations.gardenBedId,
		plantName: plantations.plantName,
		variety: plantations.variety,
		sowingDate: plantations.sowingDate,
		plantingDate: plantations.plantingDate,
		harvestDate: plantations.harvestDate,
		status: plantations.status,
		quantity: plantations.quantity,
		notes: plantations.notes,
		family: plants.family,
		plantPhoto: plants.photos
	})
		.from(plantations)
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.orderBy(asc(plantations.createdAt))
		.all();

	const bedPlantations: Record<number, typeof allPlantations> = {};
	for (const p of allPlantations) {
		if (!bedPlantations[p.gardenBedId]) bedPlantations[p.gardenBedId] = [];
		bedPlantations[p.gardenBedId].push(p);
	}

	const bedAdvice: Record<number, string[]> = {};
	for (const bed of beds) {
		const advice = getBedAdvice(bed.soilType, bed.sunExposure);
		if (advice.length > 0) {
			bedAdvice[bed.id] = advice.slice(0, 8).map(p => p.commonName);
		}
	}

	return { photos, beds, rotationAlerts, bedHistories, bedPlantations, bedAdvice };
};

export const actions: Actions = {
	upload: async ({ request }) => {
		const data = await request.formData();
		const label = data.get('label') as string;
		const file = data.get('photo') as File;

		if (!file || file.size === 0) {
			return fail(400, { error: 'File required' });
		}

		const ext = file.name.split('.').pop();
		const filename = `${Date.now()}.${ext}`;
		const buffer = Buffer.from(await file.arrayBuffer());
		const uploadDir = 'static/uploads';
		if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
		writeFileSync(`${uploadDir}/${filename}`, buffer);

		db.insert(gardenPhotos).values({
			label: label || 'Garden photo',
			filename,
			width: 0,
			height: 0
		}).run();

		return { success: true, filename };
	},

	saveBed: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const polygon = data.get('polygon') as string;
		const type = (data.get('coordinatesType') as string) || 'pixel';
		const color = data.get('color') as string;
		const soilType = data.get('soilType') as string;
		const sunExposure = data.get('sunExposure') as string;
		const length = data.get('length') as string;
		const width = data.get('width') as string;
		const orientation = data.get('orientation') as string;
		const notes = data.get('notes') as string;

		if (!name || !polygon) {
			return fail(400, { error: 'Name and polygon required' });
		}

		const bedData = {
			name,
			polygon,
			type,
			color: color || '#4ade80',
			soilType: soilType || null,
			sunExposure: sunExposure || null,
			length: length ? parseFloat(length) : null,
			width: width ? parseFloat(width) : null,
			orientation: orientation || null,
			notes: notes || null,
			updatedAt: new Date().toISOString()
		};

		if (id) {
			db.update(gardenBeds).set(bedData).where(eq(gardenBeds.id, parseInt(id))).run();
		} else {
			db.insert(gardenBeds).values(bedData).run();
		}

		return { success: true };
	},

	deleteBed: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id) {
			try {
				db.delete(gardenBeds).where(eq(gardenBeds.id, parseInt(id))).run();
			} catch (e) {
				const msg = (e as Error).message || '';
				if (msg.includes('FOREIGN KEY')) {
					return fail(400, { error: 'Cannot delete this bed: there are linked plantations' });
				}
				return fail(500, { error: 'Error while deleting' });
			}
		}
		return { success: true };
	}
};
