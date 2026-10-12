# docs/spec.md -- gabarit de depart, a completer au fil des etapes
# [ ] etape non franchie (normal en cours de route) [~] verification partielle ou bloquee NON MESURABLE : on ne peut pas trancher, a compter a part
# Spec Finder - Sprint 1 [MINIMAL]
equipe : ... Version : v2 du 2026-10-12
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
## etapes 2 a 8
[x] E2 Base MySQL via Prisma : schema, migrations et seed du kit ; les tests accedent aux tables.
[x] E3 Recherche de chambres disponibles -> GET /chambres filtre les criteres, dont les dates.
[x] E4 Inscription, connexion JWT 24 h et ecritures protegees -> jeton et roles verifies par les tests.
[x] E5 Validation Zod [ACCEPTABLE] -> les corps invalides testes renvoient 400.
[x] E6 Reservations et statuts -> creation, transitions et annulation testes.
[x] E7 Documentation Swagger -> les routes sont documentees et exposees par /docs.
[x] E8 Tests et recette -> npm test passe (43 tests le 2026-10-12) ; TA-001 a TA-010 deroules et consignes dans docs/recette.md (2 echecs).
[x] E9 API répartie en modules -> client Prisma, middlewares, schémas et routeurs séparés ; app.js branche les routeurs
## Gardes
[~] Aucun secret dans le depot : .env est dans .gitignore
[~] Aucune route ne repond 500 sur un id inconnu ou mal forme
[~] Toute erreur a un corps JSON de la même forme : { "erreur": "..." }
## Non mesurable
NON MESURABLE Temps de reponse de la recherche : pas de jeu de donnees assez grand pour trancher

## Journal
- 2026-10-12 : E2-E8 verifies ; 43 tests automatises passent, TA-001 a TA-010 deroules, avec les echecs TA-001 et TA-003 consignes dans docs/recette.md. E9 ajoute ensuite pour la separation de l'API en modules.
- 2026-10-12 : TA-004 consolide sur le kit : 31 chambres sans l'id 4 du 10 au 12 octobre, puis 32 avec l'id 4 du 11 au 13. Le test echoue avec les comparateurs de chevauchement inverses, puis repasse apres restauration ; details dans docs/recette.md.