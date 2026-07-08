import { json } from '@sveltejs/kit';
import { generateNotifications, getNotifications } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const userId = locals.user!.id;
	await generateNotifications(userId);
	const result = getNotifications(userId);
	return json(result);
};
