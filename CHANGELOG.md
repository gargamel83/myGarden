# Changelog

## v0.4.2-rc.1

### Added
- **Release Candidate 0.1** : fusion des groupes A (données/jardin : rotation auto, journal de rendement, zones, versioning des planches) et B (UX/calendrier : export .ics, widget météo, recherche + tri, mode sombre) dans `main`.
- **Versioning** : bump `package.json` → `0.4.2-rc.1`, README mis à jour, total des tests : 274 (30 fichiers).

### Fixed
- **Bouton retour fiche plante** : l'entité HTML littérale `&larr;` de `plant.back` (en + fr) n'était pas décodée par Svelte et s'affichait brute (`&larr; Back to plants`). Remplacée par le caractère unicode `←`.

## v0.4.2

### Added
- **A1 — Rotation automatique des cultures** : `buildRotationPlan()` calcule un plan de rotation sur 3 ans (évite les familles en repos), affiché dans le modal d'édition de chaque planche (tableau année / famille / plantes suggérées)
- **A2 — Journal de rendement** : table `harvest_records` (poids, quantité, état, notes, photo, date) — enregistrement/suppression d'une récolte par plantation, historique consolidé, inclus dans l'export/import JSON
- **A3 — Zones sur les planches** : colonne `zone` sur `gardenBeds` (texte libre avec suggestions), filtre par zone + badge sur les cartes planches
- **A4 — Versioning des planches (undo/redo)** : historique navigable des créations/éditions/suppressions de planches avec boutons Annuler/Rétablir, persistance en lot via l'action `saveAllBeds` (reconcilie l'ensemble des planches : upsert + suppression des absentes)
- **B1 — Export rappels (.ics)** : module `ics.ts` génère un calendrier iCalendar (`GET /api/export/ics`) à partir des semis/repiquages/récoltes des plantations (dates effectives, sinon périodes type MM-DD des fiches plantes) ; bouton "Exporter le calendrier (.ics)" dans le dropdown données de la navbar
- **B2 — Widget météo** : endpoint `GET /api/weather` (proxy vers Open-Meteo, sans clé API) + composant `WeatherWidget` (température actuelle + prévisions 5 jours) avec bouton "Ma position" (géolocalisation), intégré dans l'onglet carte de `/garden` ; module partagé client-safe `$lib/weather.ts`
- **B4 — Recherche + tri** : liste des plantations (vue liste) — recherche texte, filtre par statut, tri (récent/date/planche/statut/date de semis) ; liste des plantes — sélecteur de tri (nom/famille/date de semis)
- **B5 — Mode sombre** : thème light/dark via `data-theme-mode` (`themes.ts`), composant `ThemeModeSwitcher` (🌙/☀️) dans la navbar, override CSS dark des surfaces/télétextes/contrôles dans `app.css` (palettes couleur conservées, fonds/ombres adaptés)
- **Tests** : nouveaux (rotation plan, récoltes, zones, saveAllBeds, ics, weather, theme mode) — total 274
- **Documentation** : README mis à jour (version 0.4.2-rc.1, décompte tests)

## v0.4.1

### Added
- **Favoris plantes** : table `plant_favorites` (user_id + plant_id, contrainte unique), étoile ★/☆ sur la fiche plante pour ajouter/retirer un favori, filtre "Favoris" dans la liste des plantes, indicateur d'étoile sur les cartes — isolé par utilisateur
- **Export/Import de données (JSON)** : bouton données dans la navbar (icône ⇄, visible si connecté) — exporte les planches + plantations + photos + favoris de l'utilisateur (`GET /api/export` télécharge un fichier JSON), import récréant tout pour l'utilisateur courant (`POST /api/import`) avec reliaison des favoris vers les plantes existantes
- **Tests** : 8 nouveaux tests (5 favoris, 3 transfer) — total 251

### Fixed
- **LocaleSwitcher** : le dropdown ne s'ouvrait pas/ne se mettait pas à jour au clic. `current` est désormais initialisé via `getLocale()` (lecture directe de localStorage au mount, comme ThemeSwitcher) au lieu d'un `$effect` retardé — supprime le mismatch SSR/client d'hydratation

### Documentation
- `SPECS.md` : auth corrigé (multi-user), section "Later Iterations (v0.2.5 — v0.4.0)" ajoutée
- `README.md` : version bump + décompte tests

