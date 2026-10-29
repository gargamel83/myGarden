import { db } from '$lib/server/db';
import { plants, plantFavorites, plantMedia, diseases } from '$lib/server/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import { parseCareTips, serializeCareTips } from '$lib/care-tips';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ params, locals, depends }) => {
	depends('app:plant');
	const id = parseInt(params.id);
	if (isNaN(id)) error(404, 'Plant not found');

	const plant = db.select().from(plants).where(eq(plants.id, id)).get();
	if (!plant) error(404, 'Plant not found');

	const userId = locals.user?.id;
	let isFavorite = false;
	if (userId) {
		const fav = db.select().from(plantFavorites)
			.where(and(eq(plantFavorites.userId, userId), eq(plantFavorites.plantId, id)))
			.get();
		isFavorite = !!fav;
	}

	// Load plant_media (diseases & growth photos) - grouped by type
	let diseaseMedia: Array<{ id: number; url: string; caption: string | null; createdAt: string }> = [];
	let galleryMedia: Array<{ id: number; url: string; caption: string | null; createdAt: string }> = [];

	if (userId) {
		const allMedia = db.select({
			id: plantMedia.id,
			url: plantMedia.url,
			caption: plantMedia.caption,
			createdAt: plantMedia.createdAt,
			type: plantMedia.type
		}).from(plantMedia)
			.where(and(eq(plantMedia.plantId, id), eq(plantMedia.userId, userId)))
			.all();

		for (const m of allMedia) {
			if (m.type === 'disease') {
				diseaseMedia.push({
					id: m.id, url: m.url, caption: m.caption, createdAt: m.createdAt
				});
			} else {
				galleryMedia.push({
					id: m.id, url: m.url, caption: m.caption, createdAt: m.createdAt
				});
			}
		}
	}

	let companions: typeof plants.$inferSelect[] = [];
	let antagonists: typeof plants.$inferSelect[] = [];

	try {
		const companionIds = plant.companions ? JSON.parse(plant.companions) : [];
		const antagonistIds = plant.antagonists ? JSON.parse(plant.antagonists) : [];

		const allPlants = db.select().from(plants).all();

		function lookupNames(names: string[]): typeof plants.$inferSelect[] {
			return names.map(name => {
				const exact = allPlants.find(p => p.commonName === name);
				if (exact) return exact;
				return allPlants.find(p => p.commonName.startsWith(name));
			}).filter((p): p is typeof plants.$inferSelect => p !== undefined);
		}

		if (companionIds.length > 0) {
			companions = lookupNames(companionIds);
		}
		if (antagonistIds.length > 0) {
			antagonists = lookupNames(antagonistIds);
		}
	} catch { /* silent */ }

	const sameFamily = db.select()
		.from(plants)
		.where(eq(plants.family, plant.family || ''))
		.all()
		.filter(p => p.id !== plant.id);

	return {
		plant,
		companions,
		antagonists,
		sameFamily,
		isFavorite,
		careTips: parseCareTips(plant.careTips),
		diseaseMedia,
		galleryMedia
	};
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
		const currentPhotos = existing?.photos ? JSON.parse(existing.photos) : [];

		// Handle new plant_media uploads
		const newMedia = data.getAll('newMedia') as File[];
		const newMediaTypes = data.getAll('newMediaType') as string[];
		const newMediaCaptions = data.getAll('newMediaCaption') as string[];

		let photoList = [...currentPhotos];

		for (let i = 0; i < newMedia.length; i++) {
			const file = newMedia[i];
			const type = newMediaTypes[i] || 'gallery';
			const caption = newMediaCaptions[i] || '';

			if (!file || file.size === 0) continue;

			const filename = `plant_${id}_${Date.now()}_${i}.webp`;
			const buffer = Buffer.from(await file.arrayBuffer());
			const uploadDir = 'static/uploads';
			if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
			const resized = await sharp(buffer)
				.resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
				.webp({ quality: 80 })
				.toBuffer();
			writeFileSync(`${uploadDir}/${filename}`, resized);

			const url = `/uploads/${filename}`;

			// Store in plant_media table
			db.insert(plantMedia).values({
				plantId: id,
				userId: undefined,
				url,
				type,
				caption,
				createdAt: new Date().toISOString()
			}).run();

			photoList.push(url);
		}

		// Handle deletion of plant_media records
		const deleteMediaIds = data.getAll('deleteMediaId') as string[];
		for (const delId of deleteMediaIds) {
			const md = Number(delId);
			if (!Number.isInteger(md)) continue;
			db.delete(plantMedia).where(eq(plantMedia.id, md)).run();
			// Also remove from photoList if it's in the first N (simple heuristic)
			// On laisse le user gérer le nettoyage côté UI, côté serveur on supprime la DB
		}

		db.update(plants).set({
			commonName,
			photos: JSON.stringify(photoList),
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

	favorite: async ({ locals, params }) => {
		const id = parseInt(params.id);
		if (isNaN(id)) return fail(404, { error: 'Plant not found' });
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const userId = locals.user.id;

		const existing = db.select().from(plantFavorites)
			.where(and(eq(plantFavorites.userId, userId), eq(plantFavorites.plantId, id)))
			.get();

		if (existing) {
			db.delete(plantFavorites).where(eq(plantFavorites.id, existing.id)).run();
			return { success: true, favorited: false };
		}
		db.insert(plantFavorites).values({
			userId,
			plantId: id,
			createdAt: new Date().toISOString()
		}).run();
		return { success: true, favorited: true };
	}
};
