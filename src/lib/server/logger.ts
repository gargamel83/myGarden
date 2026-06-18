import { existsSync, mkdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { LOG_LEVELS } from '$lib/types';
import type { LogLevel } from '$lib/types';

const LOG_DIR = process.env.LOG_DIR || '/app/data/logs';
const isDev = process.env.NODE_ENV === 'development';
const isDocker = !isDev;

function parseLevel(env?: string): number {
	const idx = LOG_LEVELS.indexOf((env || '').toUpperCase() as LogLevel);
	return idx >= 0 ? idx : isDev ? 0 : 2;
}

const configuredLevel = parseLevel(process.env.LOG_LEVEL);
const logFormat = process.env.LOG_FORMAT === 'json' ? 'json' : 'text';

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	message: string;
	data?: unknown;
}

const MAX_LOGS = 1000;
const ringBuffer: LogEntry[] = [];

function pushEntry(entry: LogEntry) {
	ringBuffer.push(entry);
	if (ringBuffer.length > MAX_LOGS) {
		ringBuffer.shift();
	}
}

export function getLogs(minLevel?: LogLevel): LogEntry[] {
	if (!minLevel) return [...ringBuffer];
	const minIdx = LOG_LEVELS.indexOf(minLevel);
	return ringBuffer.filter(e => LOG_LEVELS.indexOf(e.level) >= minIdx);
}

function ensureLogDir() {
	if (isDocker && !existsSync(LOG_DIR)) {
		mkdirSync(LOG_DIR, { recursive: true });
	}
}

function logFile(name: string) {
	return join(LOG_DIR, name);
}

function formatText(entry: LogEntry): string {
	const suffix = entry.data !== undefined ? ` ${JSON.stringify(entry.data)}` : '';
	return `[${entry.timestamp}] [${entry.level}] ${entry.message}${suffix}`;
}

function formatJson(entry: LogEntry): string {
	return JSON.stringify(entry.data !== undefined ? entry : { ...entry, data: undefined });
}

function write(level: LogLevel, message: string, data?: unknown) {
	const levelIdx = LOG_LEVELS.indexOf(level);
	if (levelIdx < configuredLevel) return;

	const entry: LogEntry = {
		timestamp: new Date().toISOString(),
		level,
		message,
		...(data !== undefined ? { data } : {})
	};

	pushEntry(entry);

	const line = logFormat === 'json' ? formatJson(entry) : formatText(entry);

	if (level === 'ERROR') console.error(line);
	else if (level === 'WARN') console.warn(line);
	else console.log(line);

	if (isDocker) {
		ensureLogDir();
		try {
			appendFileSync(logFile('app.log'), line + '\n');
			if (level === 'ERROR') {
				appendFileSync(logFile('error.log'), line + '\n');
			}
		} catch {
			// silent fail
		}
	}
}

export const logger = {
	trace: (message: string, data?: unknown) => write('TRACE', message, data),
	debug: (message: string, data?: unknown) => write('DEBUG', message, data),
	info: (message: string, data?: unknown) => write('INFO', message, data),
	warn: (message: string, data?: unknown) => write('WARN', message, data),
	error: (message: string, data?: unknown) => write('ERROR', message, data)
};
