import { describe, it, expect } from 'vitest';
import { FAMILY_ROTATION_GAP, getNextFamilySuggestions } from '../rotation';

describe('FAMILY_ROTATION_GAP', () => {
	const families = Object.keys(FAMILY_ROTATION_GAP);

	it('should have all 10 families defined', () => {
		const expected = [
			'Solanaceae', 'Brassicaceae', 'Cucurbitaceae', 'Apiaceae',
			'Fabaceae', 'Amaryllidaceae', 'Asteraceae', 'Chenopodiaceae',
			'Poaceae', 'Lamiaceae'
		];
		expect(families.sort()).toEqual(expected.sort());
	});

	it('should have rotation gaps between 2 and 4 years', () => {
		for (const [family, gap] of Object.entries(FAMILY_ROTATION_GAP)) {
			expect(gap).toBeGreaterThanOrEqual(2);
			expect(gap).toBeLessThanOrEqual(4);
		}
	});

	it('Solanaceae and Cucurbitaceae need longest rotation (4 years)', () => {
		expect(FAMILY_ROTATION_GAP['Solanaceae']).toBe(4);
		expect(FAMILY_ROTATION_GAP['Cucurbitaceae']).toBe(4);
	});

	it('Fabaceae and Poaceae need shortest rotation (2 years)', () => {
		expect(FAMILY_ROTATION_GAP['Fabaceae']).toBe(2);
		expect(FAMILY_ROTATION_GAP['Poaceae']).toBe(2);
	});
});

describe('getNextFamilySuggestions', () => {
	const families = Object.keys(FAMILY_ROTATION_GAP);

	it('should return empty array for null', () => {
		expect(getNextFamilySuggestions(null)).toEqual([]);
	});

	it('should return empty array for unknown family', () => {
		expect(getNextFamilySuggestions('Unknown')).toEqual([]);
	});

	it('should never suggest the same family', () => {
		for (const f of families) {
			const suggestions = getNextFamilySuggestions(f);
			expect(suggestions).not.toContain(f);
		}
	});

	it('should only suggest valid families', () => {
		for (const f of families) {
			const suggestions = getNextFamilySuggestions(f);
			for (const s of suggestions) {
				expect(families).toContain(s);
			}
		}
	});

	it('should always include Fabaceae after heavy feeders', () => {
		const heavyFeeders = ['Solanaceae', 'Brassicaceae', 'Cucurbitaceae'];
		for (const f of heavyFeeders) {
			expect(getNextFamilySuggestions(f)).toContain('Fabaceae');
		}
	});

	it('should return 3-4 suggestions for each known family', () => {
		for (const f of families) {
			const suggestions = getNextFamilySuggestions(f);
			expect(suggestions.length).toBeGreaterThanOrEqual(3);
			expect(suggestions.length).toBeLessThanOrEqual(4);
		}
	});

	it('should have no duplicate suggestions', () => {
		for (const f of families) {
			const suggestions = getNextFamilySuggestions(f);
			const unique = new Set(suggestions);
			expect(unique.size).toBe(suggestions.length);
		}
	});

	it('should suggest Fabaceae after Solanaceae', () => {
		const suggestions = getNextFamilySuggestions('Solanaceae');
		expect(suggestions).toContain('Fabaceae');
		expect(suggestions).toContain('Apiaceae');
		expect(suggestions).toContain('Brassicaceae');
		expect(suggestions).toContain('Chenopodiaceae');
		expect(suggestions).not.toContain('Solanaceae');
		expect(suggestions).not.toContain('Cucurbitaceae');
	});

	it('should suggest Solanaceae and Cucurbitaceae after Fabaceae', () => {
		const suggestions = getNextFamilySuggestions('Fabaceae');
		expect(suggestions).toContain('Solanaceae');
		expect(suggestions).toContain('Cucurbitaceae');
		expect(suggestions).toContain('Brassicaceae');
		expect(suggestions).toContain('Chenopodiaceae');
	});
});
