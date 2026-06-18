# Changelog

## v0.1.1

### Added
- **Tests automatisés**: Vitest configuré, 32 tests unitaires couvrant `types.ts`, `rotation.ts`, `planting.ts`, `toast.svelte.ts`

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
