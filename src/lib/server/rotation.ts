import { db } from './db';
import { plantations, plants, gardenBeds } from './db/schema';
import { eq, inArray, and, notInArray } from 'drizzle-orm';

export interface RotationAlert {
	bedId: number;
	bedName: string;
	message: string;
	type: 'warning' | 'info' | 'success';
	lastPlant?: string;
	lastFamily?: string;
	suggestedPlants?: string[];
}

export interface BedPlantHistory {
	plantId: number | null;
	plantName: string;
	family: string | null;
	year: number;
	status: string;
}

// Families and their recommended return time (years)
const FAMILY_ROTATION_GAP: Record<string, number> = {
	'Solanaceae': 4,
	'Brassicaceae': 3,
	'Cucurbitaceae': 4,
	'Apiaceae': 3,
	'Fabaceae': 2,
	'Amaryllidaceae': 3,
	'Asteraceae': 3,
	'Chenopodiaceae': 3,
	'Poaceae': 2,
	'Lamiaceae': 2
};

// After a certain family, what to plant next?
function getNextFamilySuggestions(family: string | null): string[] {
	if (!family) return [];
	const suggestions: Record<string, string[]> = {
		'Solanaceae': ['Fabaceae', 'Apiaceae', 'Brassicaceae', 'Chenopodiaceae'],
		'Brassicaceae': ['Fabaceae', 'Amaryllidaceae', 'Poaceae', 'Apiaceae'],
		'Cucurbitaceae': ['Fabaceae', 'Brassicaceae', 'Amaryllidaceae'],
		'Apiaceae': ['Brassicaceae', 'Fabaceae', 'Solanaceae', 'Cucurbitaceae'],
		'Fabaceae': ['Solanaceae', 'Cucurbitaceae', 'Brassicaceae', 'Chenopodiaceae'],
		'Amaryllidaceae': ['Brassicaceae', 'Apiaceae', 'Asteraceae', 'Fabaceae'],
		'Asteraceae': ['Fabaceae', 'Solanaceae', 'Apiaceae', 'Cucurbitaceae'],
		'Chenopodiaceae': ['Brassicaceae', 'Apiaceae', 'Solanaceae', 'Fabaceae'],
		'Poaceae': ['Fabaceae', 'Brassicaceae', 'Amaryllidaceae'],
		'Lamiaceae': ['Apiaceae', 'Fabaceae', 'Solanaceae']
	};
	return suggestions[family] || [];
}

export async function getBedHistory(bedId: number): Promise<BedPlantHistory[]> {
	const all = db.select({
		plantId: plantations.plantId,
		plantName: plantations.plantName,
		status: plantations.status,
		harvestDate: plantations.actualHarvestDate,
		plantFamily: plants.family
	})
		.from(plantations)
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.where(eq(plantations.gardenBedId, bedId))
		.orderBy(plantations.createdAt)
		.all();

	return all.map(p => ({
		plantId: p.plantId,
		plantName: p.plantName,
		family: p.plantFamily,
		year: p.harvestDate ? new Date(p.harvestDate).getFullYear() : new Date().getFullYear(),
		status: p.status
	}));
}

export async function getRotationSuggestions(bedId: number): Promise<{
	recommended: typeof plants.$inferSelect[];
	notRecommended: typeof plants.$inferSelect[];
	lastFamily: string | null;
	history: BedPlantHistory[];
}> {
	const history = await getBedHistory(bedId);

	// Find the family of the last harvested crop
	const lastHarvested = [...history].reverse().find(p => p.status === 'harvested');
	const lastFamily = lastHarvested?.family || null;

	// Families to avoid
	const bannedFamilies = new Set<string>();
	const bannedPlants = new Set<number>();

	if (lastFamily) {
		bannedFamilies.add(lastFamily);
		// Add plants from the same family
		const sameFamily = db.select()
			.from(plants)
			.where(eq(plants.family, lastFamily))
			.all();
		sameFamily.forEach(p => bannedPlants.add(p.id));
	}

	// If the same family has been planted 2 times in a row, broaden the restriction
	const familiesInHistory = history
		.filter(p => p.family)
		.map(p => p.family as string);

	const familyCounts: Record<string, number> = {};
	for (const f of familiesInHistory) {
		familyCounts[f] = (familyCounts[f] || 0) + 1;
	}

	for (const [fam, count] of Object.entries(familyCounts)) {
		if (count >= 2) bannedFamilies.add(fam);
	}

	// Get all plants
	const allPlants = db.select().from(plants).all();

	const recommended = allPlants.filter(p =>
		!bannedFamilies.has(p.family || '') && !bannedPlants.has(p.id)
	);

	// For not recommended, exclude plants already in recommended
	const notRecommended = allPlants.filter(p =>
		(bannedFamilies.has(p.family || '') || bannedPlants.has(p.id))
	);

	return { recommended, notRecommended, lastFamily, history };
}

