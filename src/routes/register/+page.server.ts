import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { createUser, createSession, COOKIE_NAME } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	if (event.locals.user) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	register: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username') as string;
		const password = data.get('password') as string;
		const confirm = data.get('confirm') as string;

		if (!username || !password) {
			return fail(400, { error: 'Username and password required' });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Username must be at least 3 characters' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters' });
		}

		if (password !== confirm) {
			return fail(400, { error: 'Passwords do not match' });
		}

		try {
			const user = createUser(username, password);
			const token = createSession(user.id);
			cookies.set(COOKIE_NAME, token, {
				path: '/',
				httpOnly: true,
				sameSite: 'strict',
				maxAge: 60 * 60 * 24 * 365
			});
		} catch (e) {
			const msg = (e as Error).message;
			if (msg === 'Username already taken') {
				return fail(409, { error: 'Username already taken' });
			}
			return fail(500, { error: 'Registration failed' });
		}

		throw redirect(303, '/');
	}
};
