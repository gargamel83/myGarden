import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

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

describe('parseLevel', () => {
	it('should show TRACE messages when LOG_LEVEL=TRACE', async () => {
		vi.stubEnv('LOG_LEVEL', 'TRACE');
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.trace('trace msg');
		expect(spy).toHaveBeenCalled();
		spy.mockRestore();
		vi.unstubAllEnvs();
	});

	it('should suppress INFO when LOG_LEVEL=ERROR', async () => {
		vi.stubEnv('LOG_LEVEL', 'ERROR');
		const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('info');
		logger.warn('warn');
		logger.error('error');
		expect(spyLog).not.toHaveBeenCalled();
		expect(spyWarn).not.toHaveBeenCalled();
		expect(spyError).toHaveBeenCalled();
		spyLog.mockRestore();
		spyWarn.mockRestore();
		spyError.mockRestore();
		vi.unstubAllEnvs();
	});

	it('should suppress DEBUG when LOG_LEVEL=INFO', async () => {
		vi.stubEnv('LOG_LEVEL', 'INFO');
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.debug('debug msg');
		logger.info('info msg');
		const calls = spy.mock.calls.map(c => c[0]);
		expect(calls.some((c: string) => c.includes('info msg'))).toBe(true);
		expect(calls.some((c: string) => c.includes('debug msg'))).toBe(false);
		spy.mockRestore();
		vi.unstubAllEnvs();
	});

	it('should only show WARN and ERROR when LOG_LEVEL=WARN', async () => {
		vi.stubEnv('LOG_LEVEL', 'WARN');
		const spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		const spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('info');
		logger.warn('warn');
		logger.error('error');
		expect(spyLog).not.toHaveBeenCalled();
		expect(spyWarn).toHaveBeenCalled();
		expect(spyError).toHaveBeenCalled();
		spyLog.mockRestore();
		spyWarn.mockRestore();
		spyError.mockRestore();
		vi.unstubAllEnvs();
	});
});

describe('file logging', () => {
	it('should write to app.log and error.log for ERROR', async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), 'logger-test-'));
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('LOG_DIR', tmpDir);
		const { logger } = await import('../logger');
		logger.error('test error');
		const appLog = readFileSync(join(tmpDir, 'app.log'), 'utf8');
		const errorLog = readFileSync(join(tmpDir, 'error.log'), 'utf8');
		expect(appLog).toContain('test error');
		expect(errorLog).toContain('test error');
		rmSync(tmpDir, { recursive: true, force: true });
		vi.unstubAllEnvs();
	});

	it('should only write to app.log for WARN (not error.log)', async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), 'logger-test-'));
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('LOG_DIR', tmpDir);
		const { logger } = await import('../logger');
		logger.warn('test warn');
		const appLog = readFileSync(join(tmpDir, 'app.log'), 'utf8');
		expect(appLog).toContain('test warn');
		expect(existsSync(join(tmpDir, 'error.log'))).toBe(false);
		rmSync(tmpDir, { recursive: true, force: true });
		vi.unstubAllEnvs();
	});

	it('should create log directory if missing', async () => {
		const baseDir = mkdtempSync(join(tmpdir(), 'logger-test-'));
		const logDir = join(baseDir, 'nested', 'logs');
		vi.stubEnv('NODE_ENV', 'production');
		vi.stubEnv('LOG_DIR', logDir);
		const { logger } = await import('../logger');
		logger.info('test');
		const appLog = readFileSync(join(logDir, 'app.log'), 'utf8');
		expect(appLog).toContain('test');
		rmSync(baseDir, { recursive: true, force: true });
		vi.unstubAllEnvs();
	});
});

describe('formatJson', () => {
	it('should include data field in JSON output when provided', async () => {
		vi.stubEnv('LOG_FORMAT', 'json');
		const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('with data', { key: 'value' });
		const call = spy.mock.calls[0][0] as string;
		const parsed = JSON.parse(call);
		expect(parsed.message).toBe('with data');
		expect(parsed.data).toEqual({ key: 'value' });
		spy.mockRestore();
		vi.unstubAllEnvs();
	});
});