// Personalized advice per bed (soil + exposure)
export function getBedAdvice(soilType: string | null, sunExposure: string | null): typeof plants.$inferSelect[] {
	const all = db.select().from(plants).all();

	return all.filter(p => {
		if (sunExposure && p.sunExposure && p.sunExposure !== sunExposure) {
			// Compatibility: full_sun also accepts partial_shade, partial_shade also accepts shade
			if (sunExposure === 'plein_soleil' && p.sunExposure === 'ombre') return false;
			if (sunExposure === 'ombre' && p.sunExposure === 'plein_soleil') return false;
			if (sunExposure === 'plein_soleil' && p.sunExposure === 'mi_ombre') return true;
			if (sunExposure === 'mi_ombre' && p.sunExposure === 'plein_soleil') return true;
			if (sunExposure === 'mi_ombre' && p.sunExposure === 'ombre') return true;
			if (sunExposure === 'ombre' && p.sunExposure === 'mi_ombre') return true;
			return false;
		}
		return true;
	}).filter(p => {
		if (soilType && p.soilType && p.soilType !== soilType) return false;
		return true;
	});
}

export async function getRotationAlerts(): Promise<RotationAlert[]> {
	const alerts: RotationAlert[] = [];
	const beds = db.select().from(gardenBeds).all();

	for (const bed of beds) {
		const { history, lastFamily, recommended } = await getRotationSuggestions(bed.id);
		const harvested = history.filter(p => p.status === 'harvested');

		if (harvested.length === 0) {
			continue;
		}

		const last = harvested[harvested.length - 1];

		// Check if the same family has been planted 2 times in a row
		const families = harvested.filter(p => p.family).map(p => p.family);
		const lastFams = families.slice(-2);
		if (lastFams.length === 2 && lastFams[0] === lastFams[1] && lastFams[0]) {
			alerts.push({
				bedId: bed.id,
				bedName: bed.name,
				message: `⚠️ The bed received 2 consecutive crops from the ${lastFams[0]} family. Risk of soil depletion and diseases.`,
				type: 'warning',
				lastPlant: last.plantName,
				lastFamily: last.family || undefined
			});
		} else if (lastFamily) {
			const nextFamilies = getNextFamilySuggestions(lastFamily);
			const suggestedPlants = recommended
				.filter(p => nextFamilies.includes(p.family || ''))
				.slice(0, 3)
				.map(p => p.commonName);

			alerts.push({
				bedId: bed.id,
				bedName: bed.name,
				message: `After ${last.plantName} (${lastFamily}), favor plants from the ${nextFamilies.join(', ')} families.`,
				type: 'info',
				lastPlant: last.plantName,
				lastFamily: lastFamily,
				suggestedPlants: suggestedPlants.length > 0 ? suggestedPlants : undefined
			});
		}

		// If more than 2 years with the same dominant family
		if (families.length >= 3) {
			const lastThree = families.slice(-3);
			const unique = new Set(lastThree);
			if (unique.size === 1 && [...unique][0]) {
				alerts.push({
					bedId: bed.id,
					bedName: bed.name,
					message: `🚫 The ${[...unique][0]} family has been grown for 3 cycles in this bed. Urgent rotation needed!`,
					type: 'warning',
					lastPlant: last.plantName,
					lastFamily: last.family || undefined
				});
			}
		}
	}

	return alerts;
}
