import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { logger } from '$lib/server/logger';

const PASSWORD = building ? '' : process.env.LOGIN_PASSWORD;

function hash(s: string): string {
	let h = 0;
	for (let i = 0; i < s.length; i++) {
		h = ((h << 5) - h) + s.charCodeAt(i);
		h = h & h;
	}
	return h.toString(36);
}

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');
	const expected = PASSWORD ? hash('monjardin-' + PASSWORD) : '';

	if (expected && token !== expected && !event.url.pathname.startsWith('/login')) {
		return new Response(null, {
			status: 302,
			headers: { location: '/login' }
		});
	}

	const { pathname } = event.url;
	const method = event.request.method;
	const start = Date.now();
	const response = await resolve(event);
	const ms = Date.now() - start;

	if (pathname !== '/login') {
		logger.info(`${method} ${pathname} ${response.status} ${ms}ms`);
	}

	if (pathname.startsWith('/uploads/')) {
		response.headers.set('Cache-Control', 'public, max-age=86400, immutable');
	}

	return response;
};
