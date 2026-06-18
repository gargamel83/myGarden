import { json } from '@sveltejs/kit';
import { markAllRead } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	markAllRead();
	return json({ success: true });
};
