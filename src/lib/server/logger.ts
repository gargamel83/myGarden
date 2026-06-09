import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';

const LOG_DIR = process.env.LOG_DIR || '/app/data/logs';
const isDev = process.env.NODE_ENV === 'development';
const isDocker = !isDev;

function ensureLogDir() {
	if (isDocker && !existsSync(LOG_DIR)) {
		mkdirSync(LOG_DIR, { recursive: true });
	}
}

function logFile(name: string) {
	return join(LOG_DIR, name);
}

function write(type: string, message: string, data?: unknown) {
	const timestamp = new Date().toISOString();
	const suffix = data ? ` ${JSON.stringify(data)}` : '';
	const line = `[${timestamp}] [${type}] ${message}${suffix}`;

	if (type === 'ERROR') console.error(line);
	else if (type === 'WARN') console.warn(line);
	else console.log(line);

	if (isDocker) {
		ensureLogDir();
		try {
			appendFileSync(logFile('app.log'), line + '\n');
			if (type === 'ERROR') {
				appendFileSync(logFile('error.log'), line + '\n');
			}
		} catch {
			// silent fail — logs directory not writable
		}
	}
}

export const logger = {
	trace: (message: string, data?: unknown) => {
		if (isDev) console.log(`[TRACE] ${message}`, data ?? '');
	},
	debug: (message: string, data?: unknown) => {
		if (isDev) console.log(`[DEBUG] ${message}`, data ?? '');
	},
	info: (message: string, data?: unknown) => write('INFO', message, data),
	warn: (message: string, data?: unknown) => write('WARN', message, data),
	error: (message: string, data?: unknown) => write('ERROR', message, data)
};
