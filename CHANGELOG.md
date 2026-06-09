# Changelog

## Unreleased

### Added

- Authentification mono-utilisateur (mot de passe `.env`, cookie session)
- Upload photo satellite + dessin de polygones (bandes de culture)
- CRUD bandes : nom, couleur, type de sol, exposition, dimensions, orientation
- CRUD plantations liées à une bande, cycles semis → repiquage → récolte
- Carte OSM interactive (Leaflet) : dessin polygones, géocodage Nominatim, géolocalisation avec fallback précision
- Dashboard : stats, plantations actives, alertes semis/récolte/rotation
- Base de connaissance : 58 fiches plantes pré-remplies (périodes, sol, compagnonnage, photos Wikimedia)
- Moteur de rotation : suggestions, alertes, historique par bande
- Page liste plantes : recherche, filtres, barre repiquage, miniatures photos
- Page détail plante : compagnons/antagonistes, périodes visuelles, galerie photos réordonnable
- Vue calendrier/timeline des plantations
- Statut auto-déduit des dates (sans écraser les existantes), bouton Modifier
- Toast notifications, dialogues de confirmation, animation de fondu
- Navigation responsive avec menu hamburger, persistance onglet jardin
- Logger applicatif (console dev, fichiers persistants Docker)
- Migration automatique au démarrage Docker, réconciliation si tables existantes
- Dockerfile + docker-compose, data directory versionné
- README, CHANGELOG, SPECS, AGENTS
