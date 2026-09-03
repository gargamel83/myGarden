import { db } from '$lib/server/db';
import { gardenBeds, gardenPhotos, plantations, plants } from '$lib/server/db/schema';
import { eq, inArray, asc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import sharp from 'sharp';
import type { PageServerLoad, Actions } from './$types.js';
import { getRotationAlerts, getBedHistory, getBedAdvice, buildRotationPlan } from '$lib/server/rotation';

export const load: PageServerLoad = async (event) => {
	event.depends('app:garden');
	const userId = event.locals.user!.id;
	const photos = db.select().from(gardenPhotos).where(eq(gardenPhotos.userId, userId)).orderBy(gardenPhotos.createdAt).all();
	const beds = db.select().from(gardenBeds).where(eq(gardenBeds.userId, userId)).orderBy(gardenBeds.createdAt).all();

	const rotationAlerts = await getRotationAlerts(userId);
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
		.where(eq(plantations.userId, userId))
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

	const rotationPlans: Record<number, ReturnType<typeof buildRotationPlan>> = {};
	for (const bed of beds) {
		rotationPlans[bed.id] = buildRotationPlan(bed.id, bed.name, bedHistories[bed.id] || [], 3);
	}

	const zones = [...new Set(beds.map(b => b.zone).filter((z): z is string => !!z))].sort();

	return { photos, beds, rotationAlerts, bedHistories, bedPlantations, bedAdvice, rotationPlans, zones };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		const data = await request.formData();
		const label = data.get('label') as string;
		const file = data.get('photo') as File;

		if (!file || file.size === 0) {
			return fail(400, { error: 'File required' });
		}

		const filename = `${Date.now()}.webp`;
		const buffer = Buffer.from(await file.arrayBuffer());
		const uploadDir = 'static/uploads';
		if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
		const resized = await sharp(buffer)
			.resize(1600, 1200, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: 80 })
			.toBuffer();
		writeFileSync(`${uploadDir}/${filename}`, resized);

		db.insert(gardenPhotos).values({
			userId: locals.user!.id,
			label: label || 'Garden photo',
			filename,
			width: 0,
			height: 0
		}).run();

		return { success: true, filename };
	},

	saveBed: async ({ request, locals }) => {
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
		const zone = data.get('zone') as string;
		const notes = data.get('notes') as string;

		if (!name || !polygon) {
			return fail(400, { error: 'Name and polygon required' });
		}

		const bedData = {
			userId: locals.user!.id,
			name,
			polygon,
			type,
			color: color || '#64748b',
			soilType: soilType || null,
			sunExposure: sunExposure || null,
			length: length ? parseFloat(length) : null,
			width: width ? parseFloat(width) : null,
			orientation: orientation || null,
			zone: zone || null,
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

	deleteBed: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id) {
			try {
				const bed = db.select({ userId: gardenBeds.userId }).from(gardenBeds).where(eq(gardenBeds.id, parseInt(id))).get();
				if (!bed || bed.userId !== locals.user!.id) {
					return fail(403, { error: 'Not authorized' });
				}
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
	},

	saveAllBeds: async ({ request, locals }) => {
		try {
			const body = await request.json();
			const snap = body?.beds;
			if (!Array.isArray(snap)) return fail(400, { error: 'Invalid payload' });

			const userId = locals.user!.id;
			const currentIds = new Set(
				db.select({ id: gardenBeds.id }).from(gardenBeds).where(eq(gardenBeds.userId, userId)).all().map(r => r.id)
			);
			const incomingIds = new Set<number>();

			db.transaction((tx) => {
				for (const b of snap) {
					const row = {
						userId,
						name: String(b.name ?? ''),
						polygon: String(b.polygon ?? '[]'),
						type: String(b.type ?? 'pixel'),
						color: String(b.color ?? '#64748b'),
						soilType: b.soilType ?? null,
						sunExposure: b.sunExposure ?? null,
						length: b.length ? parseFloat(String(b.length)) : null,
						width: b.width ? parseFloat(String(b.width)) : null,
						orientation: b.orientation ?? null,
						zone: b.zone ?? null,
						notes: b.notes ?? null,
						updatedAt: new Date().toISOString()
					};
					if (b.id && currentIds.has(Number(b.id))) {
						tx.update(gardenBeds).set(row).where(eq(gardenBeds.id, Number(b.id))).run();
						incomingIds.add(Number(b.id));
					} else {
						const res = tx.insert(gardenBeds).values(row).run();
						incomingIds.add(Number(res.lastInsertRowid));
					}
				}
				// Remove beds that were deleted by this snapshot
				for (const cid of currentIds) {
					if (!incomingIds.has(cid)) {
						try {
							tx.delete(gardenBeds).where(eq(gardenBeds.id, cid)).run();
						} catch { /* FK cascade may block; ignore */ }
					}
				}
			});

			return { success: true };
		} catch (e) {
			return fail(500, { error: (e as Error).message || 'Save all failed' });
		}
	}
};
