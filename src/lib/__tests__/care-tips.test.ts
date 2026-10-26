import { describe, it, expect } from 'vitest';
import { parseCareTips, serializeCareTips, hasCareTips } from '$lib/care-tips';

describe('care-tips helpers', () => {
	it('parseCareTips is defensive', () => {
		expect(parseCareTips(null)).toEqual({});
		expect(parseCareTips(undefined)).toEqual({});
		expect(parseCareTips('')).toEqual({});
		expect(parseCareTips('bad json')).toEqual({});
		expect(parseCareTips('[]')).toEqual({});
		expect(parseCareTips('"hello"')).toEqual({});
		const parsed = parseCareTips(JSON.stringify({ watering: '  Arroser tôt  ', unknown: 'x', fertilizing: '' }));
		expect(parsed.watering).toBe('Arroser tôt');
		expect((parsed as any).unknown).toBeUndefined();
		expect(parsed.fertilizing).toBeUndefined();
	});

	it('serializeCareTips drops empty values', () => {
		const s = serializeCareTips({ watering: 'test', fertilizing: '   ' });
		const p = JSON.parse(s);
		expect(p.watering).toBe('test');
		expect(p.fertilizing).toBeUndefined();
		expect(serializeCareTips(null)).toBe('{}');
	});

	it('hasCareTips checks content', () => {
		expect(hasCareTips({})).toBe(false);
		expect(hasCareTips({ misc: '  ' })).toBe(false);
		expect(hasCareTips({ pruning: 'Tailler' })).toBe(true);
	});
});
