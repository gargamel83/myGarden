import { db } from '$lib/server/db';
import { plants } from '$lib/server/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types.js';

export const load: PageServerLoad = async ({ url, depends }) => {
	depends('app:plants');
	const search = url.searchParams.get('q') || '';
	const family = url.searchParams.get('family') || '';
	const exposure = url.searchParams.get('exposure') || '';

	const conditions = [];

	if (search) {
		conditions.push(
			or(
				like(plants.commonName, `%${search}%`),
				like(plants.latinName, `%${search}%`)
			)
		);
	}
	if (family) {
		conditions.push(eq(plants.family, family));
	}
	if (exposure) {
		conditions.push(eq(plants.sunExposure, exposure));
	}

	const query = db.select().from(plants);
	const all = conditions.length > 0
		? query.where(and(...conditions)).orderBy(plants.commonName).all()
		: query.orderBy(plants.commonName).all();

	const plantsWithPhotos = all.map(p => ({
		...p,
		firstPhoto: (() => { try { const arr = JSON.parse(p.photos || '[]'); return Array.isArray(arr) && arr.length > 0 ? arr[0] : null; } catch { return null; } })()
	}));

	const families = db.select({ family: plants.family })
		.from(plants)
		.groupBy(plants.family)
		.orderBy(plants.family)
		.all()
		.map(r => r.family);

	return { plants: plantsWithPhotos, families, search, selectedFamily: family, selectedExposure: exposure };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const commonName = data.get('commonName') as string;
		if (!commonName) return fail(400, { error: 'Name required' });

		db.insert(plants).values({
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
			antagonists: (data.get('antagonists') as string) || null
		}).run();

		return { success: true };
	}
};
