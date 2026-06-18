import { describe, it, expect, vi } from 'vitest';
import { setToastHandler, toast } from '../toast.svelte';

describe('toast', () => {
	it('should call the registered handler', () => {
		const handler = vi.fn();
		setToastHandler(handler);
		toast('Hello');
		expect(handler).toHaveBeenCalledWith('Hello', 'success');
	});

	it('should call with error type', () => {
		const handler = vi.fn();
		setToastHandler(handler);
		toast('Oops', 'error');
		expect(handler).toHaveBeenCalledWith('Oops', 'error');
	});

	it('should call with info type', () => {
		const handler = vi.fn();
		setToastHandler(handler);
		toast('Info', 'info');
		expect(handler).toHaveBeenCalledWith('Info', 'info');
	});

	it('should not throw when no handler set', () => {
		setToastHandler(null);
		expect(() => toast('test')).not.toThrow();
	});
});
