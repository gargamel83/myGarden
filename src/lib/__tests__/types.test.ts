import { describe, it, expect } from 'vitest';
import {
	STATUS_LABELS, STATUS_COLORS, STATUS_BAR_COLORS,
	EXPOSURE_LABELS
} from '../types';

describe('STATUS_LABELS', () => {
	it('should have labels for all plant statuses', () => {
		expect(STATUS_LABELS).toEqual({
			planned: 'Planned',
			sown: 'Sown',
			planted: 'Transplanted',
			harvested: 'Harvested',
			cancelled: 'Cancelled'
		});
	});

	it('should have 5 status labels', () => {
		expect(Object.keys(STATUS_LABELS).length).toBe(5);
	});
});

describe('STATUS_COLORS', () => {
	it('should have Tailwind classes for all statuses', () => {
		for (const [status, color] of Object.entries(STATUS_COLORS)) {
			expect(color).toContain('bg-');
			expect(color).toContain('text-');
		}
	});

	it('should have 5 status color entries', () => {
		expect(Object.keys(STATUS_COLORS).length).toBe(5);
	});
});

describe('STATUS_BAR_COLORS', () => {
	it('should have valid hex colors for all statuses', () => {
		const hexRegex = /^#[0-9a-f]{6}$/;
		for (const color of Object.values(STATUS_BAR_COLORS)) {
			expect(color).toMatch(hexRegex);
		}
	});

	it('should have 5 status bar color entries', () => {
		expect(Object.keys(STATUS_BAR_COLORS).length).toBe(5);
	});
});

describe('EXPOSURE_LABELS', () => {
	it('should have labels for all sun exposures', () => {
		expect(EXPOSURE_LABELS).toEqual({
			plein_soleil: 'Full sun',
			mi_ombre: 'Partial shade',
			ombre: 'Shade'
		});
	});

	it('should have 3 exposure labels', () => {
		expect(Object.keys(EXPOSURE_LABELS).length).toBe(3);
	});
});
