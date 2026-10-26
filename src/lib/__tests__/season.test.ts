import { describe, it, expect } from 'vitest';
import { buildSeasonPlan, monthInRange, parseMonthValue, shiftMonth } from '$lib/season';

describe('season helpers', () => {
	it('monthInRange handles normal and wrapping periods', () => {
		expect(monthInRange(4, '03-15', '05-10')).toBe(true);
		expect(monthInRange(6, '03-15', '05-10')).toBe(false);
		expect(monthInRange(12, '11-01', '02-28')).toBe(true);
		expect(monthInRange(1, '11-01', '02-28')).toBe(true);
		expect(monthInRange(6, '11-01', '02-28')).toBe(false);
		expect(monthInRange(3, '03-01')).toBe(true);
	});

	it('parseMonthValue parses MM-DD', () => {
		expect(parseMonthValue('03-15')).toBe(3);
		expect(parseMonthValue(null)).toBeNull();
		expect(parseMonthValue('13-01')).toBeNull();
	});

	it('shiftMonth normalizes years', () => {
		expect(shiftMonth(1, 2026, -1)).toEqual({ month: 12, year: 2025 });
		expect(shiftMonth(12, 2026, 1)).toEqual({ month: 1, year: 2027 });
	});

	it('buildSeasonPlan buckets by month and deduplicates by actual harvest', () => {
		const plantations = [
			{ id: 1, plantName: 'Tomate', plantId: 10, status: 'planned', gardenBedId: 1, bedName: 'A1', actualHarvestDate: null },
			{ id: 2, plantName: 'Radis', plantId: 11, status: 'harvested', gardenBedId: 1, bedName: 'A1', actualHarvestDate: '2026-04-15' }
		];
		const plants = [
			{ id: 10, commonName: 'Tomate', sowingStart: '03-15', sowingEnd: '04-30', plantingStart: '05-15', plantingEnd: '06-01', harvestStart: '07-01', harvestEnd: '09-01' },
			{ id: 11, commonName: 'Radis', sowingStart: '03-01', sowingEnd: '04-01', plantingStart: null, plantingEnd: null, harvestStart: '04-15', harvestEnd: '05-01' }
		];
		const plan = buildSeasonPlan(plantations, plants, 4);
		expect(plan.sowing.length).toBe(1);
		expect(plan.sowing[0].plantName).toBe('Tomate');
		expect(plan.harvest.length).toBe(1);
		expect(plan.harvest[0].plantName).toBe('Radis');
	});
});
