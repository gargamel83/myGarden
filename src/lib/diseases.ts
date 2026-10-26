// Shared disease-library helpers — client-safe (no $lib/server import).

export interface DiseaseItem {
	id: number;
	name: string;
	latinName: string | null;
	symptoms: string | null;
	causes: string | null;
	treatments: string | null;
	prevention: string | null;
	hostPlants: string[];
	photos: string[];
}

export function parseJsonArray(value: string | null): string[] {
	try {
		const parsed = JSON.parse(value || '[]');
		return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
	} catch {
		return [];
	}
}

export function allHostPlants(list: DiseaseItem[]): string[] {
	const names = new Set<string>();
	for (const disease of list) {
		for (const plant of disease.hostPlants) names.add(plant);
	}
	return [...names].sort((a, b) => a.localeCompare(b));
}

export function filterDiseases(list: DiseaseItem[], search: string, hostPlant = ''): DiseaseItem[] {
	const q = search.trim().toLowerCase();
	return list.filter((disease) => {
		if (hostPlant && !disease.hostPlants.includes(hostPlant)) return false;
		if (!q) return true;
		const haystack = [
			disease.name,
			disease.latinName,
			disease.symptoms,
			disease.causes,
			disease.hostPlants.join(' ')
		]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();
		return haystack.includes(q);
	});
}
