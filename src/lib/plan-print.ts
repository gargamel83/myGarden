/**
 * Garden plan print helpers (client-safe).
 * Computes bounds/geometry for SVG rendering of pixel beds.
 */

export interface PrintPoint {
	x: number;
	y: number;
}

export interface PrintBed {
	id: number;
	name: string;
	polygon: string | null;
	color?: string | null;
	zone?: string | null;
	type?: string | null;
	soilType?: string | null;
	sunExposure?: string | null;
	length?: number | null;
	width?: number | null;
}

export interface PrintBounds {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
}

export interface PrintViewBox {
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface PlanPrintSummary {
	pixelBeds: PrintBed[];
	geoBeds: PrintBed[];
	allPoints: PrintPoint[];
	bounds: PrintBounds | null;
	viewBox: PrintViewBox | null;
}

function parsePolygon(raw: string | null | undefined): PrintPoint[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		const points: PrintPoint[] = [];
		for (const p of parsed) {
			if (Array.isArray(p) && p.length >= 2) {
				const x = Number(p[0]);
				const y = Number(p[1]);
				if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
			} else if (p && typeof p === 'object') {
				const x = Number((p as any).x ?? (p as any)[0]);
				const y = Number((p as any).y ?? (p as any)[1]);
				if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y });
			}
		}
		return points;
	} catch {
		return [];
	}
}

export function getBedPoints(bed: PrintBed): PrintPoint[] {
	return parsePolygon(bed.polygon);
}

export function computeBounds(points: PrintPoint[]): PrintBounds | null {
	if (points.length === 0) return null;
	let minX = points[0].x;
	let maxX = points[0].x;
	let minY = points[0].y;
	let maxY = points[0].y;
	for (let i = 1; i < points.length; i++) {
		const p = points[i];
		if (p.x < minX) minX = p.x;
		if (p.x > maxX) maxX = p.x;
		if (p.y < minY) minY = p.y;
		if (p.y > maxY) maxY = p.y;
	}
	if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) {
		return null;
	}
	return { minX, minY, maxX, maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

export function pointsToPath(points: PrintPoint[]): string {
	if (points.length === 0) return '';
	const segments = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
	return segments.join(' ') + ' Z';
}

export function computeViewBox(bounds: PrintBounds | null, padding = 24): PrintViewBox | null {
	if (!bounds) return null;
	const pad = Math.max(0, padding);
	return {
		x: bounds.minX - pad,
		y: bounds.minY - pad,
		width: bounds.width + pad * 2,
		height: bounds.height + pad * 2
	};
}

export function centerLabel(points: PrintPoint[]): PrintPoint | null {
	if (points.length === 0) return null;
	let sumX = 0;
	let sumY = 0;
	for (const p of points) {
		sumX += p.x;
		sumY += p.y;
	}
	return { x: sumX / points.length, y: sumY / points.length };
}

export function summarizePlan(beds: PrintBed[]): PlanPrintSummary {
	const pixelBeds: PrintBed[] = [];
	const geoBeds: PrintBed[] = [];
	const allPoints: PrintPoint[] = [];

	for (const bed of beds) {
		if (bed.type === 'geo') {
			geoBeds.push(bed);
			continue;
		}
		pixelBeds.push(bed);
		allPoints.push(...getBedPoints(bed));
	}

	const bounds = computeBounds(allPoints);
	return {
		pixelBeds,
		geoBeds,
		allPoints,
		bounds,
		viewBox: computeViewBox(bounds)
	};
}

export function polygonArea(points: PrintPoint[]): number {
	if (points.length < 3) return 0;
	let area = 0;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const p1 = points[i];
		const p2 = points[j];
		area += p1.x * p2.y;
		area -= p2.x * p1.y;
	}
	return Math.abs(area) / 2;
}
