import { db } from '$lib/server/db';
import { plants } from '$lib/server/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ params, depends }) => {
	depends('app:plant');
	const id = parseInt(params.id);
	if (isNaN(id)) error(404, 'Plant not found');

	const plant = db.select().from(plants).where(eq(plants.id, id)).get();
	if (!plant) error(404, 'Plant not found');

	let companions: typeof plants.$inferSelect[] = [];
	let antagonists: typeof plants.$inferSelect[] = [];

	try {
		const companionIds = plant.companions ? JSON.parse(plant.companions) : [];
		const antagonistIds = plant.antagonists ? JSON.parse(plant.antagonists) : [];

		if (companionIds.length > 0) {
			companions = db.select().from(plants)
				.where(inArray(plants.commonName, companionIds))
				.all();
		}
		if (antagonistIds.length > 0) {
			antagonists = db.select().from(plants)
				.where(inArray(plants.commonName, antagonistIds))
				.all();
		}
	} catch { /* silent */ }

	const sameFamily = db.select()
		.from(plants)
		.where(eq(plants.family, plant.family || ''))
		.all()
		.filter(p => p.id !== plant.id);

	return { plant, companions, antagonists, sameFamily };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) return fail(404, { error: 'Plant not found' });

		const data = await request.formData();
		const commonName = data.get('commonName') as string;
		if (!commonName) return fail(400, { error: 'Name required' });

		// Preserve existing photos if not overwritten
		const existing = db.select().from(plants).where(eq(plants.id, id)).get();
		const currentPhotos = existing?.photos || '[]';

		db.update(plants).set({
			commonName,
			latinName: (data.get('latinName') as string) || null,
			family: (data.get('family') as string) || null,
			description: (data.get('description') as string) || null,
			sowingStart: (data.get('sowingStart') as string) || null,
			sowingEnd: (data.get('sowingEnd') as string) || null,
			plantingStart: (data.get('plantingStart') as string) || null,
			plantingEnd: (data.get('plantingEnd') as string) || null,
			harvestStart: (data.get('harvestStart') as string) || null,
			harvestEnd: (data.get('harvestEnd') as string) || null,
			sunExposure: (data.get('sunExposure') as string) || null,
			soilType: (data.get('soilType') as string) || null,
			watering: (data.get('watering') as string) || null,
			spacing: data.get('spacing') ? parseFloat(data.get('spacing') as string) : null,
			rowSpacing: data.get('rowSpacing') ? parseFloat(data.get('rowSpacing') as string) : null,
			companions: (data.get('companions') as string) || null,
			antagonists: (data.get('antagonists') as string) || null,
			photos: (data.get('photos') as string) || currentPhotos,
			updatedAt: new Date().toISOString()
		}).where(eq(plants.id, id)).run();

		return { success: true };
	},

	delete: async ({ params }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) return fail(404, { error: 'Plant not found' });

		db.delete(plants).where(eq(plants.id, id)).run();
		return { success: true, deleted: true };
	},

	uploadPhoto: async ({ request, params }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) return fail(404, { error: 'Plant not found' });

		const data = await request.formData();
		const file = data.get('photo') as File;

		if (!file || file.size === 0) {
			return fail(400, { error: 'File required' });
		}

		const filename = `plant_${id}_${Date.now()}.webp`;
		const buffer = Buffer.from(await file.arrayBuffer());
		const uploadDir = 'static/uploads';
		if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
		const resized = await sharp(buffer)
			.resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();
		writeFileSync(`${uploadDir}/${filename}`, resized);

		// Append to existing photos
		const plant = db.select().from(plants).where(eq(plants.id, id)).get();
		let photoList: string[] = [];
		try { photoList = plant?.photos ? JSON.parse(plant.photos) : []; } catch { /* empty */ }
		photoList.push(`/uploads/${filename}`);

		db.update(plants).set({
			photos: JSON.stringify(photoList),
			updatedAt: new Date().toISOString()
		}).where(eq(plants.id, id)).run();

		return { success: true, url: `/uploads/${filename}` };
	}
};
