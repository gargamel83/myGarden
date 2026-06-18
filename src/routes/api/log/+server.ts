import { json } from '@sveltejs/kit';
import { getLogs, type LogEntry } from '$lib/server/logger';
import { LOG_LEVELS } from '$lib/types';
import type { LogLevel } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const levelParam = url.searchParams.get('level') || '';
	const level = LOG_LEVELS.includes(levelParam as LogLevel) ? (levelParam as LogLevel) : undefined;
	const logs = getLogs(level);
	return json(logs);
};
