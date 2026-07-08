import type { Handle } from '@sveltejs/kit';
import { building } from '$app/environment';
import { logger } from '$lib/server/logger';
import { getSessionUser, COOKIE_NAME } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(COOKIE_NAME);
	const user = getSessionUser(token);

	if (!user && !event.url.pathname.startsWith('/login') && !event.url.pathname.startsWith('/register')) {
		return new Response(null, {
			status: 302,
			headers: { location: '/login' }
		});
	}

	event.locals.user = user;

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
