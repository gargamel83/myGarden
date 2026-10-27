import { describe, it, expect } from 'vitest';
import { summarizePlan, getBedPoints } from '$lib/plan-print';

describe('garden/print helpers integration', () => {
	it('summarizePlan handles mixed beds', () => {
		const beds = [
			{ id: 1, name: 'A', polygon: '[[0,0],[2,0],[2,2]]', type: 'pixel', zone: 'Z1', color: '#ff0000' },
			{ id: 2, name: 'B', polygon: '[[0,0]]', type: 'geo' }
		];
		const s = summarizePlan(beds as any);
		expect(s.pixelBeds.length).toBe(1);
		expect(s.geoBeds.length).toBe(1);
		expect(getBedPoints(s.pixelBeds[0]).length).toBe(3);
	});
});
