import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildCalendar } from '$lib/server/ics';

export const GET: RequestHandler = ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const cal = buildCalendar(locals.user.id);
	return new Response(cal.content, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${cal.name}"`
		}
	});
};
