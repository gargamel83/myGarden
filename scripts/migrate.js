import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const ts = () => new Date().toISOString();
const log = (level, msg) => console.log(`[${ts()}] [${level}] ${msg}`);

const dbPath = process.env.DB_PATH || 'data/monjardin.db';

log('INFO', `Opening database: ${dbPath}`);

try {
	const sqlite = new Database(dbPath);
	const db = drizzle(sqlite);

	log('INFO', 'Applying database migrations...');
	log('TRACE', `Migration folder: drizzle/`);

	try {
		migrate(db, { migrationsFolder: 'drizzle' });
		log('INFO', 'Migrations applied successfully.');
	} catch (err) {
		const isExists = err.message?.includes('already exists') || err.cause?.message?.includes('already exists');

		if (isExists) {
			log('WARN', 'Tables already exist — initializing migration tracking');

			const hasTable = sqlite.prepare(
				`SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'`
			).get();

			if (!hasTable) {
				log('TRACE', 'Creating __drizzle_migrations table');
				sqlite.exec(`CREATE TABLE "__drizzle_migrations" (
					"id" INTEGER PRIMARY KEY AUTOINCREMENT,
					"hash" TEXT NOT NULL,
					"created_at" TEXT
				)`);
			}

			const files = readdirSync('drizzle').filter(f => f.endsWith('.sql')).sort();
			log('TRACE', `Found ${files.length} migration files to reconcile`);

			for (const file of files) {
				const content = readFileSync(join('drizzle', file)).toString();
				const hash = crypto.createHash('md5').update(content).digest('hex');
				const existing = sqlite.prepare(
					`SELECT id FROM "__drizzle_migrations" WHERE hash = ?`
				).get(hash);
				if (!existing) {
					sqlite.prepare(
						`INSERT INTO "__drizzle_migrations" (hash, created_at) VALUES (?, ?)`
					).run(hash, new Date().toISOString());
					log('TRACE', `  Marked ${file} as applied`);
				}
			}

			log('INFO', `Migration tracking reconciled for ${files.length} migration(s).`);
		} else {
			throw err;
		}
	}

	sqlite.close();
	log('INFO', 'Database ready.');
} catch (err) {
	log('ERROR', `Fatal: ${err.message}`);
	process.exit(1);
}
