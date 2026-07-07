import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { themes, loadTheme, saveTheme, applyTheme } from '../themes';

describe('themes array', () => {
	it('should have 4 themes', () => {
		expect(themes).toHaveLength(4);
	});

	it('each theme should have id, label, desc, color', () => {
		for (const theme of themes) {
			expect(theme).toHaveProperty('id');
			expect(theme).toHaveProperty('label');
			expect(theme).toHaveProperty('desc');
			expect(theme).toHaveProperty('color');
		}
	});

	it('should include all required theme ids', () => {
		const ids = themes.map(t => t.id);
		expect(ids).toEqual(['teal', 'green', 'earth', 'slate']);
	});

	it('should have valid hex colors', () => {
		const hex = /^#[0-9a-f]{6}$/;
		for (const theme of themes) {
			expect(theme.color).toMatch(hex);
		}
	});
});

describe('loadTheme', () => {
	it('should return teal when localStorage is unavailable', () => {
		expect(loadTheme()).toBe('teal');
	});

	it('should return stored theme when localStorage has value', () => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => 'earth')
		});
		expect(loadTheme()).toBe('earth');
		vi.unstubAllGlobals();
	});
});

describe('saveTheme and applyTheme (DOM)', () => {
	const mockSetAttribute = vi.fn();

	beforeAll(() => {
		vi.stubGlobal('document', {
			documentElement: { setAttribute: mockSetAttribute }
		});
		vi.stubGlobal('localStorage', {
			setItem: vi.fn()
		});
	});

	afterAll(() => {
		vi.unstubAllGlobals();
	});

	it('saveTheme should set data-theme on documentElement', () => {
		saveTheme('green');
		expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'green');
	});

	it('saveTheme should store in localStorage', () => {
		saveTheme('earth');
		const store = (vi.mocked(localStorage).setItem as ReturnType<typeof vi.fn>);
		expect(store).toHaveBeenCalledWith('monjardin-theme', 'earth');
	});

	it('applyTheme should set data-theme on documentElement', () => {
		applyTheme('slate');
		expect(mockSetAttribute).toHaveBeenCalledWith('data-theme', 'slate');
	});
});
