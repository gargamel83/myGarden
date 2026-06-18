import { json } from '@sveltejs/kit';
import { generateNotifications, getNotifications } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	await generateNotifications();
	const result = getNotifications();
	return json(result);
};
