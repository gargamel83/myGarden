import { json } from '@sveltejs/kit';
import { markRead } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) return json({ error: 'Invalid id' }, { status: 400 });
	markRead(id);
	return json({ success: true });
};
