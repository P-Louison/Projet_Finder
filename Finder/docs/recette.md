# Recette Finder

## Tests d'acceptation TA-001 a TA-010 (§10.2)

| ID | Scénario d'acceptation | Date | Résultat | Déroulé par |
|---|---|---|---|---|
| TA-001 | Un voyageur s'inscrit avec un email valide et est connecté dans la foulée (inscription directe, aucune étape de validation externe). | 2026-10-12 | **ÉCHEC** — Inscription HTTP 201, mais la réponse ne contient pas de JWT ; le voyageur n'est pas connecté dans la foulée. | Louison
| TA-002 | Un voyageur ne peut pas s'inscrire 2 fois avec le même email (409). | 2026-10-12 | **RÉUSSI** — La seconde inscription renvoie HTTP 409. | Louison
| TA-003 | Un voyageur se connecte et reçoit un JWT valide ; un mot de passe < 8 caractères est refusé à l'inscription avec un message clair. | 2026-10-12 | **ÉCHEC** — La connexion renvoie un JWT, mais une inscription avec un mot de passe de 7 caractères est acceptée (HTTP 201), puis la connexion réussit (HTTP 200). | Louison
| TA-004 | La recherche par dates renvoie uniquement les chambres libres sur la période demandée. | 2026-10-12 | **RÉUSSI** — Sur le kit, `GET /chambres?date_debut=2026-10-10&date_fin=2026-10-12` renvoie 31 chambres sans l'id 4 ; `GET /chambres?date_debut=2026-10-11&date_fin=2026-10-13` renvoie 32 chambres avec l'id 4. L'inversion des comparateurs de chevauchement fait échouer ce test (32 au lieu de 31) ; comparateurs restaurés, le test repasse. | Louison |
| TA-005 | Un voyageur réserve une chambre : la réservation apparaît en_attente côté hôtelier. | 2026-10-12 | **RÉUSSI** — La réservation créée en `en_attente` apparaît dans la liste reçue par l'hôtelier concerné. | Louison
| TA-006 | L'hôtelier confirme (ou refuse) : le voyageur lit le nouveau statut dans « Mes réservations ». | 2026-10-12 | **RÉUSSI** — Après confirmation par l'hôtelier, le statut `confirmee` apparaît dans les réservations du voyageur | Louison
| TA-007 | Le voyageur annule sa réservation : statut annulee, la chambre redevient réservable sur la période. | 2026-10-12 | **RÉUSSI** — L'annulation renvoie le statut `annulee` et la chambre réapparaît dans la recherche pour la période. | Louison
| TA-008 | Un voyageur ne peut PAS modifier la chambre d'un hôtelier (403 Forbidden). | 2026-10-12 | **RÉUSSI** — La tentative de modification par un voyageur renvoie HTTP 403. | Louison
| TA-009 | Un hôtelier ne voit que les réservations de SON hôtel (jamais celles de l'Amor s'il gère le Byzance). | 2026-10-12 | **RÉUSSI** — La liste du second hôtelier ne contient que des chambres de son hôtel et exclut la réservation créée pour le premier hôtel. | Louison
| TA-010 | L'endpoint /health renvoie 200 quand tout va bien. | 2026-10-12 | **RÉUSSI** — `/health` renvoie HTTP 200 et `{"ok":true}`. | Louison
