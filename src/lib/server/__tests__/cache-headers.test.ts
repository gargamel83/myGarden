import { describe, it, expect, vi } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));
vi.mock('$lib/server/logger', () => ({
	logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), trace: vi.fn(), debug: vi.fn() }
}));
vi.mock('$lib/server/auth', () => ({
	getSessionUser: () => ({ id: 1, username: 'test' }),
	COOKIE_NAME: 'session'
}));

describe('cache headers', () => {
	it('should set Cache-Control on /uploads/ responses', async () => {
		const { handle } = await import('../../../hooks.server');
		const event = {
			url: { pathname: '/uploads/garden.webp', searchParams: new URLSearchParams() },
			request: { method: 'GET' },
			cookies: { get: () => '' },
			locals: {}
		} as any;
		const resolve = vi.fn().mockResolvedValue(new Response('ok', {
			headers: new Headers()
		}));
		const response = await handle({ event, resolve });
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
	});

	it('should not set Cache-Control on non-upload paths', async () => {
		const { handle } = await import('../../../hooks.server');
		const event = {
			url: { pathname: '/plants', searchParams: new URLSearchParams() },
			request: { method: 'GET' },
			cookies: { get: () => '' },
			locals: {}
		} as any;
		const resolve = vi.fn().mockResolvedValue(new Response('ok', {
			headers: new Headers()
		}));
		const response = await handle({ event, resolve });
		expect(response.headers.get('Cache-Control')).toBeNull();
	});
});
