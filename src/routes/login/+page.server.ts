import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types.js';

function hash(s: string): string {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h) + s.charCodeAt(i);
		h = h & h;
	}
	return h.toString(36);
}

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const password = data.get('password') as string;
		const expected = process.env.LOGIN_PASSWORD;

		if (!password || password !== expected) {
			return fail(401, { error: 'Mot de passe incorrect' });
		}

		const token = hash('monjardin-' + password);
		cookies.set('session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 365
		});

		throw redirect(303, '/');
	}
};
