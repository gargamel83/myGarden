import { db } from './index';
import { plants as plantsTable } from './schema';
import { eq } from 'drizzle-orm';
import { seeds } from './seed-data';

async function main() {
	const force = process.argv.includes('--force');
	console.log(`🌱 Seeding database...${force ? ' (force mode)' : ''}`);

	for (const s of seeds) {
		const existing = db.select()
			.from(plantsTable)
			.where(eq(plantsTable.commonName, s.commonName))
			.all();

		if (existing.length === 0) {
			db.insert(plantsTable).values(s).run();
			console.log(`  ✓ ${s.commonName}`);
		} else if (force) {
			db.update(plantsTable).set(s).where(eq(plantsTable.commonName, s.commonName)).run();
			console.log(`  ↻ ${s.commonName} (mis à jour)`);
		} else {
			console.log(`  - ${s.commonName} (déjà existant)`);
		}
	}

	console.log(`✅ ${seeds.length} plantes traitées`);
	process.exit(0);
}

main().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
