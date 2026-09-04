import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseWeather } from '$lib/weather';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const lat = parseFloat(url.searchParams.get('lat') || '');
	const lng = parseFloat(url.searchParams.get('lng') || '');
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
		return json({ error: 'Missing or invalid lat/lng' }, { status: 400 });
	}
	const api =
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
		`&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&forecast_days=5&timezone=auto`;
	try {
		const res = await fetch(api, { signal: AbortSignal.timeout(6000) });
		if (!res.ok) throw new Error('Weather service error');
		return json(parseWeather(await res.json()));
	} catch {
		return json({ error: 'Failed to fetch weather' }, { status: 502 });
	}
};
