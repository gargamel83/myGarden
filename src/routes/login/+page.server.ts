import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { logger } from '$lib/server/logger';
import { authenticateUser, createSession, COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username and password required' });
		}

		const user = authenticateUser(username, password);
		if (!user) {
			logger.warn('Login failed for', username);
			return fail(401, { error: 'Invalid username or password' });
		}

		const token = createSession(user.id);
		cookies.set(COOKIE_NAME, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 365
		});

		logger.info('Login successful:', username);
		throw redirect(303, '/');
	}
};
