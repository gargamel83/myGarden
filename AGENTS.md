# AGENTS.md — MonJardin

## Stack
- **Framework** : SvelteKit (TypeScript)
- **ORM** : Drizzle (SQLite via `better-sqlite3`)
- **CSS** : Tailwind CSS
- **Map** : Leaflet (OSM) + Canvas/SVG for drawing
- **Auth** : Single-user, password in `.env`
- **Deployment** : Docker
- **i18n** : JSON files (`src/lib/i18n/en.json`, `fr.json`), zero dependencies

## Architecture
- `/src/lib/server/db/` — Drizzle client + schemas
- `/src/lib/components/` — Reusable components (Svelte 5 `$props()` / `$state()`)
- `/src/lib/i18n/` — Translations + locale store + `t()` function
- `/src/routes/` — SvelteKit pages (layout, api, pages)
- `/drizzle/` — Migrations
- `/src/lib/types.ts` — Union types (`PlantStatus`, `SunExposure`, etc.)

## Commands
```bash
npm run dev            # Dev server (port 5173)
npm run build          # Production build
npm run preview        # Preview production build
npm run check          # TypeScript check
npm run test           # Vitest (unit + integration)
npm run test:watch     # Vitest watch mode
npx drizzle-kit push   # Apply schema to DB
npx drizzle-kit generate # Generate migration
npm run db:seed        # Seed plant database (58 sheets) — uses `npx tsx`
docker compose up --build # Docker prod (fallback data-docker-v0.0.0)
./scripts/docker-up.sh --build # Docker prod with auto DATA_DIR from package.json
```

## DB / Schema
- SQLite file in `data/monjardin.db` (gitignored). `DB_PATH` env var overrides path
- Set `LOGIN_PASSWORD=xxx` in `.env`. Without it → no auth (dev mode)
- Migration: edit schema → `npx drizzle-kit generate` → `npx drizzle-kit push`
- Docker uses versioned data dir `data-docker-vX.X.X/` (read from `package.json` via `scripts/docker-up.sh`)
- `DATA_DIR` env var overrides mounted directory in Docker

## i18n
- `src/lib/i18n/index.ts` exports `t(path, params?)`, `localeStore` (Svelte writable), `setLocale()`, `getLocale()`
- Keys are hierarchical: `nav.dashboard`, `status.sown`, `common.cancel`
- Fallback to `en.json` if key missing in active locale
- Add `import { localeStore, t } from '$lib/i18n'` + `let _locale = $localeStore` in components that use `t()`
- New locale: create `xx.json`, import in `index.ts`, add to `localeData` record, add to `LocaleSwitcher.svelte` locales array

## Conventional Commits
```
<type>(<scope>): <description>
```
Types: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`, `perf`, `test`
- Scope optional (e.g. `plantations`, `docker`, `carte`, `i18n`, `auth`)
- Description in French, imperative present, no capital letter, no period

## Pending Bugs
- **LocaleSwitcher dropdown ne s'ouvre pas au clic**. Cause suspectée : hydration mismatch SSR/client. Le SSR initialise `current = 'en'` (pas de localStorage), mais si localStorage contient `'fr'`, la réhydratation peut casser les event handlers. Tentatives : `$effect` + subscribe, `$state` local + `$effect` post-mount. Rien n'a fonctionné. À revoir.

## Rules
- Read `SPECS.md` for detailed specs
- Always run `npx drizzle-kit push` after schema modification
- After schema change: `generate` → `push`
- Auth uses `@sveltejs/kit` hooks (`handle`) in `src/hooks.server.ts`
- No UI library — Tailwind only
- **Every commit MUST include**: tests + CHANGELOG.md update + README.md if needed
- **Always ask before committing** — never commit without explicit approval
- Use sub-agents (Task tool) for parallelizable work whenever possible
- Use fixed versions (no `latest`) in docker configs
- Svelte 5: `$props()`, `$state()`, `$derived()`, `$effect()`, `@render children`, `{#snippet}` / `{@snippet}`
