/**
 * Season planning helpers (client-safe).
 *
 * Turns a list of plantations + their plant reference data into the three
 * "what to do this month" lists: sowings, transplantings and harvests.
 * Periods are stored as `MM-DD` strings on the plant sheets, so comparisons
 * work on month numbers only (which also handles periods wrapping the year end).
 */

export type SeasonCategory = 'sowing' | 'transplanting' | 'harvest';

export interface SeasonPlantRef {
	id: number;
	commonName?: string | null;
	sowingStart?: string | null;
	sowingEnd?: string | null;
	plantingStart?: string | null;
	plantingEnd?: string | null;
	harvestStart?: string | null;
	harvestEnd?: string | null;
}

export interface SeasonPlantationRef {
	id: number;
	plantName: string;
	plantId?: number | null;
	status: string;
	gardenBedId?: number | null;
	bedName?: string | null;
	actualHarvestDate?: string | null;
}

export interface SeasonEntry {
	plantationId: number;
	plantName: string;
	bedName: string | null;
	status: string;
	category: SeasonCategory;
}

export interface SeasonPlan {
	sowing: SeasonEntry[];
	transplanting: SeasonEntry[];
	harvest: SeasonEntry[];
}

const SOWING_STATUSES = new Set(['planned', 'sown']);
const TRANSPLANTING_STATUSES = new Set(['planned', 'sown', 'planted']);

/** Parse a `MM-DD` (or `MM`) string into a month number, or null when invalid. */
export function parseMonthValue(raw: string | null | undefined): number | null {
	if (!raw) return null;
	const month = Number.parseInt(raw.slice(0, 2), 10);
	if (!Number.isInteger(month) || month < 1 || month > 12) return null;
	return month;
}

/** Parse a `YYYY-MM-DD` date into a month number, or null when invalid. */
export function parseDateMonth(raw: string | null | undefined): number | null {
	if (!raw || raw.length < 7) return null;
	const month = Number.parseInt(raw.slice(5, 7), 10);
	if (!Number.isInteger(month) || month < 1 || month > 12) return null;
	return month;
}

/**
 * Does `month` fall inside the period `start`..`end` (inclusive, `MM-DD` strings)?
 * Handles periods that wrap the year end (e.g. `11-01`..`02-28`).
 */
export function monthInRange(month: number, start?: string | null, end?: string | null): boolean {
	const startMonth = parseMonthValue(start);
	if (startMonth === null) return false;
	const endMonth = parseMonthValue(end);
	if (endMonth === null) return startMonth === month;
	if (startMonth <= endMonth) return month >= startMonth && month <= endMonth;
	return month >= startMonth || month <= endMonth;
}

/** Shift a (month, year) pair by `delta` months, normalising the year. */
export function shiftMonth(month: number, year: number, delta: number): { month: number; year: number } {
	const zeroBased = month - 1 + delta;
	const shiftedYear = year + Math.floor(zeroBased / 12);
	const shiftedMonth = ((zeroBased % 12) + 12) % 12;
	return { month: shiftedMonth + 1, year: shiftedYear };
}

/** Clamp any user input to a valid month (1-12), falling back to `fallback`. */
export function parseMonthParam(raw: string | null | undefined, fallback: number): number {
	const month = Number.parseInt(raw ?? '', 10);
	if (!Number.isInteger(month) || month < 1 || month > 12) return fallback;
	return month;
}

/** Clamp any user input to a plausible year, falling back to `fallback`. */
export function parseYearParam(raw: string | null | undefined, fallback: number): number {
	const year = Number.parseInt(raw ?? '', 10);
	if (!Number.isInteger(year) || year < 1970 || year > 2200) return fallback;
	return year;
}

export function buildSeasonPlan(
	plantations: SeasonPlantationRef[],
	plants: SeasonPlantRef[],
	month: number
): SeasonPlan {
	const plantsById = new Map(plants.map((plant) => [plant.id, plant]));
	const plan: SeasonPlan = { sowing: [], transplanting: [], harvest: [] };

	for (const plantation of plantations) {
		if (plantation.status === 'cancelled') continue;

		const plant = plantation.plantId != null ? plantsById.get(plantation.plantId) : undefined;
		const base = {
			plantationId: plantation.id,
			plantName: plantation.plantName,
			bedName: plantation.bedName ?? null,
			status: plantation.status
		};

		if (plant && SOWING_STATUSES.has(plantation.status) && monthInRange(month, plant.sowingStart, plant.sowingEnd)) {
			plan.sowing.push({ ...base, category: 'sowing' });
		}

		if (plant && TRANSPLANTING_STATUSES.has(plantation.status) && monthInRange(month, plant.plantingStart, plant.plantingEnd)) {
			plan.transplanting.push({ ...base, category: 'transplanting' });
		}

		const actualMonth = parseDateMonth(plantation.actualHarvestDate);
		const plannedHarvest = plant ? monthInRange(month, plant.harvestStart, plant.harvestEnd) : false;
		if (actualMonth === month || plannedHarvest) {
			plan.harvest.push({ ...base, category: 'harvest' });
		}
	}

	const byName = (a: SeasonEntry, b: SeasonEntry) =>
		a.plantName.localeCompare(b.plantName) || (a.bedName ?? '').localeCompare(b.bedName ?? '') || a.plantationId - b.plantationId;

	plan.sowing.sort(byName);
	plan.transplanting.sort(byName);
	plan.harvest.sort(byName);
	return plan;
}
