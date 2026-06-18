# MonJardin

Web application for managing a vegetable garden — cultivation beds, plantings, crop rotation, plant knowledge base.

---

## Specifications

### Modules

| Module | Description |
|---|---|
| **Garden organization** | Upload satellite photo or interactive OSM map ; polygon drawing (beds) ; each bed has: name, dimensions, orientation, soil type, exposure |
| **Planting management** | CRUD linked to a bed ; sowing → transplanting → harvesting cycles ; visual calendar ; per-bed history |
| **Plant knowledge base** | 58 pre-filled sheets (periods, exposure, soil, companion planting, photos) ; search and filters ; detail pages with advice |
| **Crop rotation** | Suggestions based on bed history ; botanical families ; alerts if rotation is too short |
| **Dashboard** | Seasonal overview ; sowing/harvest alerts ; statistics (beds, plantings, sheets) |

### Stack

| Technology | Usage |
|---|---|
| **SvelteKit 5** (TypeScript) | Full-stack framework |
| **Drizzle ORM** + **better-sqlite3** | SQLite database |
| **Tailwind CSS v4** | Styling |
| **Leaflet** (OSM) | Interactive map |
| **adapter-node** | Production |
| **Docker** | Deployment |

---

## Getting Started

### Local Development

**Prerequisites:**
- Node.js 24+
- npm

```bash
# 1. Install dependencies
npm install

# 2. Copy and configure the password
cp .env.example .env   # then edit LOGIN_PASSWORD=my_password
#   → If .env is missing or LOGIN_PASSWORD is empty, authentication is disabled (dev mode)

# 3. Apply migrations
npx drizzle-kit push

# 4. (optional) Seed the database with plant sheets
npm run db:seed

#   → Adds missing plants without touching existing ones
#   → `npm run db:seed:force` updates all existing sheets

# 5. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Docker Production

**Prerequisites:**
- Docker
- Docker Compose v2
- Node.js (to read version from `package.json`)

```bash
# Launch (build + up) — versioned data directory automatically
LOGIN_PASSWORD=my_password ./scripts/docker-up.sh --build -d
#   → Default: password "change_me" (docker-compose.yml)
#   → If `LOGIN_PASSWORD=` is empty, authentication is disabled

# Logs
docker compose logs -f

# Stop
docker compose down
```

Open [http://localhost:3000](http://localhost:3000).

> **Isolation note:** Docker uses a versioned data directory (`data-docker-v0.0.1/`) to avoid interfering with the local development database (`data/`). Changing the version in `package.json` creates a new isolated database. See `./scripts/docker-up.sh`.

---

## Debug

### Application Logs

#### Configuration

| Variable | Défaut | Description |
|---|---|---|
| `LOG_LEVEL` | `TRACE` (dev) / `INFO` (prod) | Seuil minimal : `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `LOG_FORMAT` | `text` | Format de sortie : `text` ou `json` (pour Elastic/Loki) |
| `LOG_DIR` | `/app/data/logs` | Répertoire des fichiers logs (Docker uniquement) |

#### Sorties

- Locally (dev), logs écrits sur **stdout/stderr** uniquement.
- In Docker, logs écrits dans `./data-docker-vX.X.X/logs/` sur l'hôte (volume persistant) :

```bash
# Voir les logs en direct
docker compose logs -f

# Fichiers persistants
tail -f data-docker-v*/logs/app.log
tail -f data-docker-v*/logs/error.log
```

#### Panneau UI

Un bouton `☰` dans la barre de navigation ouvre un panneau de logs accessible depuis l'interface : filtrage par niveau (ALL à ERROR), auto-scroll, rafraîchissement toutes les 2s.

```bash
# View logs in real time
docker compose logs -f

# Access persistent files
tail -f data-docker-v*/logs/app.log
tail -f data-docker-v*/logs/error.log
```

The log directory is configurable via the `LOG_DIR` environment variable (default: `/app/data/logs`).

### Common Errors

| Symptom | Cause | Solution |
|---|---|---|
| `SQLITE_ERROR: no such table` | Migrations not applied | `npx drizzle-kit push` |
| `LOGIN_PASSWORD` not set | No `.env` or LOGIN_PASSWORD missing | Create `.env` with `LOGIN_PASSWORD=xxx` ; if empty → no auth (dev) |
| `readonly database` | DB file owned by root (Docker) | `sudo chown -R $(whoami) data-docker-v*/` |
| Port already in use | Another service listening on 3000/5173 | `lsof -i :3000` then `kill` |
| Plantation not found | Bed deleted but orphaned plantings remain | Check in database with `npx drizzle-kit studio` |

### Quick Checks

```bash
# Lint / type check
npm run check

# Tests unitaires + intégration
npm test

# Mode watch (dev)
npm run test:watch

# Build
npm run build

# Test the container
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Expected response: 302 (redirected to /login)
```

---

## Tests

```bash
# Run all tests (once)
npm test

# Watch mode
npm run test:watch
```

49 tests couvrent :
- **Unitaires** : `types.ts`, `rotation.ts`, `planting.ts`, `toast.svelte.ts`, `logger.ts`
- **Intégration DB** : `db.ts` (SQLite temporaire avec `better-sqlite3`, migrations Drizzle)

Les tests d'intégration DB créent une base SQLite temporaire (`/tmp/monjardin-test-*`) et la détruisent après execution.

> **Note** : Pour les tests logger, `NODE_ENV=development` est défini automatiquement par la config vitest (évite les tentatives d'écriture dans `/app/data/logs`).

### CI

Un workflow GitHub Actions (`.github/workflows/ci.yml`) est déclenché sur tout push vers `main`, `iteration-*`, `test/*`, `fix/*` :
- `npm ci`
- `npm run check`
- `npm test`
- `npm run build`

## Update Cycle

### Adding / Updating Plants

The sheets are in `src/lib/server/db/seed.ts`.

```bash
# Add new plants only (additive)
npm run db:seed

# Force update all sheets (photos, modified fields…)
npm run db:seed:force
```

To add fields to a sheet:

```bash
# 1. Modify the schema in schema.ts
# 2. Generate the migration
npx drizzle-kit generate
# 3. Apply
npx drizzle-kit push
# 4. Update seed.ts with the new column
# 5. Force re-seed
npm run db:seed:force
```

### Improving the Site

1. **Modify the code** — the application auto-rebuilds in dev (`npm run dev`)
2. **Migrate the database** — after a schema change (see above)
3. **Test** — `npm run check && npm run build`
4. **Deploy with Docker**:

```bash
./scripts/docker-up.sh --build -d   # rebuild + up with the correct version
```

Data persists in `./data-docker-vX.X.X/monjardin.db` (versioned data directory).

### Migration Structure

```
drizzle/
  0000_xxx.sql        # Initial migration
  0001_xxx.sql        # Added type field (pixel/geo)
  0002_xxx.sql        # Added dimensions/orientation
   0003_xxx.sql        # Added floweringStart/floweringEnd
   0004_xxx.sql        # Added indexes (plants.family, plants.common_name, plants.sun_exposure,
                       #   plantations.garden_bed_id, plantations.plant_id, plantations.status)
```

Migrations are applied automatically at Docker container startup via `scripts/migrate.js`.
If the tables already exist (pre-existing database), the script reconciles the `__drizzle_migrations` tracking table and continues.

---

## Future Improvements

*(Reserved — ideas and priorities)*

- [x] Individualized bed advice (soil + exposure)
- [x] Yield / used area statistics
- [ ] Email notifications (sowing, harvest)
- [ ] Offline mode / PWA
- [ ] CSV export of plantings
- [ ] Multi-user
- [ ] Public API
