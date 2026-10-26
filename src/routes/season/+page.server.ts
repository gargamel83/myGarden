import { db } from '$lib/server/db';
import { gardenBeds, gardenTasks, plantations, plants } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { buildSeasonPlan, parseMonthParam, parseYearParam } from '$lib/season';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async (event) => {
	event.depends('app:season');
	const userId = event.locals.user!.id;

	const now = new Date();
	const month = parseMonthParam(event.url.searchParams.get('month'), now.getMonth() + 1);
	const year = parseYearParam(event.url.searchParams.get('year'), now.getFullYear());

	const allPlantations = db
		.select({
			plantation: plantations,
			bedName: gardenBeds.name,
			plantName: plants.commonName
		})
		.from(plantations)
		.leftJoin(gardenBeds, eq(plantations.gardenBedId, gardenBeds.id))
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.where(eq(plantations.userId, userId))
		.all();

	const plantList = db.select().from(plants).all();
	const beds = db.select().from(gardenBeds).where(eq(gardenBeds.userId, userId)).all();
	const tasks = db
		.select()
		.from(gardenTasks)
		.where(and(eq(gardenTasks.userId, userId), eq(gardenTasks.month, month)))
		.all();

	const plantationsForPlan = allPlantations.map((row) => ({
		id: row.plantation.id,
		plantName: row.plantName || row.plantation.plantName,
		plantId: row.plantation.plantId,
		status: row.plantation.status,
		gardenBedId: row.plantation.gardenBedId,
		bedName: row.bedName,
		actualHarvestDate: row.plantation.actualHarvestDate
	}));

	const plan = buildSeasonPlan(plantationsForPlan, plantList, month);

	return {
		month,
		year,
		plan,
		tasks,
		beds
	};
};

export const actions: Actions = {
	addTask: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const title = (data.get('title') as string | null)?.trim();
		const bedId = data.get('gardenBedId') as string | null;
		const month = parseMonthParam(data.get('month') as string | null, new Date().getMonth() + 1);
		const year = parseYearParam(data.get('year') as string | null, new Date().getFullYear());

		if (!title) return fail(400, { error: 'titleRequired' });

		let gardenBedId: number | null = null;
		if (bedId && bedId !== '') {
			const bed = db.select().from(gardenBeds).where(eq(gardenBeds.id, Number(bedId))).get();
			if (!bed || bed.userId !== userId) return fail(403, { error: 'forbidden' });
			gardenBedId = bed.id;
		}

		db.insert(gardenTasks)
			.values({
				userId,
				gardenBedId,
				title,
				month,
				year,
				done: false,
				createdAt: new Date().toISOString()
			})
			.run();

		return { success: true };
	},

	toggleTask: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'invalidId' });

		const task = db.select().from(gardenTasks).where(eq(gardenTasks.id, id)).get();
		if (!task) return fail(404, { error: 'notFound' });
		if (task.userId !== userId) return fail(403, { error: 'forbidden' });

		db.update(gardenTasks).set({ done: !task.done }).where(eq(gardenTasks.id, id)).run();
		return { success: true };
	},

	deleteTask: async ({ request, locals }) => {
		const userId = locals.user!.id;
		const data = await request.formData();
		const id = Number(data.get('id'));
		if (!Number.isInteger(id)) return fail(400, { error: 'invalidId' });

		const task = db.select().from(gardenTasks).where(eq(gardenTasks.id, id)).get();
		if (!task) return fail(404, { error: 'notFound' });
		if (task.userId !== userId) return fail(403, { error: 'forbidden' });

		db.delete(gardenTasks).where(eq(gardenTasks.id, id)).run();
		return { success: true };
	}
};
