# AGENTS.md — MonJardin

## Stack
- **Framework** : SvelteKit (TypeScript)
- **ORM** : Drizzle (SQLite via `better-sqlite3`)
- **CSS** : Tailwind CSS
- **Carte** : Leaflet (OSM) + Canvas/SVG pour dessin
- **Auth** : Mono-utilisateur, mot de passe dans `.env`
- **Déploiement** : Docker

## Architecture
- `/src/lib/server/db/` — Drizzle client + schémas
- `/src/lib/components/` — Composants réutilisables
- `/src/routes/` — Pages SvelteKit (layout, api, pages)
- `/drizzle/` — Migrations

## Commandes
```bash
npm run dev          # Dev server (port 5173)
npm run build        # Production build
npm run preview      # Preview production build
npx drizzle-kit push # Apply schema to DB
npx drizzle-kit generate # Generate migration
npm run db:seed      # Seed plant database (58 fiches)
docker compose up --build # Docker prod (fallback data-docker-v0.0.0)
./scripts/docker-up.sh --build  # Docker prod avec DATA_DIR auto depuis package.json
```

## DB / Schema
- SQLite file stored in `data/monjardin.db` (gitignored)
- Set `LOGIN_PASSWORD=xxx` in `.env` before running
- Default dev without `.env` = no auth (pass-through)
- Migration workflow: edit schema → `npx drizzle-kit generate` → `npx drizzle-kit push`
- Docker utilise un data directory versionné : `data-docker-vX.X.X/` (lu depuis `package.json` via `scripts/docker-up.sh`)
- `DB_PATH` env var surcharge le chemin de la BDD (utilisé par `migrate.js` et `db/index.ts`)
- `DATA_DIR` env var surcharge le dossier monté dans Docker (défaut `data-docker-v0.0.0` si non fourni)

## Itérations

### Itération 1 (semaine 1-2) — FAIT
- Auth mono-utilisateur (`.env` password)
- Organisation du jardin : upload photo satellite + dessin bandes de culture (polygones)
- Gestion des plantations : CRUD, cycles (semis → repiquage → récolte), calendrier
- Dockerfile + docker-compose

### Itération 2 (semaine 3-4) — FAIT
- Base de connaissance plantes (58 fiches pré-remplies : familles, périodes, sol, compagnonnage, photos)
- Moteur de rotation des cultures (suggestions, alertes, historique par bande)
- Page liste plantes avec recherche et filtres
- Page détail plante avec compagnons/antagonistes et périodes visuelles

### Itération 3 (semaine 5-6) — FAIT
- Dashboard + statistiques
- Carte OSM interactive (Leaflet)
- Améliorations UX + déploiement

## Règles pour l'agent
- Lire `SPECS.md` pour le cahier des charges détaillé
- Toujours lancer `npx drizzle-kit push` après une modification de schéma
- Les migrations sont dans `/drizzle/`
- L'auth utilise `@sveltejs/kit` hooks (`handle`) pour protéger les routes
- Pas de librairie UI — Tailwind uniquement
