import { writable } from 'svelte/store';
import en from './en.json';
import fr from './fr.json';
import type { Translations } from './types';

export type Locale = 'en' | 'fr' | 'de' | 'pt-BR';

const localeData: Record<Locale, Translations> = { en, fr } as any;

const STORAGE_KEY = 'monjardin-locale';
const DEFAULT: Locale = 'en';

function loadLocale(): Locale {
	if (typeof localStorage === 'undefined') return DEFAULT;
	return (localStorage.getItem(STORAGE_KEY) as Locale) || DEFAULT;
}

export const localeStore = writable<Locale>(loadLocale());

let current: Locale = loadLocale();
localeStore.subscribe((v) => { current = v; });

function resolve(obj: any, path: string): any {
	return path.split('.').reduce((acc, key) => {
		if (acc && typeof acc === 'object' && key in acc) return acc[key];
		return undefined;
	}, obj);
}

export function setLocale(locale: Locale) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, locale);
	}
	if (typeof document !== 'undefined') {
		document.documentElement.setAttribute('lang', locale);
	}
	localeStore.set(locale);
}

export function getLocale(): Locale {
	return current;
}

export function t(path: string, params?: Record<string, string | number>): string {
	let value = resolve(localeData[current], path);
	if (value === undefined) {
		value = resolve(localeData[DEFAULT], path);
	}
	if (value === undefined) return path;

	if (typeof value === 'object' && value !== null && 'one' in value && 'other' in value) {
		const count = params?.count ?? 0;
		value = count === 1 ? value.one : value.other;
	}

	if (typeof value !== 'string') return path;

	if (params) {
		return value.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
	}

	return value;
}
