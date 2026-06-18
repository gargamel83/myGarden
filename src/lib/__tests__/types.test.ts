import { describe, it, expect } from 'vitest';
import {
	STATUS_LABELS, STATUS_COLORS, STATUS_BAR_COLORS,
	EXPOSURE_LABELS
} from '../types';

describe('STATUS_LABELS', () => {
	it('should have labels for all statuses', () => {
		const labels = STATUS_LABELS;
		expect(labels.planned).toBe('Planned');
		expect(labels.sown).toBe('Sown');
		expect(labels.planted).toBe('Transplanted');
		expect(labels.harvested).toBe('Harvested');
		expect(labels.cancelled).toBe('Cancelled');
	});
});

describe('STATUS_COLORS', () => {
	it('should have Tailwind classes for all statuses', () => {
		const colors = STATUS_COLORS;
		expect(colors.planned).toContain('bg-gray');
		expect(colors.sown).toContain('bg-blue');
		expect(colors.planted).toContain('bg-green');
		expect(colors.harvested).toContain('bg-amber');
		expect(colors.cancelled).toContain('bg-red');
	});
});

describe('STATUS_BAR_COLORS', () => {
	it('should have valid hex colors for all statuses', () => {
		const hexRegex = /^#[0-9a-f]{6}$/;
		for (const color of Object.values(STATUS_BAR_COLORS)) {
			expect(color).toMatch(hexRegex);
		}
	});
});

describe('EXPOSURE_LABELS', () => {
	it('should have labels for all exposures', () => {
		expect(EXPOSURE_LABELS.plein_soleil).toBe('Full sun');
		expect(EXPOSURE_LABELS.mi_ombre).toBe('Partial shade');
		expect(EXPOSURE_LABELS.ombre).toBe('Shade');
	});
});
