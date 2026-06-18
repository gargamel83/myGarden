# AGENTS.md — MonJardin

## Stack
- **Framework** : SvelteKit (TypeScript)
- **ORM** : Drizzle (SQLite via `better-sqlite3`)
- **CSS** : Tailwind CSS
- **Map** : Leaflet (OSM) + Canvas/SVG for drawing
- **Auth** : Single-user, password in `.env`
- **Deployment** : Docker

## Architecture
- `/src/lib/server/db/` — Drizzle client + schemas
- `/src/lib/components/` — Reusable components
- `/src/routes/` — SvelteKit pages (layout, api, pages)
- `/drizzle/` — Migrations

## Commands
```bash
npm run dev          # Dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npx drizzle-kit push # Apply schema to DB
npx drizzle-kit generate # Generate migration
npm run db:seed      # Seed plant database (58 sheets)
docker compose up --build # Docker prod (fallback data-docker-v0.0.0)
./scripts/docker-up.sh --build  # Docker prod with auto DATA_DIR from package.json
```

## DB / Schema
- SQLite file stored in `data/monjardin.db` (gitignored)
- Set `LOGIN_PASSWORD=xxx` in `.env` before running
- Default dev without `.env` = no auth (pass-through)
- Migration workflow: edit schema → `npx drizzle-kit generate` → `npx drizzle-kit push`
- Docker uses a versioned data directory: `data-docker-vX.X.X/` (read from `package.json` via `scripts/docker-up.sh`)
- `DB_PATH` env var overrides the database path (used by `migrate.js` and `db/index.ts`)
- `DATA_DIR` env var overrides the mounted directory in Docker (defaults to `data-docker-v0.0.0` if not provided)

## Iterations

### Iteration 1 — DONE
- Single-user auth (`.env` password)
- Garden organization: satellite photo upload + interactive OSM map (Leaflet); polygon drawing (beds); geolocation, Nominatim geocoding; each bed has: name, dimensions, orientation, soil type, exposure
- Planting management: CRUD, sowing → transplanting → harvesting cycles, calendar/timeline, auto-deduced status from dates, per-bed history, plantings displayed in map polygons
- Dashboard: seasonal overview, sowing/harvest/rotation alerts, statistics, active plantings
- Knowledge base: 58 pre-filled sheets (periods, exposure, soil, companion planting, Wikimedia photos); search and filters; detail page with reorderable photo gallery
- Rotation engine: suggestions based on bed history, botanical families, alerts if rotation is too short
- UX: toast notifications, confirmation dialogs, responsive navigation with hamburger, fade animations, resetForm/closeForm
- Application logger: TRACE/DEBUG/INFO/WARN/ERROR, console in dev, persistent files in Docker
- Docker: multi-stage, auto migration with reconciliation, versioned data directory (scripts/docker-up.sh)

### Iteration 2 — DONE
- **No more full page reload**: `fetch() + reload()` replaced by `<form> + use:enhance + invalidate()` on all pages (garden, plantations, plants, login)
- **Form validation**: `required` fields, server errors displayed via toasts
- **Personalized bed advice**: `getBedAdvice()` function based on soil and exposure, displayed in the edit modal
- **Dashboard stats**: total area, top 5 crops (bars), monthly occupancy (histogram)
- **Improved calendar**: bed filter, month navigation, tooltips, current month highlighted
- **Photo lightbox**: reusable component with keyboard navigation (←/→/Esc)
- **Accessibility**: Escape on modals, `role="dialog"` + `aria-modal`
- **Strict TypeScript**: union types in `$lib/types.ts`, no more `as any`, centralized labels

## Conventional Commits
All commit messages follow the format:
```
<type>(<scope>): <description>
```
Types: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`, `perf`, `test`
- Scope is optional but encouraged (e.g.: `plantations`, `docker`, `carte`, `auth`)
- Description in French, imperative present, no capital letter, no period at the end
- No breaking change without explicit discussion

## Rules for the agent
- Read `SPECS.md` for the detailed specifications
- Always run `npx drizzle-kit push` after a schema modification
- Migrations are in `/drizzle/`
- Auth uses `@sveltejs/kit` hooks (`handle`) to protect routes
- No UI library — Tailwind only
- **Chaque commit DOIT inclure** : les tests, la MAJ du CHANGELOG et la MAJ du README si nécessaire
