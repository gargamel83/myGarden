# AGENTS.md — MonJardin

## Stack
- **Framework** : SvelteKit (TypeScript)
- **ORM** : Drizzle (SQLite via `better-sqlite3`)
- **CSS** : Tailwind CSS
- **Map** : Leaflet (OSM) + Canvas/SVG for drawing
- **Auth** : Multi-user, scrypt password hashing, sessions in DB
- **Deployment** : Docker
- **i18n** : JSON files (`src/lib/i18n/en.json`, `fr.json`), zero dependencies

## Architecture
- `/src/lib/server/db/` — Drizzle client + schemas
- `/src/lib/server/auth.ts` — scrypt hashing, sessions (createUser/authenticateUser/getSessionUser)
- `/src/lib/components/` — Reusable components (Svelte 5 `$props()` / `$state()`)
- `/src/lib/i18n/` — Translations + locale store + `t()` function
- `/src/lib/themes.ts` — light/dark mode (`data-theme-mode`), client-safe
- `/src/lib/weather.ts` — shared weather helpers, **client-safe** (see Pièges connus)
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
npm run db:seed        # Seed plant database (58 fiches) — uses `npx tsx`
npm run db:seed:force  # Seed + overwrite existing plants
docker compose up --build # Docker prod (fallback data-docker-v0.0.0 si DATA_DIR unset)
./scripts/docker-up.sh --build # Docker prod avec DATA_DIR auto depuis package.json
```

## DB / Schema
- SQLite file in `data/monjardin.db` (gitignored). `DB_PATH` env var overrides path
- **Auth is always on** (multi-user, table `users` + `sessions`). There is no password-less
  dev mode — `LOGIN_PASSWORD` still present in `.env.example`/`docker-compose.yml` is **dead
  config**, no code reads it. Don't document it as an auth switch.
- Migration: edit schema → `npx drizzle-kit generate` → `npx drizzle-kit push`
- Docker uses versioned data dir `data-docker-v${version}/` (version read from `package.json`
  by `scripts/docker-up.sh`, e.g. `0.4.2` → `data-docker-v0.4.2`)
- `DATA_DIR` env var overrides mounted directory in Docker

### Env vars réellement lues par le code
| Var | Default | Où |
|---|---|---|
| `DB_PATH` | `data/monjardin.db` | `src/lib/server/db/index.ts` |
| `LOG_DIR` | `/app/data/logs` | `src/lib/server/logger.ts` |
| `LOG_LEVEL` | `info` | `src/lib/server/logger.ts` |
| `LOG_FORMAT` | `text` (`json` sinon) | `src/lib/server/logger.ts` |
| `ORIGIN` | — | requis par SvelteKit derrière Docker |

## i18n
- `src/lib/i18n/index.ts` exports `t(path, params?)`, `localeStore` (Svelte writable), `setLocale()`, `getLocale()`
- Keys are hierarchical: `nav.dashboard`, `status.sown`, `common.cancel`
- Fallback to `en.json` if key missing in active locale
- Add `import { localeStore, t } from '$lib/i18n'` + `let _locale = $localeStore` in components that use `t()`
- New locale: create `xx.json`, import in `index.ts`, add to `localeData` record. `LocaleSwitcher.svelte`
  has **no locales array** — its EN/FR buttons are hardcoded, so it must be edited manually too
- **Never put raw HTML entities in translation values** — Svelte does not decode them, so `&larr;`
  renders literally. Use the unicode char (`←`). This already bit us once (see the v0.4.2 changelog)
- `getLocale()` reads `localStorage` directly; use it to init `$state` at mount (see `LocaleSwitcher`,
  `ThemeModeSwitcher`). A deferred `$effect` was the cause of a hydration mismatch bug — fixed in v0.4.1

## Conventional Commits
```
<type>(<scope>): <description>
```
Types: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`, `perf`, `test`
- Scope optional (e.g. `plantations`, `docker`, `carte`, `i18n`, `auth`)
- Description in French, imperative present, no capital letter, no period

## État du projet
- Version courante : **`0.4.2`** (tag `v0.4.2`, RC `v0.4.2-rc.1` incluse). Tests : **275 / 30 fichiers**, verts.
- `doc/SESSION-RELEASE.md` = contexte de reprise de la RC (décisions Groupe A/B, pièges connus).
- La RC a été validée en Docker : auth/inscription, isolement, zones, journal de rendement, export
  `.ics`, météo, recherche/tri, mode sombre, undo/redo. Le correctif du perte de `zone` à l'export
  est dans `254b7dc`. Rythme de release : une RC par lot de features, promotion après validation
  fonctionnelle sur un vrai compte.
- **Prochaine étape naturelle** : nouveau lot de features (cf. `SPECS.md`) sur des branches
  `feature/*` parallèles, comme pour A et B.

## Pending Bugs
- *Aucun bug connu ouvert.* (Le bug LocaleSwitcher listé ici était périmé — corrigé en v0.4.1 par
  init de `current` via `getLocale()`. Entrée supprimée.)

## Pièges connus
- **Météo** : les fonctions partagées vivent dans `src/lib/weather.ts` (**client-safe**), pas sous
  `$lib/server/` — SvelteKit rejette l'import `$lib/server/*` depuis du code navigateur.
- **Curl sur les actions SvelteKit** : l'en-tête `Origin` est obligatoire (CSRF, sinon 403) et un POST
  d'action sans `Content-Type: application/x-www-form-urlencoded` renvoie 415.
- **Compte de tests** : ne jamais additionner les comptes de branches séparées, les deux partageaient
  une base commune (263 + 262 ≠ 274). Vérifier avec `npm run test`.

## Rules
- Read `SPECS.md` for detailed specs
- Read `doc/SESSION-RELEASE.md` for the RC v0.4.2 context de reprise (decisions + pieges connus)
- Always run `npx drizzle-kit push` after schema modification
- After schema change: `generate` → `push`
- Auth uses `@sveltejs/kit` hooks (`handle`) in `src/hooks.server.ts`. Session token stored in cookie, verified against `sessions` table in `getSessionUser()`. The hook 302s to `/login` for any anonymous request not starting with `/login` or `/register`
- No UI library — Tailwind only
- **Every commit MUST include**: tests + CHANGELOG.md update + README.md if needed
- **Always ask before committing** — never commit without explicit approval
- Use sub-agents (Task tool) for parallelizable work whenever possible
- Use fixed versions (no `latest`) in docker configs
- Svelte 5: `$props()`, `$state()`, `$derived()`, `$effect()`, `@render children`, `{#snippet}` / `{@snippet}`
