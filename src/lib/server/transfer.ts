import { db } from '$lib/server/db';
import { gardenBeds, gardenPhotos, plantations, plants, plantFavorites, harvestRecords } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export interface ExportData {
	version: 1;
	exportedAt: string;
	gardenBeds: Array<{
		name: string;
		polygon: string;
		type: string | null;
		color: string | null;
		soilType: string | null;
		sunExposure: string | null;
		length: number | null;
		width: number | null;
		orientation: string | null;
		notes: string | null;
		createdAt: string;
		updatedAt: string;
		plantations: Array<{
			plantId: number | null;
			plantName: string;
			variety: string | null;
			sowingDate: string | null;
			plantingDate: string | null;
			harvestDate: string | null;
			actualHarvestDate: string | null;
			status: string;
			quantity: number | null;
			notes: string | null;
			createdAt: string;
			updatedAt: string;
			harvests: Array<{
				weightKg: number | null;
				quantity: number | null;
				condition: string | null;
				notes: string | null;
				harvestedAt: string;
			}>;
		}>;
	}>;
	gardenPhotos: Array<{
		label: string;
		filename: string;
		createdAt: string;
	}>;
	favoritePlantIds: number[];
}

export function exportUserData(userId: number): ExportData {
	const beds = db.select().from(gardenBeds).where(eq(gardenBeds.userId, userId)).all();
	const allPlantations = db.select().from(plantations).where(eq(plantations.userId, userId)).all();
	const photos = db.select().from(gardenPhotos).where(eq(gardenPhotos.userId, userId)).all();
	const favs = db.select().from(plantFavorites).where(eq(plantFavorites.userId, userId)).all();

	const plantationIds = allPlantations.map(p => p.id);
	const harvests = plantationIds.length > 0
		? db.select().from(harvestRecords).where(eq(harvestRecords.userId, userId)).all()
		: [];
	const harvestsByPlantation: Record<number, typeof harvests> = {};
	for (const h of harvests) {
		if (!harvestsByPlantation[h.plantationId]) harvestsByPlantation[h.plantationId] = [];
		harvestsByPlantation[h.plantationId].push(h);
	}

	const bedExport = beds.map(bed => {
		const bedPlantations = allPlantations
			.filter(p => p.gardenBedId === bed.id)
			.map(({ id, plantId, plantName, variety, sowingDate, plantingDate, harvestDate, actualHarvestDate, status, quantity, notes, createdAt, updatedAt }) => ({
				plantId, plantName, variety, sowingDate, plantingDate, harvestDate, actualHarvestDate, status, quantity, notes, createdAt, updatedAt,
				harvests: (harvestsByPlantation[id] || []).map(h => ({
					weightKg: h.weightKg,
					quantity: h.quantity,
					condition: h.condition,
					notes: h.notes,
					harvestedAt: h.harvestedAt
				}))
			}));
		return {
			name: bed.name,
			polygon: bed.polygon,
			type: bed.type,
			color: bed.color,
			soilType: bed.soilType,
			sunExposure: bed.sunExposure,
			length: bed.length,
			width: bed.width,
			orientation: bed.orientation,
			notes: bed.notes,
			createdAt: bed.createdAt,
			updatedAt: bed.updatedAt,
			plantations: bedPlantations
		};
	});

	return {
		version: 1,
		exportedAt: new Date().toISOString(),
		gardenBeds: bedExport,
		gardenPhotos: photos.map(p => ({ label: p.label, filename: p.filename, createdAt: p.createdAt })),
		favoritePlantIds: favs.map(f => f.plantId)
	};
}

export function importUserData(userId: number, data: ExportData): { beds: number; plantations: number; photos: number; favorites: number } {
	const now = new Date().toISOString();
	let bedCount = 0;
	let plantationCount = 0;

	if (data.gardenBeds) {
		for (const bed of data.gardenBeds) {
			const inserted = db.insert(gardenBeds).values({
				userId,
				name: bed.name,
				polygon: bed.polygon,
				type: bed.type || 'pixel',
				color: bed.color || '#64748b',
				soilType: bed.soilType,
				sunExposure: bed.sunExposure,
				length: bed.length,
				width: bed.width,
				orientation: bed.orientation,
				notes: bed.notes,
				createdAt: bed.createdAt || now,
				updatedAt: bed.updatedAt || now
			}).returning().get();
			bedCount++;

			if (bed.plantations) {
				for (const p of bed.plantations) {
					const insertedP = db.insert(plantations).values({
						userId,
						gardenBedId: inserted.id,
						plantId: p.plantId,
						plantName: p.plantName,
						variety: p.variety,
						sowingDate: p.sowingDate,
						plantingDate: p.plantingDate,
						harvestDate: p.harvestDate,
						actualHarvestDate: p.actualHarvestDate,
						status: p.status || 'planned',
						quantity: p.quantity,
						notes: p.notes,
						createdAt: p.createdAt || now,
						updatedAt: p.updatedAt || now
					}).returning().get();
					plantationCount++;

					if (p.harvests) {
						for (const h of p.harvests) {
							db.insert(harvestRecords).values({
								userId,
								plantationId: insertedP.id,
								weightKg: h.weightKg,
								quantity: h.quantity,
								condition: h.condition,
								notes: h.notes,
								harvestedAt: h.harvestedAt || now
							}).run();
						}
					}
				}
			}
		}
	}

	let photoCount = 0;
	if (data.gardenPhotos) {
		for (const photo of data.gardenPhotos) {
			db.insert(gardenPhotos).values({
				userId,
				label: photo.label,
				filename: photo.filename,
				createdAt: photo.createdAt || now
			}).run();
			photoCount++;
		}
	}

	// Re-link favorites only for plants that still exist in the knowledge base
	let favCount = 0;
	if (data.favoritePlantIds) {
		const distinctIds = [...new Set(data.favoritePlantIds)];
		if (distinctIds.length > 0) {
			const existing = db.select({ id: plants.id }).from(plants).all();
			const existingIds = new Set(existing.map(p => p.id));
			for (const plantId of distinctIds) {
				if (existingIds.has(plantId)) {
					try {
						db.insert(plantFavorites).values({ userId, plantId }).run();
						favCount++;
					} catch { /* skip duplicates */ }
				}
			}
		}
	}

	return { beds: bedCount, plantations: plantationCount, photos: photoCount, favorites: favCount };
}
