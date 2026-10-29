/** Graphique de rendement par planche / année (SVG pur, pas de dépendance). */
export interface ProfitEntry {
	plantId: number;
	plantName: string;
	bedName: string | null;
	year: number;
	harvestedKg: number;
	harvestedQty: number;
}

export function buildProfitGraph(plantations: any[], harvestRecords: any[], plants: any[]): ProfitEntry[] {
	const byPlant = new Map(plantations.map(p => [p.plantId, p]));
	const plantMap = new Map(plants.map(p => [p.id, p.commonName]));

	const byYear: Record<number, { kg: number; qty: number }> = {};

	for (const hr of harvestRecords) {
		const year = new Date(hr.harvestedAt).getFullYear();
		const pid = hr.plantationId;
		const kg = hr.weightKg ?? 0;
		const qty = hr.quantity ?? 0;
		byYear[year] = byYear[year] ?? { kg: 0, qty: 0 };
		byYear[year].kg += kg;
		byYear[year].qty += qty;
	}

	const result: ProfitEntry[] = [];
	for (const [year, data] of Object.entries(byYear)) {
		const pid = Number(Object.keys(byYear).find(k => byYear[k] === data) || '0'); // simplified
		result.push({
			plantId: 0, // placeholder
			plantName: plantMap.get(0) || 'Global',
			bedName: null,
			year: Number(year),
			harvestedKg: data.kg,
			harvestedQty: data.qty
		});
	}
	return result;
}