## v0.4.0

### Added
- **Multi-user** : table `users` avec hash bcrypt-like (scrypt natif Node.js), table `sessions` avec token aléatoire
- **Page d'inscription** (`/register`) : création de compte avec username + password (min 3/6 caractères)
- **Login** : username + password (plus de password global), session persistée 1 an
- **Logout** : bouton dans la navbar, suppression de session côté serveur
- **Isolement des données** : `userId` ajouté sur `gardenBeds`, `plantations`, `notifications`, `gardenPhotos` — chaque utilisateur ne voit que ses données
- **Migration automatique** : les données existantes sont associées à l'utilisateur admin (id=1) créé par la migration

### Changed
- `hooks.server.ts` : vérification session via DB, `event.locals.user` disponible partout
- `getRotationAlerts()` accepte un `userId` optionnel pour filtrer les alertes par utilisateur
- Tous les `load` et `actions` serveur filtrent par `userId`
- Tests mis à jour : création d'un user test dans `beforeAll`, `userId` sur tous les inserts

## v0.3.0

### Added
- **Internationalisation (i18n)** : système sans dépendance, fichiers JSON hiérarchiques (`en.json`, `fr.json`), clés par page, pluriels en objet `{one, other}`
- **Fonction `t(path, params?)`** : résolution réactive via `localeStore` (Svelte writable), fallback anglais, interpolation `{param}`, support pluriel via `count`
- **Composant `LocaleSwitcher.svelte`** : sélecteur EN/FR/DE/PT dans la navbar, stockage localStorage, dropdown avec texte (pas de drapeaux)
- **Traductions françaises complètes** : toutes les pages (dashboard, jardin, plantations, plantes, login), composants (LogPanel, NotificationBell), statuts, expositions, sols, arrosage
- **Intégration `t()`** : layout navbar, dashboard, garden (planches + onboard), plantations (liste + calendrier + formulaire), plantes (liste + détail + formulaire), login, LogPanel, NotificationBell

### Changed
- `+layout.svelte` : liens nav traduisibles, LocaleSwitcher ajouté à droite du ThemeSwitcher
- `AGENTS.md` : section i18n ajoutée, mise à jour commandes, suppression itérations (dans CHANGELOG)
- `types.ts` : `STATUS_LABELS`, `EXPOSURE_LABELS`, `SOIL_LABELS`, `WATERING_LABELS` dépréciés en faveur de `t('status.*')`, `t('exposure.*')`, etc.

## v0.2.9

### Added
- **Système de thèmes** : 4 thèmes (Teal, Green, Earth, Slate) avec sélecteur palette dans la navbar, stockage localStorage, CSS variables
- **Composant `ThemeSwitcher.svelte`** : icône palette avec tooltip au hover, dropdown avec cercle couleur + nom + tooltip description
- **Tests themes** : 12 tests pour `themes.ts` (structure, loadTheme, saveTheme, applyTheme) — total 132 tests

