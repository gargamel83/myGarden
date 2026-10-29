/** Simple in-memory rate limiter (mono-instance, dev friendly).
 *  Not a replacement for a proper reverse-proxy / Redis setup, but sufficient
 *  for the app's current scope and avoids adding a DB table / migration.
 */
const LIMITS = {
	login: 20,    // 20 attempts per 5 min per IP
	register: 10, // 10 attempts per 5 min per IP
	window: 5 * 60 * 1000, // 5 minutes
};

const attempts = new Map<string, Map<string, number[]>>(); // ip -> action -> timestamps

export function checkRateLimit(ip: string, action: 'login' | 'register'): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const key = attempts.get(ip) ?? new Map();
	const timestamps = key.get(action) ?? [];

	// Remove timestamps outside the window
	const valid = timestamps.filter((t: number) => now - t < LIMITS.window);
	const current = valid.length;

	const allowed = current < LIMITS[action];
	const newRemaining = LIMITS[action] - current - (allowed ? 0 : 0);
	const resetAt = now + LIMITS.window;

	// Store valid timestamps
	if (allowed) valid.push(now);
	key.set(action, valid);
	attempts.set(ip, key);

	return { allowed, remaining: Math.max(0, LIMITS[action] - current), resetAt };
}

export function getRateLimitInfo(ip: string, action: 'login' | 'register') {
	const now = Date.now();
	const key = attempts.get(ip) ?? new Map();
	const timestamps = key.get(action) ?? [];
	const valid = timestamps.filter((t: number) => now - t < LIMITS.window);
	const current = valid.length;
	return { allowed: current < LIMITS[action], remaining: Math.max(0, LIMITS[action] - current), resetAt: now + LIMITS.window };
}
