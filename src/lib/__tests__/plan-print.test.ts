import { describe, it, expect } from 'vitest';
import { getBedPoints, computeBounds, pointsToPath, computeViewBox, summarizePlan, centerLabel, polygonArea } from '$lib/plan-print';

describe('plan-print helpers', () => {
	it('parses polygons defensively', () => {
		expect(getBedPoints({ id: 1, name: 'A', polygon: null })).toEqual([]);
		expect(getBedPoints({ id: 2, name: 'B', polygon: 'not json' })).toEqual([]);
		expect(getBedPoints({ id: 3, name: 'C', polygon: '[[0,0],[10,0],[10,5],[0,5]]' }).length).toBe(4);
	});

	it('computes bounds, viewBox and path', () => {
		const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 5 }, { x: 0, y: 5 }];
		const bounds = computeBounds(points);
		expect(bounds?.width).toBe(10);
		expect(bounds?.height).toBe(5);
		const vb = computeViewBox(bounds, 2);
		expect(vb?.x).toBe(-2);
		expect(pointsToPath(points).startsWith('M')).toBe(true);
		const label = centerLabel(points);
		expect(label?.x).toBe(5);
		expect(label?.y).toBe(2.5);
		expect(polygonArea(points)).toBe(50);
	});

	it('summarizes plan separates pixel and geo beds', () => {
		const beds = [
			{ id: 1, name: 'Pixel', polygon: '[[0,0],[4,0],[4,4]]', type: 'pixel' },
			{ id: 2, name: 'Geo', polygon: '[[1,1],[2,2]]', type: 'geo' }
		];
		const summary = summarizePlan(beds as any);
		expect(summary.pixelBeds.length).toBe(1);
		expect(summary.geoBeds.length).toBe(1);
		expect(summary.viewBox).not.toBeNull();
	});
});
