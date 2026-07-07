export type ThemeId = 'teal' | 'green' | 'earth' | 'slate';

export interface Theme {
	id: ThemeId
	label: string
	desc: string
	color: string
}

export const themes: Theme[] = [
	{ id: 'teal', label: 'Teal', desc: 'Modern teal', color: '#0d9488' },
	{ id: 'green', label: 'Green', desc: 'Original garden green', color: '#16a34a' },
	{ id: 'earth', label: 'Earth', desc: 'Terracotta & amber', color: '#d97706' },
	{ id: 'slate', label: 'Slate', desc: 'Neutral gray', color: '#334155' }
];

const STORAGE_KEY = 'monjardin-theme';

export function loadTheme(): ThemeId {
	if (typeof localStorage === 'undefined') return 'teal';
	return (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'teal';
}

export function saveTheme(id: ThemeId) {
	if (typeof localStorage !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, id);
	}
	document.documentElement.setAttribute('data-theme', id);
}

export function applyTheme(id: ThemeId) {
	document.documentElement.setAttribute('data-theme', id);
}
