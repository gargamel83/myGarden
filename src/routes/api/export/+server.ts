import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exportUserData } from '$lib/server/transfer';

export const GET: RequestHandler = ({ locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');
	const data = exportUserData(locals.user.id);
	const filename = `monjardin-${locals.user.username}-${data.exportedAt.slice(0, 10)}.json`;
	return new Response(JSON.stringify(data, null, 2), {
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
