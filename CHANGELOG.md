# Changelog

## v0.2.0

### Added
- **Logger amélioré**: seuil `LOG_LEVEL` (TRACE..ERROR), format `LOG_FORMAT=json`, ring buffer 1000 entrées, `getLogs()` pour API
- **Panneau logs UI**: `LogPanel.svelte` accessible depuis la nav, filtrage par niveau (ALL/TRACE/DEBUG/INFO/WARN/ERROR), auto-scroll, polling 2s
- **API `/api/log`**: retourne les logs du ring buffer, filtre optionnel `?level=`
- **Types `LogLevel`/`LOG_LEVELS`** dans `$lib/types`, partagés client/serveur
- **Tests logger**: 9 tests (format, niveaux, JSON, ring buffer) — total passe à 49

### Performance
- **Indexes DB**: 6 indexes sur `plants` (family, common_name, sun_exposure) et `plantations` (garden_bed_id, plant_id, status) — les requêtes les plus fréquentes passent de table scan à index seek
- **`loading="lazy"`** : ajouté sur toutes les images (liste plantes, galerie, lightbox, plantations) — seules les images visibles sont chargées
- **N+1 dashboard**: les requêtes per-plant (semis, récolte) sont remplacées par un seul `inArray()` — de ~58 requêtes à 1
- **N+1 jardin**: l'historique des planches est chargé en une seule requête batch au lieu de N requêtes individuelles
- **N+1 rotation**: `getAllPlants()` est mis en cache (module-level) — plus de 58 re-scans de la table plants à chaque planche
- **Pagination plantes**: `PAGE_SIZE=20` avec bouton "Show more" — moitié moins de cartes rendues au chargement initial
- **JSON.parse serveur**: les photos des plantes sont parsées côté serveur dans le `load()` — plus de 58 try/catch dans le template
- **Clés `{#each}`**: ajout de clés sur toutes les listes principales (dashboard, plantations) — Svelte réutilise les DOM nodes au lieu de tout re-rendre

## v0.1.1

### Added
- **Tests automatisés**: Vitest configuré, 44 tests (unitaires + intégration DB)
- **CI GitHub Actions**: workflow `ci.yml` avec `check` + `test` + `build`

### Fixed
- **Filtre plantes**: remplace `window.location.href` par `goto()` — fini les rechargements complets
- **Suppression plante**: le `redirect` serveur empêchait le toast de confirmation ; remplacé par un retour `success` + navigation client
- **Type de sol**: uniformisé en `<select>` avec valeurs contraintes dans le formulaire des planches
- **TypeScript**: 7 erreurs typecheck corrigées (`string` → `PlantStatus` sur les accès `STATUS_COLORS`/`STATUS_LABELS`)

## v0.1.0 (iteration-2 branch)

### Added
- Personalized bed advice: `getBedAdvice()` based on soil and exposure
- Advanced dashboard stats: total cultivated area, top 5 crops, monthly occupancy
- Photo lightbox with keyboard navigation (←/→/Esc), counter, dark overlay
- Shared types: `$lib/types.ts` with `PlantStatus`, `SunExposure`, centralized labels

### Changed
- **No more full page reload**: replaced `fetch() + window.location.reload()` with `<form method="POST">` + `use:enhance` + `invalidate()` on all pages
- Improved calendar: bed filter, month navigation (◀/▶/Today), tooltips, current month highlighted
- Accessibility: Escape to close modals, `role="dialog"` + `aria-modal`, `tabindex` on dialogs, `e.target === e.currentTarget` pattern
- Validation: `required` fields on forms, server errors displayed via toasts
- Removed `as any` in garden (replaced with fully typed objects)
- **Full English translation**: all UI text, comments, error messages, and documentation translated from French to English
- Fixed FK deletion error: bed delete returns friendly message instead of crash
- Logger integrated into hooks: requests logged to stdout and file (`/app/data/logs/app.log`)

## v0.0.1 (main branch)

### Added

- Single-user authentication (`.env` password, session cookie)
- Satellite photo upload + polygon drawing (cultivation beds)
- Bed CRUD: name, color, soil type, exposure, dimensions, orientation
- Planting CRUD linked to a bed, sowing → transplanting → harvesting cycles
- Interactive OSM map (Leaflet): polygon drawing, Nominatim geocoding, geolocation with precision fallback
- Dashboard: stats, active plantings, sowing/harvest/rotation alerts
- Knowledge base: 58 pre-filled plant sheets (periods, soil, companion planting, Wikimedia photos)
- Rotation engine: suggestions, alerts, per-bed history
- Plant list page: search, filters, transplanting bar, photo thumbnails
- Plant detail page: companions/antagonists, visual periods, reorderable photo gallery
- Calendar/timeline view of plantings
- Auto-deduced status from dates (without overwriting existing ones), Edit button
- Toast notifications, confirmation dialogs, fade animation
- Responsive navigation with hamburger menu, garden tab persistence
- Application logger (console dev, persistent files in Docker)
- Automatic migration at Docker startup, reconciliation if tables exist
- Dockerfile + docker-compose, versioned data directory
- README, CHANGELOG, SPECS, AGENTS
