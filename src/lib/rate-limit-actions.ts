import { getRateLimitInfo } from '$lib/rate-limit';
import { fail } from '@sveltejs/kit';

export function loginRateLimit(ip: string, event: any) {
	const { allowed, remaining, resetAt } = getRateLimitInfo(ip, 'login');
	if (!allowed) {
		return fail(429, {
			error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.',
			resetAt
		});
	}
	return { allowed, remaining, resetAt };
}

export function registerRateLimit(ip: string, event: any) {
	const { allowed, remaining, resetAt } = getRateLimitInfo(ip, 'register');
	if (!allowed) {
		return fail(429, {
			error: 'Trop d\'inscriptions. Réessayez dans quelques minutes.',
			resetAt
		});
	}
	return { allowed, remaining, resetAt };
}
