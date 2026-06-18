import { describe, it, expect } from 'vitest';
import { FAMILY_ROTATION_GAP, getNextFamilySuggestions } from '../rotation';

describe('FAMILY_ROTATION_GAP', () => {
	it('should have all families defined', () => {
		const families = [
			'Solanaceae', 'Brassicaceae', 'Cucurbitaceae', 'Apiaceae',
			'Fabaceae', 'Amaryllidaceae', 'Asteraceae', 'Chenopodiaceae',
			'Poaceae', 'Lamiaceae'
		];
		for (const f of families) {
			expect(FAMILY_ROTATION_GAP[f]).toBeGreaterThanOrEqual(2);
		}
	});

	it('should have Solanaceae at 4 years', () => {
		expect(FAMILY_ROTATION_GAP['Solanaceae']).toBe(4);
	});

	it('should have Fabaceae at 2 years', () => {
		expect(FAMILY_ROTATION_GAP['Fabaceae']).toBe(2);
	});
});

describe('getNextFamilySuggestions', () => {
	it('should return empty array for null', () => {
		expect(getNextFamilySuggestions(null)).toEqual([]);
	});

	it('should return empty array for unknown family', () => {
		expect(getNextFamilySuggestions('Unknown')).toEqual([]);
	});

	it('should suggest Fabaceae after Solanaceae', () => {
		const suggestions = getNextFamilySuggestions('Solanaceae');
		expect(suggestions).toContain('Fabaceae');
		expect(suggestions).toContain('Apiaceae');
	});

	it('should suggest appropriate families after Fabaceae', () => {
		const suggestions = getNextFamilySuggestions('Fabaceae');
		expect(suggestions).toContain('Solanaceae');
		expect(suggestions).toContain('Cucurbitaceae');
		expect(suggestions).not.toContain('Fabaceae');
	});

	it('should return 3-4 suggestions per family', () => {
		const families = Object.keys(FAMILY_ROTATION_GAP);
		for (const f of families) {
			const suggestions = getNextFamilySuggestions(f);
			expect(suggestions.length).toBeGreaterThanOrEqual(3);
			expect(suggestions.length).toBeLessThanOrEqual(4);
		}
	});
});
