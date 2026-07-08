import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { notifications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { markRead } from '$lib/server/notifications';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ params, locals }) => {
	const id = parseInt(params.id);
	if (isNaN(id)) return json({ error: 'Invalid id' }, { status: 400 });

	const n = db.select({ userId: notifications.userId }).from(notifications).where(eq(notifications.id, id)).get();
	if (!n || n.userId !== locals.user!.id) {
		return json({ error: 'Not found' }, { status: 404 });
	}

	markRead(id);
	return json({ success: true });
};