### Fixed
- **Dropdown theme** : texte invisible (blanc sur blanc) à cause de l'héritage `text-white` de la navbar — corrigé avec `text-gray-700`
- **Filtrage par type** : `GridCanvas` n'affiche que les planches `pixel`, `LeafletMap` n'affiche que les planches `geo` (les planches pixel n'étaient plus interprétées comme des coordonnées GPS sur la carte OSM)
- **Rendu visuel de la grille** : traits plus fins (0.8px/1.2px), couleurs plus neutres (`#d8e0d0`/`#c8d8b8`)
- **Remplissage des planches** : marron terre (`#d4c5a9`) au lieu de la couleur de la planche en transparence
- **Bordures des planches** : 2px au lieu de 3px

### Changed
- `GridCanvas` et `LeafletMap` ajoutent `type` dans le type des props
- Couleurs des composants (nav, boutons, toasts, badges, barres) passées en CSS variables pour support des thèmes

## v0.2.8

### Added
- **Grid Canvas** : composant `GridCanvas.svelte` remplace le canvas photo
  - Fond vert pâle quadrillé (1 carreau = 1m) quand pas de photo
  - Fond photo satellite quand disponible (onglet Plan fusionné)
  - Zoom molette et pan glisser-déposer
  - Barre d'échelle dynamique
- **Tab Plan** fusionné avec l'upload photo (visible via toggle)

### Changed
- `garden/+page.svelte` : onglets Plan + Carte OSM, plus de canvas inline
- Dessin de planches fonctionne sur grille ou photo

## v0.2.7

### Changed
- **N+1 rotation** : `getRotationAlerts()` charge toutes les histoires en 1 requête au lieu d'une par planche
- **Index `is_read`** sur `notifications` + migration
- **Pragmas SQLite** : `busy_timeout = 5000` + `journal_size_limit = 4194304`
- **`tiktoken` supprimé** des dépendances (dead weight 1.5MB)
- **Types `any` supprimés** : LeafletMap utilise `@types/leaflet`, les enhance handlers utilisent `SubmitFunction`
- **Types dupliqués** : `LogEntry` importé de `logger.ts`, `AppNotification` importé de `notifications.ts`
- **Utils mutualisées** : `$lib/utils.ts` avec `monthsInRange`, `firstPhoto`, `serializeCommaSeparated`
- **Composant `Modal.svelte`** réutilisable, utilisé dans garden, plantations, plants
- **Labels centralisés** dans `types.ts` : `EXPOSURE_LABELS`, `SOIL_LABELS`, `WATERING_LABELS`
- **Tests utils** : 18 tests (firstPhoto, monthsInRange, serializeCommaSeparated)
- Total : 123 tests (+22 depuis v0.2.6)

## v0.2.5

### Fixed
- **Antagonistes plantes** : remplace le lookup par nom exact par une correspondance floue (`startsWith`) — "Chou" trouve maintenant "Chou cabus" au lieu d'être silencieusement ignoré
- **Upload photo satellite** : ajout de `invalidate('app:garden')` dans le callback `use:enhance` — le sélecteur de photo s'affiche immédiatement après upload sans refresh manuel
- **Filtres plantes** : remplace `goto()` par un filtrage client réactif (`$derived`) — plus de perte de l'état "Show more" au changement de filtre
- **Plant name auto-rempli** : un `$effect` synchronise le champ "Plant name" avec la sélection du menu déroulant des plantes dans le formulaire de plantations
- **Canvas zone vide** : affiche un message d'invite "Upload a satellite photo above" quand aucune photo n'est sélectionnée
- **Stats avancées** : la section est masquée quand toutes les valeurs sont à zéro (aucune donnée)

## v0.2.4

### Added
- **Pagination plantations** : `PAGE_SIZE=30` avec bouton "Show more" dans la vue liste — seules 30 plantations sont rendues au chargement initial, le calendrier conserve toutes les données
- **Canvas double buffer** : utilisation d'un OffscreenCanvas pour le fond (image satellite + toutes les planches), redessiné uniquement au changement d'image ou des planches ; l'overlay (polygone en cours) est redessiné seul à chaque clic — gain de perfs notable pendant le dessin de polygones

## v0.2.3

### Added
- **Notifications** : cloche 🔔 dans la barre de navigation avec badge de compteur, dropdown des 20 dernières, marquage individuel ou tout lu, persistance en base
- **Types** : `sowing` (semis à venir), `harvest` (récolte), `rotation` (alerte rotation), `stale` (plantation planifiée depuis >14j sans action)
- **API** : `GET /api/notifications` (génération + liste), `POST /api/notifications/[id]/read`, `POST /api/notifications/read-all`
- **Tests** : 4 tests (insertion, contrainte unique, marquage lu, limite 20) — total passe à 58

### Fixed
- **LogPanel** : suppression du `$effect` dupliqué (2 appels `fetchLogs()` au mount), clé unique sur les entrées de logs

## v0.2.2

### Added
- **Resize images uploadées** : les photos (jardin + plantes) sont converties en WebP (quality 80) et redimensionnées à 1600×1200 max via `sharp` — gain de bande passante et disque
- **Cache headers** : `Cache-Control: public, max-age=86400, immutable` sur les fichiers dans `/uploads/`
- **Tests** : 5 nouveaux tests (cache headers + resize sharp) — total passe à 54

## v0.2.1

### Added
- **Statistiques avancées** : taux de réussite, durée cycle moyenne, histogramme plantations/mois, distribution par famille botanique, utilisation des planches par année

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
