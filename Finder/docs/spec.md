# docs/spec.md -- gabarit de depart, a completer au fil des etapes
# [ ] etape non franchie (normal en cours de route) [~] garde : ne doit jamais être faux NON MESURABLE : on ne peut pas trancher, a compter a part
# Spec Finder - Sprint 1 [MINIMAL]
equipe : ... Version : v1 du AAAA-MM-JJ (etape 1)
Regle : relue au debut de chaque seance ; chaque amendement est date dans le journal.
## etape 1 - en memoire
[ ] npm run dev demarre sans erreur -> le terminal affiche l'adresse du serveur
[ ] GET /health -> 200, {"ok":true}
[ ] Kit charge une seule fois au demarrage -> readFileSync hors des routes
[ ] GET /hotels -> 200, tableau de 3 hotels
[ ] GET /hotels/:id -> 200 la fiche, ou 404 avec corps JSON
[ ] GET /chambres -> 200, tableau de 32 chambres
[ ] GET /chambres/:id -> 200 la fiche, ou 404 avec corps JSON
[ ] req.params.id converti avec Number() -> /hotels/1 repond 200, /hotels/abc repond 404
[ ] .env avec PORT et DATABASE_URL -> le fichier existe, il n'est pas commite
[ ] README.md et api/.env.example -> un camarade demarre sans poser de question
[ ] GET /chambres?prix_max=89 -> 200, 12 chambres ; sans critere, 32
## etapes 2 a 8 - declarees, non franchies
[ ] E2 Base MySQL via Prisma : schema, migration, seed du kit -> tables visibles dans Adminer
[ ] E3 Recherche de chambres disponibles -> GET /chambres?... filtre
[ ] E4 Inscription, connexion JWT 24 h, ecritures protegees -> sans jeton 401, mauvais role 403
[ ] E5 Validation Zod [ACCEPTABLE] -> corps invalide 400, jamais 500
[ ] E6 Reservations et statuts -> en_attente, confirmee, refusee, annulee
[ ] E7 Documentation Swagger de toutes les routes -> /docs les affiche toutes
[ ] E8 Tests et recette -> npm test passe, TA-001 a TA-010
## Gardes
[~] Aucun secret dans le depot : .env est dans .gitignore
[~] Aucune route ne repond 500 sur un id inconnu ou mal forme
[~] Toute erreur a un corps JSON de la même forme : { "erreur": "..." }
## Non mesurable
NON MESURABLE Temps de reponse de la recherche : pas de jeu de donnees assez grand pour trancher