# Cahier des charges — MonJardin

Application web de gestion de jardin potager.

## Stack technique
- **Frontend/Backend** : SvelteKit (TypeScript)
- **Base de données** : SQLite via Drizzle ORM
- **CSS** : Tailwind CSS
- **Carte interactive** : Leaflet (OSM)
- **Dessin polygones** : Canvas/SVG
- **Authentification** : Mono-utilisateur, mot de passe dans `.env`
- **Déploiement** : Docker

---

## Modules

### 1. Organisation du jardin
- Upload d'une photo satellite (ou plan du jardin)
- Dessin de polygones (bandes de culture) sur l'image
- Chaque bande a : nom, dimensions, orientation, type de sol
- Alternativement : sélection d'une parcelle via carte OSM (Leaflet)
- Vue d'ensemble du jardin avec les bandes

### 2. Gestion des plantations
- CRUD plantations liées à une bande
- Cycles : semis → repiquage → récolte (dates, statuts)
- Calendrier / timeline des opérations
- Historique par bande (rotation visible)

### 3. Base de connaissance plantes
- Fiches pré-remplies (58 légumes, aromatiques et fleurs comestibles)
- Champs : période de semis/repiquage/récolte, exposition, sol, climat, distance plantation, compagnonnage
- Galerie photos (maladies, stades de croissance)
- Conseils individualisés selon la bande (sol, exposition)
- Recherche et filtres

### 4. Rotation des cultures
- Suggestions de rotation basées sur l'historique des bandes
- Familles botaniques, précédents culturaux
- Alertes si une rotation est trop courte

### 5. Dashboard / Suivi
- Vue d'ensemble de la saison
- Alertes : rotation, plantations actives

---

## Environnement de développement

### Session en cours
- **Date** : 9 juin 2026
- **Agent** : opencode CLI (outil de codage assisté par IA)
- **Modèle** : big-pickle (opencode/big-pickle)
- **OS** : Linux
- **Shell** : zsh

### Outils à disposition de l'agent
- `read` / `write` / `edit` — manipulation de fichiers
- `glob` — recherche par motifs de fichiers
- `grep` — recherche dans le contenu des fichiers
- `bash` — exécution de commandes shell
- `task` — délégation de sous-tâches à des sous-agents
- `websearch` / `webfetch` — recherche et récupération d'info web
- `question` — poser des questions à l'utilisateur
- `todowrite` — suivi structuré des tâches

### Règles actives
- Toujours relire le fichier avant de l'éditer
- Utiliser `svelte-check` après modification (`npm run check` ou `npx svelte-check`)
- Schéma DB : modifier → `npx drizzle-kit generate` → `npx drizzle-kit push`
- Commits uniquement sur demande explicite
- Pas de documentation proactive (`.md`) sauf demande
- Langue : français avec l'utilisateur (qui parle français)
- Concis, réponse < 4 lignes sauf demande de détail

### Dépendances / versions (au 9 juin 2026)
```json
{
  "svelte": "^5.56",
  "@sveltejs/kit": "^2.63",
  "drizzle-orm": "^0.45",
  "better-sqlite3": "^12.10",
  "tailwindcss": "^4.3",
  "leaflet": "^1.9",
  "drizzle-kit": "^0.31"
}
```
- Runtime : Node.js (version du système hôte)
- Base de données : SQLite fichier unique `data/monjardin.db`
