import { describe, it, expect } from 'vitest';

describe('+layout.server load', () => {
	it('should return user from event.locals', async () => {
		const user = { id: 1, username: 'test' };
		const event = { locals: { user } };
		const { load } = await import('../../routes/+layout.server');
		const result = await load(event as any);
		expect(result).toEqual({ user });
	});

	it('should return null user when not authenticated', async () => {
		const event = { locals: { user: null } };
		const { load } = await import('../../routes/+layout.server');
		const result = await load(event as any);
		expect(result).toEqual({ user: null });
	});
});
