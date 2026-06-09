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

### Itération 1 — FAIT
- Auth mono-utilisateur (`.env` password)
- Organisation du jardin : upload photo satellite + carte OSM interactive (Leaflet) ; dessin de polygones (bandes) ; géolocalisation, géocodage Nominatim ; chaque bande a : nom, dimensions, orientation, type de sol, exposition
- Gestion des plantations : CRUD, cycles semis → repiquage → récolte, calendrier/timeline, statut auto-déduit des dates, historique par bande, plantations affichées dans les polygones de la carte
- Dashboard : vue d'ensemble saison, alertes semis/récolte/rotation, statistiques, plantations actives
- Base de connaissance : 58 fiches pré-remplies (périodes, exposition, sol, compagnonnage, photos Wikimedia) ; recherche et filtres ; page détail avec galerie photos réordonnable
- Moteur de rotation : suggestions basées sur l'historique des bandes, familles botaniques, alertes si rotation trop courte
- UX : toast notifications, dialogues de confirmation, navigation responsive avec hamburger, animations de fondu, resetForm/closeForm
- Logger applicatif : TRACE/DEBUG/INFO/WARN/ERROR, console en dev, fichiers persistants en Docker
- Docker : multi-stage, migration auto avec réconciliation, data directory versionné (scripts/docker-up.sh)

## Règles pour l'agent
- Lire `SPECS.md` pour le cahier des charges détaillé
- Toujours lancer `npx drizzle-kit push` après une modification de schéma
- Les migrations sont dans `/drizzle/`
- L'auth utilise `@sveltejs/kit` hooks (`handle`) pour protéger les routes
- Pas de librairie UI — Tailwind uniquement
