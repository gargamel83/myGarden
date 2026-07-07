import { describe, it, expect } from 'vitest';
import { firstPhoto, monthsInRange, serializeCommaSeparated } from '../utils';

describe('firstPhoto', () => {
	it('returns first URL from valid JSON array', () => {
		expect(firstPhoto('["https://example.com/1.jpg","https://example.com/2.jpg"]')).toBe('https://example.com/1.jpg');
	});

	it('returns null for empty array', () => {
		expect(firstPhoto('[]')).toBeNull();
	});

	it('returns null for null input', () => {
		expect(firstPhoto(null)).toBeNull();
	});

	it('returns null for invalid JSON', () => {
		expect(firstPhoto('not-json')).toBeNull();
	});

	it('returns null for non-array JSON', () => {
		expect(firstPhoto('"string"')).toBeNull();
	});

	it('returns the only element for single-element array', () => {
		expect(firstPhoto('["only.jpg"]')).toBe('only.jpg');
	});
});

describe('monthsInRange', () => {
	it('returns all false for null start', () => {
		const result = monthsInRange(null, '06-15');
		expect(result).toHaveLength(12);
		expect(result.every(v => v === false)).toBe(true);
	});

	it('returns all false for null end', () => {
		const result = monthsInRange('03-15', null);
		expect(result).toHaveLength(12);
		expect(result.every(v => v === false)).toBe(true);
	});

	it('handles normal range (March to June)', () => {
		const result = monthsInRange('03-15', '06-15');
		expect(result).toEqual([false, false, true, true, true, true, false, false, false, false, false, false]);
	});

	it('handles year-wrapping range (October to March)', () => {
		const result = monthsInRange('10-01', '03-15');
		expect(result).toEqual([true, true, true, false, false, false, false, false, false, true, true, true]);
	});

	it('handles single month range', () => {
		const result = monthsInRange('05-01', '05-31');
		expect(result[4]).toBe(true);
		expect(result.filter(v => v)).toHaveLength(1);
	});

	it('handles full year range', () => {
		const result = monthsInRange('01-01', '12-31');
		expect(result.every(v => v === true)).toBe(true);
	});
});

describe('serializeCommaSeparated', () => {
	it('serializes simple comma-separated values', () => {
		expect(serializeCommaSeparated('Basilic, Carotte, Persil')).toBe('["Basilic","Carotte","Persil"]');
	});

	it('handles empty string', () => {
		expect(serializeCommaSeparated('')).toBe('[]');
	});

	it('trims whitespace around values', () => {
		expect(serializeCommaSeparated('  a  , b ,c  ')).toBe('["a","b","c"]');
	});

	it('filters out empty entries', () => {
		expect(serializeCommaSeparated('a,,b,')).toBe('["a","b"]');
	});

	it('handles single value', () => {
		expect(serializeCommaSeparated('Tomate')).toBe('["Tomate"]');
	});

	it('handles values with special characters', () => {
		expect(serializeCommaSeparated('Pomme de terre, Poireau')).toBe('["Pomme de terre","Poireau"]');
	});
});
