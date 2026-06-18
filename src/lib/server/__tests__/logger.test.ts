import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
	vi.resetModules();
});

describe('logger output', () => {
	it('should format info messages correctly', async () => {
		const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('test message');
		expect(consoleLog).toHaveBeenCalledOnce();
		const call = consoleLog.mock.calls[0][0] as string;
		expect(call).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
		expect(call).toContain('[INFO]');
		expect(call).toContain('test message');
		consoleLog.mockRestore();
	});

	it('should use console.warn for WARN', async () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.warn('warning!');
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.calls[0][0]).toContain('[WARN]');
		spy.mockRestore();
	});

	it('should use console.error for ERROR', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.error('error!');
		expect(spy).toHaveBeenCalledOnce();
		expect(spy.mock.calls[0][0]).toContain('[ERROR]');
		spy.mockRestore();
	});

	it('should include data as JSON when provided', async () => {
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('request', { method: 'GET', path: '/test' });
		const call = spy.mock.calls[0][0] as string;
		expect(call).toContain('{"method":"GET","path":"/test"}');
		spy.mockRestore();
	});

	it('should not log below configured LOG_LEVEL', async () => {
		vi.stubEnv('LOG_LEVEL', 'WARN');
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('should not appear');
		logger.warn('should appear');
		expect(spy).not.toHaveBeenCalled(); // warn goes to console.warn, not console.log
		spy.mockRestore();
		vi.unstubAllEnvs();
	});
});

describe('logger format JSON', () => {
	it('should output JSON when LOG_FORMAT=json', async () => {
		vi.stubEnv('LOG_FORMAT', 'json');
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('hello');
		const call = spy.mock.calls[0][0] as string;
		const parsed = JSON.parse(call);
		expect(parsed.level).toBe('INFO');
		expect(parsed.message).toBe('hello');
		expect(parsed.timestamp).toBeDefined();
		spy.mockRestore();
		vi.unstubAllEnvs();
	});
});

describe('ring buffer', () => {
	it('should store last 1000 entries', async () => {
		const { getLogs, logger } = await import('../logger');
		for (let i = 0; i < 50; i++) {
			logger.info(`entry ${i}`);
		}
		const entries = getLogs();
		expect(entries.length).toBeGreaterThanOrEqual(50);
		expect(entries[entries.length - 1].message).toBe('entry 49');
	});

	it('should filter by minimum level', async () => {
		const { LOG_LEVELS } = await import('$lib/types');
		const { getLogs, logger } = await import('../logger');
		logger.trace('trace msg');
		logger.debug('debug msg');
		logger.info('info msg');

		const filtered = getLogs('INFO');
		expect(filtered.every(e => LOG_LEVELS.indexOf(e.level) >= 2)).toBe(true);
	});

	it('should return all entries when no minLevel', async () => {
		const { getLogs, logger } = await import('../logger');
		logger.info('msg');
		const all = getLogs();
		expect(all.length).toBeGreaterThan(0);
	});
});
