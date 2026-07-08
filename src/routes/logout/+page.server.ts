import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';
import { deleteSession, COOKIE_NAME } from '$lib/server/auth';

export const actions: Actions = {
	default: async ({ cookies, locals }) => {
		const token = cookies.get(COOKIE_NAME);
		if (token) {
			deleteSession(token);
		}
		cookies.delete(COOKIE_NAME, { path: '/' });
		locals.user = null;
		throw redirect(303, '/login');
	}
};
