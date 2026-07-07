export function firstPhoto(photos: string | null): string | null {
	try {
		const a = JSON.parse(photos || '[]');
		return Array.isArray(a) && a.length > 0 ? a[0] : null;
	} catch { return null; }
}

export function monthsInRange(start: string | null, end: string | null): boolean[] {
	const monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
	if (!start || !end) return monthLabels.map(() => false);
	const s = parseInt(start.split('-')[0], 10);
	const e = parseInt(end.split('-')[0], 10);
	return monthLabels.map((_, m) => {
		const month = m + 1;
		if (e >= s) return month >= s && month <= e;
		return month >= s || month <= e;
	});
}

export function serializeCommaSeparated(value: string): string {
	return JSON.stringify(value.split(',').map(s => s.trim()).filter(Boolean));
}
