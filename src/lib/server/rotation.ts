import { db } from './db';
import { plantations, plants, gardenBeds } from './db/schema';
import { eq, inArray } from 'drizzle-orm';

let _allPlants: typeof plants.$inferSelect[] | null = null;

export function getAllPlants(): typeof plants.$inferSelect[] {
	if (!_allPlants) {
		_allPlants = db.select().from(plants).all();
	}
	return _allPlants;
}

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
export const FAMILY_ROTATION_GAP: Record<string, number> = {
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
export function getNextFamilySuggestions(family: string | null): string[] {
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

	const allPlants = getAllPlants();

	const recommended = allPlants.filter(p =>
		!bannedFamilies.has(p.family || '') && !bannedPlants.has(p.id)
	);

	const notRecommended = allPlants.filter(p =>
		(bannedFamilies.has(p.family || '') || bannedPlants.has(p.id))
	);

	return { recommended, notRecommended, lastFamily, history };
}

// Personalized advice per bed (soil + exposure)
export function getBedAdvice(soilType: string | null, sunExposure: string | null): typeof plants.$inferSelect[] {
	const all = getAllPlants();

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

export async function getRotationAlerts(userId?: number): Promise<RotationAlert[]> {
	const alerts: RotationAlert[] = [];
	const beds = userId
		? db.select().from(gardenBeds).where(eq(gardenBeds.userId, userId)).all()
		: db.select().from(gardenBeds).all();
	const bedIds = beds.map(b => b.id);

	// Batch load all histories in a single query
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

	// Group by bed
	const historiesMap: Record<number, BedPlantHistory[]> = {};
	for (const h of allHistory) {
		if (!historiesMap[h.bedId]) historiesMap[h.bedId] = [];
		historiesMap[h.bedId].push({
			plantId: h.plantId,
			plantName: h.plantName,
			family: h.plantFamily,
			year: h.harvestDate ? new Date(h.harvestDate).getFullYear() : new Date().getFullYear(),
			status: h.status
		});
	}

	for (const bed of beds) {
		const history = historiesMap[bed.id] || [];
		const harvested = history.filter(p => p.status === 'harvested');

		if (harvested.length === 0) {
			continue;
		}

		const last = harvested[harvested.length - 1];
		const families = harvested.filter(p => p.family).map(p => p.family as string);

		// Check if the same family has been planted 2 times in a row
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
		} else if (last.family) {
			const nextFamilies = getNextFamilySuggestions(last.family);
			const bannedFamilies = new Set([last.family]);
			const allPlants = getAllPlants();
			const recommended = allPlants.filter(p =>
				!bannedFamilies.has(p.family || '')
			);
			const suggestedPlants = recommended
				.filter(p => nextFamilies.includes(p.family || ''))
				.slice(0, 3)
				.map(p => p.commonName);

			alerts.push({
				bedId: bed.id,
				bedName: bed.name,
				message: `After ${last.plantName} (${last.family}), favor plants from the ${nextFamilies.join(', ')} families.`,
				type: 'info',
				lastPlant: last.plantName,
				lastFamily: last.family,
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

export interface RotationPlanEntry {
	year: number;
	family: string;
	plantNames: string[];
	notes: string;
}

export interface RotationPlan {
	bedId: number;
	bedName: string;
	entries: RotationPlanEntry[];
}

// Sequential family rotation over multiple years, respecting recommended gaps.
// A classic sequence when families are unknown: leafy → root → legume → fruit → leafy...
const DEFAULT_SEQUENCE = ['Fabaceae', 'Brassicaceae', 'Amaryllidaceae', 'Solanaceae', 'Apiaceae'];

function familyGap(family: string | null): number {
	return family ? (FAMILY_ROTATION_GAP[family] || 3) : 2;
}

function availableFamilies(history: BedPlantHistory[], year: number): string[] {
	const all = getAllPlants();
	const knownFamilies = new Set(all.map(p => p.family).filter((f): f is string => !!f));
	// Families still "resting" during this year
	const resting = new Set<string>();
	const gap = 3;
	for (const h of history) {
		if (!h.family) continue;
		const yearsSince = year - h.year;
		if (yearsSince < familyGap(h.family)) resting.add(h.family);
	}
	// Exclude families planted the previous year (resting)
	const candidates = [...knownFamilies].filter(f => !resting.has(f));
	return candidates.length > 0 ? candidates : [...knownFamilies];
}

function pickPlantForFamily(family: string, available: string[]): string[] {
	const all = getAllPlants();
	return all.filter(p => p.family === family).map(p => p.commonName);
}

export function buildRotationPlan(
	bedId: number,
	bedName: string,
	history: BedPlantHistory[],
	years = 3
): RotationPlan {
	const entries: RotationPlanEntry[] = [];
	const harvested = history.filter(p => p.status === 'harvested');

	for (let i = 0; i < years; i++) {
		const year = new Date().getFullYear() + i;

		// Determine which families are acceptable this year
		const resting = new Set<string>();
		for (const h of history) {
			if (!h.family) continue;
			const yearsSince = year - h.year;
			if (yearsSince < familyGap(h.family)) resting.add(h.family);
		}

		let chosenFamily: string | null = null;

		// Prefer families not yet used in this plan (rotate through them)
		const candidates = availableFamilies(history, year).filter(f => !resting.has(f));
		const usedInPlan = entries.map(e => e.family);

		// Try to avoid both resting and already-used families
		const free = candidates.filter(f => !usedInPlan.includes(f));
		const pool = free.length > 0 ? free : candidates;

		// Bias toward the last harvested family's successor
		if (harvested.length > 0) {
			const lastFamily = harvested[harvested.length - 1].family || null;
			const successors = getNextFamilySuggestions(lastFamily);
			const preferred = successors.find(s => pool.includes(s));
			if (preferred) chosenFamily = preferred;
		}

		if (!chosenFamily && pool.length > 0) {
			// Pick a family not equal to the previous entry's family if possible
			const prevFamily = entries.length > 0 ? entries[entries.length - 1].family : null;
			const nonPrev = pool.filter(f => f !== prevFamily);
			chosenFamily = (nonPrev[0] || pool[0]) as string;
		}

		if (!chosenFamily) {
			entries.push({ year, family: '—', plantNames: [], notes: 'No plants available' });
			continue;
		}

		const plantsForFamily = pickPlantForFamily(chosenFamily, []);
		const note =
			`${chosenFamily} — avoid replanting earlier than ${familyGap(chosenFamily)} year(s) after the previous ${chosenFamily}.`;

		entries.push({
			year,
			family: chosenFamily,
			plantNames: plantsForFamily.slice(0, 4),
			notes: note
		});
	}

	return { bedId, bedName, entries };
}
