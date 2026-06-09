let _toast: ((msg: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export function setToastHandler(fn: typeof _toast) {
	_toast = fn;
}

export function toast(message: string, type: 'success' | 'error' | 'info' = 'success') {
	_toast?.(message, type);
}
