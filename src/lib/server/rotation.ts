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

// Familles et leurs temps de retour recommandé (années)
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

// Après une certaine famille, que planter ?
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

	// Trouver la famille de la dernière culture récoltée
	const lastHarvested = [...history].reverse().find(p => p.status === 'harvested');
	const lastFamily = lastHarvested?.family || null;

	// Familles à éviter
	const bannedFamilies = new Set<string>();
	const bannedPlants = new Set<number>();

	if (lastFamily) {
		bannedFamilies.add(lastFamily);
		// Ajouter les plantes de la même famille
		const sameFamily = db.select()
			.from(plants)
			.where(eq(plants.family, lastFamily))
			.all();
		sameFamily.forEach(p => bannedPlants.add(p.id));
	}

	// Si la même famille a été plantée 2 fois de suite, élargir l'interdiction
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

	// Récupérer toutes les plantes
	const allPlants = db.select().from(plants).all();

	const recommended = allPlants.filter(p =>
		!bannedFamilies.has(p.family || '') && !bannedPlants.has(p.id)
	);

	// Pour les non-recommandés, exclure les plantes déjà dans recommandé
	const notRecommended = allPlants.filter(p =>
		(bannedFamilies.has(p.family || '') || bannedPlants.has(p.id))
	);

	return { recommended, notRecommended, lastFamily, history };
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

		// Vérifier si la même famille a été plantée 2 fois de suite
		const families = harvested.filter(p => p.family).map(p => p.family);
		const lastFams = families.slice(-2);
		if (lastFams.length === 2 && lastFams[0] === lastFams[1] && lastFams[0]) {
			alerts.push({
				bedId: bed.id,
				bedName: bed.name,
				message: `⚠️ La bande a reçu 2 cultures consécutives de la famille ${lastFams[0]}. Risque d'épuisement du sol et de maladies.`,
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
				message: `Après ${last.plantName} (${lastFamily}), privilégiez des plantes des familles ${nextFamilies.join(', ')}.`,
				type: 'info',
				lastPlant: last.plantName,
				lastFamily: lastFamily,
				suggestedPlants: suggestedPlants.length > 0 ? suggestedPlants : undefined
			});
		}

		// Si plus de 2 ans avec la même famille dominante
		if (families.length >= 3) {
			const lastThree = families.slice(-3);
			const unique = new Set(lastThree);
			if (unique.size === 1 && [...unique][0]) {
				alerts.push({
					bedId: bed.id,
					bedName: bed.name,
					message: `🚫 La famille ${[...unique][0]} est cultivée depuis 3 cycles sur cette bande. Rotation urgente nécessaire !`,
					type: 'warning',
					lastPlant: last.plantName,
					lastFamily: last.family || undefined
				});
			}
		}
	}

	return alerts;
}
