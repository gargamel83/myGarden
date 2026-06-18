import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

beforeEach(() => {
	vi.resetModules();
});

describe('logger', () => {
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

	it('should format warn messages correctly', async () => {
		const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.warn('warning!');
		expect(consoleWarn).toHaveBeenCalledOnce();
		const call = consoleWarn.mock.calls[0][0] as string;
		expect(call).toContain('[WARN]');
		expect(call).toContain('warning!');
		consoleWarn.mockRestore();
	});

	it('should format error messages correctly', async () => {
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.error('error!');
		expect(consoleError).toHaveBeenCalledOnce();
		const call = consoleError.mock.calls[0][0] as string;
		expect(call).toContain('[ERROR]');
		expect(call).toContain('error!');
		consoleError.mockRestore();
	});

	it('should include data as JSON when provided', async () => {
		const consoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
		const { logger } = await import('../logger');
		logger.info('request', { method: 'GET', path: '/test', status: 200 });
		const call = consoleLog.mock.calls[0][0] as string;
		expect(call).toContain('{"method":"GET","path":"/test","status":200}');
		consoleLog.mockRestore();
	});
});
