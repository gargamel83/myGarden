# Multi-utilisateur — Plan

## Approche A (recommandée) — Une base avec colonne `userId`

Ajouter `userId` à `garden_beds`, `plantations`, `garden_photos`. Table `users` + `sessions` dans la même base. `plants` reste partagée (lecture seule commune).

### Fichiers à modifier
- `src/lib/server/db/schema.ts` — + colonnes userId, tables users/sessions
- `src/hooks.server.ts` — auth via DB (session token)
- `src/routes/login/+page.server.ts` — register + login + logout
- `src/routes/login/+page.svelte` — formulaire register, bouton logout
- `src/routes/garden/+page.server.ts` — filtre userId
- `src/routes/plantations/+page.server.ts` — filtre userId
- `src/routes/+page.server.ts` — filtre userId
- `src/routes/+layout.svelte` — bouton logout dans nav
- `src/lib/server/rotation.ts` — filtre userId

### Migration
```bash
npx drizzle-kit generate && npx drizzle-kit push
```

### Auth
- `bcrypt` ou `scrypt` Node pour le hash
- Sessions stockées en DB (token + userId + expiresAt)
- Cookie `session` httponly, vérifié dans hooks

---

## Approche B — Une base fichier par utilisateur

```
data/
  monjardin-meta.db       ← users, sessions
  users/{uuid}/
    monjardin.db          ← garden_beds, plantations, garden_photos, plants
```

Connexion dynamique : `getUserDb(userId)` au lieu du singleton global. Migration + seed exécutés à la création de chaque user.

### Complexité supplémentaire
- `db/index.ts` — remplacer singleton par factory
- `seed.ts` — pouvoir seeder un userId donné
- `scripts/migrate.js` — migrer une base arbitraire
- Plus de connexions SQLite simultanées
- Backup = tout le dossier `data/`
