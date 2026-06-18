import { describe, it, expect } from 'vitest';
import { computeStatus } from '../../routes/plantations/+page.server';

describe('computeStatus', () => {
	it('should return planned when no dates', () => {
		expect(computeStatus(null, null, null)).toBe('planned');
	});

	it('should return sown when only sowing date', () => {
		expect(computeStatus('2026-03-15', null, null)).toBe('sown');
	});

	it('should return planted when only planting date', () => {
		expect(computeStatus(null, '2026-05-01', null)).toBe('planted');
	});

	it('should return planted when both sowing and planting dates', () => {
		expect(computeStatus('2026-03-15', '2026-05-01', null)).toBe('planted');
	});

	it('should return harvested when harvest date set', () => {
		expect(computeStatus('2026-03-15', '2026-05-01', '2026-07-20')).toBe('harvested');
	});

	it('should return harvested even without other dates', () => {
		expect(computeStatus(null, null, '2026-07-20')).toBe('harvested');
	});

	it('should handle empty strings', () => {
		expect(computeStatus('', '', '')).toBe('planned');
	});

	it('should handle empty strings mixed with null', () => {
		expect(computeStatus('', null, null)).toBe('sown');
	});
});
