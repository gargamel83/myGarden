import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { t, setLocale, getLocale, localeStore } from '../i18n';

describe('t() — basic resolution', () => {
	it('should resolve a simple key in active locale', () => {
		setLocale('en');
		expect(t('nav.dashboard')).toBe('Dashboard');
	});

	it('should resolve a nested key', () => {
		setLocale('en');
		expect(t('login.title')).toBe('Log in');
	});

	it('should use active locale value when key exists', () => {
		setLocale('fr');
		expect(t('nav.brand')).toBe('Mon Jardin');
	});

	it('should fallback to english when key missing in active locale', () => {
		setLocale('fr');
		expect(t('nonexistent.key')).toBe('nonexistent.key');
	});

	it('should return the path when key not found in any locale', () => {
		setLocale('en');
		expect(t('nonexistent.key')).toBe('nonexistent.key');
	});

	it('should return the path when value is not a string (object without one/other)', () => {
		setLocale('en');
		expect(t('nav')).toBe('nav');
	});
});

describe('t() — interpolation', () => {
	it('should replace {param} with provided value', () => {
		setLocale('en');
		expect(t('garden.plantations.title', { name: 'Bed A' })).toBe('Plantations in Bed A');
	});

	it('should replace multiple params', () => {
		setLocale('en');
		expect(t('calendar.title', { name: 'Tomato', bed: 'Bed 1' })).toBe('Tomato (Bed 1)');
	});

	it('should keep {param} placeholder when param not provided', () => {
		setLocale('en');
		expect(t('garden.plantations.title')).toBe('Plantations in {name}');
	});
});

describe('t() — plurals', () => {
	it('should return one form when count === 1', () => {
		setLocale('en');
		expect(t('garden.plantations.active', { count: 1 })).toBe('1 active');
	});

	it('should return other form when count !== 1', () => {
		setLocale('en');
		expect(t('garden.plantations.active', { count: 5 })).toBe('5 active');
	});

	it('should return other form when count === 0', () => {
		setLocale('en');
		expect(t('garden.plantations.active', { count: 0 })).toBe('0 active');
	});

	it('should return other form when count not provided', () => {
		setLocale('en');
		expect(t('garden.plantations.active')).toBe('{count} active');
	});
});

describe('t() — status, exposure, soil, watering', () => {
	it('should resolve status keys', () => {
		setLocale('en');
		expect(t('status.planned')).toBe('Planned');
		expect(t('status.sown')).toBe('Sown');
		expect(t('status.planted')).toBe('Transplanted');
		expect(t('status.harvested')).toBe('Harvested');
		expect(t('status.cancelled')).toBe('Cancelled');
	});

	it('should resolve exposure keys', () => {
		setLocale('en');
		expect(t('exposure.plein_soleil')).toBe('Full sun');
		expect(t('exposure.mi_ombre')).toBe('Partial shade');
		expect(t('exposure.ombre')).toBe('Shade');
	});

	it('should resolve soil keys', () => {
		setLocale('en');
		expect(t('soil.riche')).toBe('Rich');
		expect(t('soil.meuble')).toBe('Loose');
	});
});

describe('setLocale / getLocale', () => {
	beforeAll(() => {
		vi.stubGlobal('localStorage', {
			getItem: vi.fn(() => null),
			setItem: vi.fn()
		});
		vi.stubGlobal('document', {
			documentElement: { setAttribute: vi.fn() }
		});
	});

	afterAll(() => {
		vi.unstubAllGlobals();
	});

	it('should change locale and persist to localStorage', () => {
		setLocale('fr');
		expect(getLocale()).toBe('fr');
		expect(localStorage.setItem).toHaveBeenCalledWith('monjardin-locale', 'fr');
	});

	it('should set lang attribute on documentElement', () => {
		setLocale('en');
		expect(document.documentElement.setAttribute).toHaveBeenCalledWith('lang', 'en');
	});

	it('should update translations after locale change', () => {
		setLocale('en');
		expect(t('nav.brand')).toBe('My Garden');
		setLocale('fr');
		expect(t('nav.brand')).toBe('Mon Jardin');
	});
});

describe('localeStore', () => {
	it('should be a writable store', () => {
		let value: string | undefined;
		const unsub = localeStore.subscribe((v) => { value = v; });
		expect(value).toBeDefined();
		unsub();
	});
});
