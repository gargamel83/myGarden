import { db } from '$lib/server/db';
import { plantations, gardenBeds, plants } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

function stripDate(value: string | null | undefined): string {
	if (!value) return '';
	const d = new Date(value);
	if (isNaN(d.getTime())) return '';
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}${m}${day}`;
}

function currentYearMD(mmdd: string | null | undefined): string {
	if (!mmdd || !/^\d{2}-\d{2}$/.test(mmdd)) return '';
	const numbers = mmdd.split('-').map(Number);
	const month = numbers[0];
	const day = numbers[1];
	const now = new Date();
	let year = now.getUTCFullYear();
	const tonightMD = (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
	const md = month * 100 + day;
	if (md < tonightMD) year += 1;
	return `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
}

function vevent(uid: string, dtstart: string, summary: string, description: string): string {
	const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
	return [
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${stamp}`,
		`DTSTART;VALUE=DATE:${dtstart}`,
		`SUMMARY:${summary}`,
		`DESCRIPTION:${description}`,
		'END:VEVENT'
	].join('\n');
}

function esc(value: string): string {
	return value.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, '\\n');
}

export function buildCalendar(userId: number): { name: string; content: string } {
	const rows = db.select({
		id: plantations.id,
		plantName: plantations.plantName,
		variety: plantations.variety,
		sowingDate: plantations.sowingDate,
		plantingDate: plantations.plantingDate,
		harvestDate: plantations.harvestDate,
		actualHarvestDate: plantations.actualHarvestDate,
		bedName: gardenBeds.name,
		plantSowingStart: plants.sowingStart,
		plantPlantingStart: plants.plantingStart,
		plantHarvestStart: plants.harvestStart
	})
		.from(plantations)
		.leftJoin(gardenBeds, eq(plantations.gardenBedId, gardenBeds.id))
		.leftJoin(plants, eq(plantations.plantId, plants.id))
		.where(eq(plantations.userId, userId))
		.all();

	const events: string[] = [];
	for (const p of rows) {
		const label = [p.plantName, p.variety].filter(Boolean).join(' — ');
		const bed = p.bedName ? ` (${p.bedName})` : '';
		const base = `monjardin-${p.id}`;

		const sowing = stripDate(p.sowingDate) || currentYearMD(p.plantSowingStart);
		if (sowing) {
			events.push(vevent(`${base}-sowing`, sowing, `Semis: ${label}`, `Semis${bed}`));
		}

		const planting = stripDate(p.plantingDate) || currentYearMD(p.plantPlantingStart);
		if (planting) {
			events.push(vevent(`${base}-planting`, planting, `Repiquage: ${label}`, `Repiquage${bed}`));
		}

		const harvest = stripDate(p.actualHarvestDate) || stripDate(p.harvestDate) || currentYearMD(p.plantHarvestStart);
		if (harvest) {
			events.push(vevent(`${base}-harvest`, harvest, `Récolte: ${label}`, `Récolte${bed}`));
		}
	}

	return {
		name: 'monjardin-rappels.ics',
		content:
			'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//MonJardin//Rappels//FR\nCALSCALE:GREGORIAN\n' +
			events.join('\n') +
			(events.length ? '\n' : '') +
			'END:VCALENDAR'
	};
}

// keep esc exported for consistency/testing of line folding
export { esc };
