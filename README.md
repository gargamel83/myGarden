# MonJardin

Application web de gestion de jardin potager — bandes de culture, plantations, rotation des cultures, base de connaissance plantes.

---

## Cahier des charges

### Modules

| Module | Description |
|---|---|
| **Organisation du jardin** | Upload photo satellite ou carte OSM interactive ; dessin de polygones (bandes) ; chaque bande a : nom, dimensions, orientation, type de sol, exposition |
| **Gestion des plantations** | CRUD lié à une bande ; cycles semis → repiquage → récolte ; calendrier visuel ; historique par bande |
| **Base de connaissance plantes** | 58 fiches pré-remplies (périodes, exposition, sol, compagnonnage, photos) ; recherche et filtres ; pages détail avec conseils |
| **Rotation des cultures** | Suggestions basées sur l'historique des bandes ; familles botaniques ; alertes si rotation trop courte |
| **Dashboard** | Vue d'ensemble saison ; alertes semis/récolte ; statistiques (bandes, plantations, fiches) |

### Stack

| Technologie | Usage |
|---|---|
| **SvelteKit 5** (TypeScript) | Framework full-stack |
| **Drizzle ORM** + **better-sqlite3** | Base de données SQLite |
| **Tailwind CSS v4** | Styles |
| **Leaflet** (OSM) | Carte interactive |
| **adapter-node** | Production |
| **Docker** | Déploiement |

---

## Lancement

### Développement local

**Pré-requis :**
- Node.js 24+
- npm

```bash
# 1. Installer les dépendances
npm install

# 2. Copier et configurer le mot de passe
cp .env.example .env   # puis éditer LOGIN_PASSWORD=mon_mot_de_passe
#   → Si .env absent ou LOGIN_PASSWORD vide, l'authentification est désactivée (mode dev)

# 3. Appliquer les migrations
npx drizzle-kit push

# 4. (optionnel) Remplir la base avec les fiches plantes
npm run db:seed

#   → Ajoute les plantes manquantes sans toucher aux existantes
#   → `npm run db:seed:force` met à jour toutes les fiches existantes

# 5. Lancer le serveur de dev
npm run dev
```

Ouvrir [http://localhost:5173](http://localhost:5173).

### Production Docker

**Pré-requis :**
- Docker
- Docker Compose v2
- Node.js (pour lire la version depuis `package.json`)

```bash
# Lancer (build + up) — data directory versionné automatiquement
LOGIN_PASSWORD=mon_mdp ./scripts/docker-up.sh --build -d
#   → Par défaut : mot de passe "change_me" (docker-compose.yml)
#   → Si `LOGIN_PASSWORD=` est vide, l'authentification est désactivée

# Logs
docker compose logs -f

# Arrêter
docker compose down
```

Ouvrir [http://localhost:3000](http://localhost:3000).

> **Note isolation :** Docker utilise un data directory versionné (`data-docker-v0.0.1/`) pour ne pas interférer avec la BDD de développement local (`data/`). Changer la version dans `package.json` crée une nouvelle BDD isolée. Voir `./scripts/docker-up.sh`.

---

## Debug

### Logs applicatifs

En local (dev), les logs sont écrits uniquement sur **stdout** — pas de fichiers.

En Docker, les logs sont écrits dans `./data-docker-vX.X.X/logs/` sur l'hôte (persistant via le volume) :

```bash
# Voir les logs en temps réel
docker compose logs -f

# Accéder aux fichiers persistants
tail -f data-docker-v*/logs/app.log
tail -f data-docker-v*/logs/error.log
```

Le dossier de logs est configurable via la variable d'environnement `LOG_DIR` (défaut : `/app/data/logs`).

### Erreurs courantes

| Symptôme | Cause | Solution |
|---|---|---|
| `SQLITE_ERROR: no such table` | Migrations non appliquées | `npx drizzle-kit push` |
| `LOGIN_PASSWORD` non défini | Pas de `.env` ou LOGIN_PASSWORD manquant | Créer `.env` avec `LOGIN_PASSWORD=xxx` ; si vide → pas d'auth (dev) |
| `readonly database` | Fichier DB appartient à root (Docker) | `sudo chown -R $(whoami) data-docker-v*/` |
| Port déjà utilisé | Un autre service écoute sur 3000/5173 | `lsof -i :3000` puis `kill` |
| Plantation non trouvée | Bande supprimée mais plantations orphelines | Vérifier en base avec `npx drizzle-kit studio` |

### Vérifications rapides

```bash
# Lint / type check
npm run check

# Build
npm run build

# Test du conteneur
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
# Réponse attendue : 302 (redirigé vers /login)
```

---

## Cycle de mise à jour

### Ajouter / mettre à jour des plantes

Les fiches sont dans `src/lib/server/db/seed.ts`.

```bash
# Ajouter les nouvelles plantes uniquement (additif)
npm run db:seed

# Forcer la mise à jour de toutes les fiches (photos, champs modifiés…)
npm run db:seed:force
```

Pour ajouter des champs à la fiche :

```bash
# 1. Modifier le schéma dans schema.ts
# 2. Générer la migration
npx drizzle-kit generate
# 3. Appliquer
npx drizzle-kit push
# 4. Mettre à jour seed.ts avec la nouvelle colonne
# 5. Re-seeder en force
npm run db:seed:force
```

### Améliorer le site

1. **Modifier le code** — l'application se rebuild automatiquement en dev (`npm run dev`)
2. **Migrer la base** — après un changement de schéma (voir ci-dessus)
3. **Tester** — `npm run check && npm run build`
4. **Déployer en Docker** :

```bash
./scripts/docker-up.sh --build -d   # rebuild + up avec la bonne version
```

Les données persistent dans `./data-docker-vX.X.X/monjardin.db` (data directory versionné).

### Structure des migrations

```
drizzle/
  0000_xxx.sql        # Migration initiale
  0001_xxx.sql        # Ajout champ type (pixel/geo)
  0002_xxx.sql        # Ajout dimensions/orientation
  0003_xxx.sql        # Ajout floweringStart/floweringEnd
```

Les migrations sont appliquées automatiquement au démarrage du conteneur Docker via `scripts/migrate.js`.  
Si les tables existent déjà (base préexistante), le script réconcilie la table de suivi `__drizzle_migrations` et continue.

---

## Améliorations futures

*(Espace réservé — idées et priorités)*

- [ ] Conseils individualisés par bande (sol + exposition)
- [ ] Statistiques rendement / surface utilisée
- [ ] Notifications par email (semis, récolte)
- [ ] Mode hors-ligne / PWA
- [ ] Export CSV des plantations
- [ ] Multi-utilisateurs
- [ ] API publique
