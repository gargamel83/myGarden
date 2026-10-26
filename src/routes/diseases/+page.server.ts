import { db } from '$lib/server/db';
import { diseases } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types.js';
import { parseJsonArray, type DiseaseItem } from '$lib/diseases';

export const load: PageServerLoad = async ({ depends }) => {
	depends('app:diseases');

	const rows = db.select().from(diseases).orderBy(asc(diseases.name)).all();
	const list: DiseaseItem[] = rows.map((d) => ({
		id: d.id,
		name: d.name,
		latinName: d.latinName,
		symptoms: d.symptoms,
		causes: d.causes,
		treatments: d.treatments,
		prevention: d.prevention,
		hostPlants: parseJsonArray(d.hostPlants),
		photos: parseJsonArray(d.photos)
	}));

	return { diseases: list };
};
