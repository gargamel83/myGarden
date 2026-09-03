import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importUserData, type ExportData } from '$lib/server/transfer';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) throw error(401, 'Unauthorized');

	let body: ExportData;
	try {
		body = JSON.parse(await request.text());
	} catch {
		throw error(400, { message: 'Invalid JSON' });
	}

	if (body.version !== 1 || !Array.isArray(body.gardenBeds)) {
		throw error(400, { message: 'Invalid export format' });
	}

	try {
		const counts = importUserData(locals.user.id, body);
		return json({ success: true, ...counts });
	} catch (e) {
		console.error('Import failed:', e);
		throw error(500, { message: 'Import failed: invalid data' });
	}
};
