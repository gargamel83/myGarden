import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({ building: false }));

const mockLogger = vi.hoisted(() => ({ info: vi.fn() }));
vi.mock('$lib/server/logger', () => ({ logger: mockLogger }));

const mockAuth = vi.hoisted(() => ({
	getSessionUser: vi.fn(),
	COOKIE_NAME: 'session'
}));
vi.mock('$lib/server/auth', () => mockAuth);

function makeEvent(pathname: string, token?: string) {
	return {
		cookies: { get: vi.fn(() => token) },
		url: { pathname },
		request: { method: 'GET' },
		locals: {} as Record<string, unknown>
	};
}

function makeResolve() {
	return vi.fn().mockResolvedValue(new Response('ok', { headers: new Headers() }));
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('hooks.server handle', () => {
	it('redirects to /login when unauthenticated', async () => {
		mockAuth.getSessionUser.mockReturnValue(null);
		const event = makeEvent('/dashboard');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		const response = await handle({ event, resolve } as any);
		expect(response.status).toBe(302);
		expect(response.headers.get('location')).toBe('/login');
	});

	it('allows /login path when unauthenticated', async () => {
		mockAuth.getSessionUser.mockReturnValue(null);
		const event = makeEvent('/login');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		const response = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalled();
		expect(response.status).toBe(200);
	});

	it('allows /register path when unauthenticated', async () => {
		mockAuth.getSessionUser.mockReturnValue(null);
		const event = makeEvent('/register');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		const response = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalled();
		expect(response.status).toBe(200);
	});

	it('allows authenticated user on any path', async () => {
		mockAuth.getSessionUser.mockReturnValue({ id: 1, username: 'test' });
		const event = makeEvent('/dashboard');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		const response = await handle({ event, resolve } as any);
		expect(resolve).toHaveBeenCalled();
		expect(response.status).toBe(200);
	});

	it('sets event.locals.user when authenticated', async () => {
		const user = { id: 1, username: 'test' };
		mockAuth.getSessionUser.mockReturnValue(user);
		const event = makeEvent('/dashboard');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		await handle({ event, resolve } as any);
		expect(event.locals.user).toBe(user);
	});

	it('sets event.locals.user to null when not authenticated', async () => {
		mockAuth.getSessionUser.mockReturnValue(null);
		const event = makeEvent('/login');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		await handle({ event, resolve } as any);
		expect(event.locals.user).toBeNull();
	});

	it('sets Cache-Control for uploads', async () => {
		mockAuth.getSessionUser.mockReturnValue({ id: 1, username: 'test' });
		const event = makeEvent('/uploads/garden.webp');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		const response = await handle({ event, resolve } as any);
		expect(response.headers.get('Cache-Control')).toBe('public, max-age=86400, immutable');
	});

	it('does not log /login path', async () => {
		mockAuth.getSessionUser.mockReturnValue({ id: 1, username: 'test' });
		const event = makeEvent('/login');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		await handle({ event, resolve } as any);
		expect(mockLogger.info).not.toHaveBeenCalled();
	});

	it('logs other paths', async () => {
		mockAuth.getSessionUser.mockReturnValue({ id: 1, username: 'test' });
		const event = makeEvent('/dashboard');
		const resolve = makeResolve();
		const { handle } = await import('../../hooks.server');
		await handle({ event, resolve } as any);
		expect(mockLogger.info).toHaveBeenCalledWith(
			expect.stringMatching(/^GET \/dashboard 200 \d+ms$/)
		);
	});
});
