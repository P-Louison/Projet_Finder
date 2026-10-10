/**
 * @openapi
 * /voyageurs:
 *   get:
 *     tags: [Voyageurs]
 *     summary: Lister les voyageurs (réservé aux administrateurs)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Liste des voyageurs }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux administrateurs }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Système]
 *     summary: Vérifier que le serveur fonctionne
 *     responses:
 *       '200': { description: Serveur disponible }
 */

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentification]
 *     summary: Créer un compte voyageur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse, nom, prenom]
 *             properties:
 *               email: { type: string, format: email, example: voyageur@example.com }
 *               motDePasse: { type: string, minLength: 6, example: secret123 }
 *               nom: { type: string, example: Morel }
 *               prenom: { type: string, example: Anaïs }
 *               telephone: { type: string, nullable: true, example: "06 11 22 33 44" }
 *     responses:
 *       '201': { description: Compte créé }
 *       '400': { description: Corps JSON invalide }
 *       '409': { description: Adresse e-mail déjà utilisée }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentification]
 *     summary: Se connecter et obtenir un jeton JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse]
 *             properties:
 *               email: { type: string, format: email, example: voyageur@example.com }
 *               motDePasse: { type: string, example: secret123 }
 *     responses:
 *       '200': { description: Connexion réussie avec token et compte }
 *       '400': { description: Corps JSON invalide }
 *       '401': { description: E-mail ou mot de passe incorrect }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentification]
 *     summary: Terminer la session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '204': { description: Déconnexion effectuée }
 *       '401': { description: Jeton absent ou invalide }
 */

/**
 * @openapi
 * /voyageurs/me:
 *   get:
 *     tags: [Voyageurs]
 *     summary: Consulter mon profil
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Profil retourné }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux voyageurs }
 *       '404': { description: Voyageur introuvable }
 */

/**
 * @openapi
 * /voyageurs/me:
 *   patch:
 *     tags: [Voyageurs]
 *     summary: Modifier mon profil
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               nom: { type: string, example: Morel }
 *               prenom: { type: string, example: Anaïs }
 *               telephone: { type: string, nullable: true, example: "06 11 22 33 44" }
 *     responses:
 *       '200': { description: Profil modifié }
 *       '400': { description: Corps invalide }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux voyageurs }
 */

/**
 * @openapi
 * /hotels:
 *   get:
 *     tags: [Hotels]
 *     summary: Lister les hôtels et leurs chambres
 *     responses:
 *       '200': { description: Liste des hôtels }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /hotels/{id}:
 *   get:
 *     tags: [Hotels]
 *     summary: Consulter un hôtel et ses chambres
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Hôtel trouvé }
 *       '404': { description: Hôtel introuvable }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /hotels/{id}/chambres:
 *   get:
 *     tags: [Hotels]
 *     summary: Lister les chambres d'un hôtel
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Chambres de l'hôtel }
 *       '403': { description: Hôtel introuvable }
 *       '404': { description: Identifiant invalide }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /chambres/{id}:
 *   get:
 *     tags: [Chambres]
 *     summary: Consulter une chambre
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Chambre trouvée }
 *       '404': { description: Chambre introuvable }
 */

/**
 * @openapi
 * /chambres:
 *   post:
 *     tags: [Chambres]
 *     summary: Créer une chambre dans mon hôtel
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [numero, categorie, capacite, description, disponible, prixNuit]
 *             properties:
 *               numero: { type: integer, example: 301 }
 *               categorie: { type: string, example: double }
 *               capacite: { type: integer, example: 2 }
 *               prixNuit: { type: integer, example: 99 }
 *               description: { type: string, example: Chambre double avec vue sur le jardin }
 *               disponible: { type: boolean, example: true }
 *     responses:
 *       '201': { description: Chambre créée }
 *       '400': { description: Corps invalide }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux hôteliers }
 *       '409': { description: Numéro déjà utilisé dans cet hôtel }
 */

/**
 * @openapi
 * /chambres/{id}:
 *   patch:
 *     tags: [Chambres]
 *     summary: Modifier une chambre de mon hôtel
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               numero: { type: integer, example: 301 }
 *               categorie: { type: string, example: double }
 *               capacite: { type: integer, example: 2 }
 *               prixNuit: { type: integer, example: 99 }
 *               description: { type: string, example: Chambre rénovée }
 *               disponible: { type: boolean, example: true }
 *     responses:
 *       '200': { description: Chambre modifiée }
 *       '400': { description: Corps invalide }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Chambre hors de mon hôtel }
 */

/**
 * @openapi
 * /chambres/{id}:
 *   delete:
 *     tags: [Chambres]
 *     summary: Supprimer une chambre de mon hôtel
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '204': { description: Chambre supprimée }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Chambre hors de mon hôtel }
 */

/**
 * @openapi
 * /chambres:
 *   get:
 *     tags: [Chambres]
 *     summary: Rechercher des chambres
 *     parameters:
 *       - in: query
 *         name: hotel_id
 *         required: false
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: date_debut
 *         required: false
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: date_fin
 *         required: false
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: capacite
 *         required: false
 *         schema: { type: integer, minimum: 1 }
 *       - in: query
 *         name: prix_max
 *         required: false
 *         schema: { type: number, exclusiveMinimum: 0 }
 *       - in: query
 *         name: categorie
 *         required: false
 *         schema: { type: string, enum: [simple, double, familiale, suite] }
 *     responses:
 *       '200': { description: Chambres correspondant aux critères }
 *       '400': { description: Critères invalides }
 */

/**
 * @openapi
 * /reservations:
 *   post:
 *     tags: [Réservations]
 *     summary: Créer une réservation pour le voyageur connecté
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [chambre_id, date_arrivee, date_depart, nb_personne, statut]
 *             properties:
 *               chambre_id:
 *                 type: integer
 *                 minimum: 1
 *                 example: 9
 *               date_arrivee:
 *                 type: string
 *                 format: date-time
 *                 example: "2027-04-01T15:00:00.000Z"
 *               date_depart:
 *                 type: string
 *                 format: date-time
 *                 example: "2027-04-03T11:00:00.000Z"
 *               nb_personne:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *               statut:
 *                 type: string
 *                 enum: [en_attente, confirmee, annulee, refusee]
 *                 example: en_attente
 *               demande_special:
 *                 type: string
 *                 maxLength: 200
 *                 example: Chambre calme si possible
 *     responses:
 *       '201': { description: Réservation créée }
 *       '400': { description: Corps invalide }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux voyageurs }
 */

/**
 * @openapi
 * /reservations/mine:
 *   get:
 *     tags: [Réservations]
 *     summary: Lister mes réservations
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Réservations du voyageur connecté }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux voyageurs }
 */

/**
 * @openapi
 * /reservations/received:
 *   get:
 *     tags: [Réservations]
 *     summary: Lister les réservations de mon hôtel
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '200': { description: Réservations des chambres de l'hôtel connecté }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservé aux hôteliers }
 */

/**
 * @openapi
 * /reservations/{id}:
 *   patch:
 *     tags: [Réservations]
 *     summary: Modifier une réservation de mon hôtel
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               chambre_id: { type: integer }
 *               date_arrivee: { type: string, format: date-time }
 *               date_depart: { type: string, format: date-time }
 *               nb_personne: { type: integer }
 *               statut: { type: string, enum: [en_attente, confirmee, annulee, refusee] }
 *               demande_special: { type: string, maxLength: 200 }
 *     responses:
 *       '200': { description: Réservation modifiée }
 *       '400': { description: Corps ou transition de statut invalide }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservation hors de mon hôtel }
 *       '404': { description: Réservation introuvable }
 */

/**
 * @openapi
 * /reservations/{id}:
 *   delete:
 *     tags: [Réservations]
 *     summary: Annuler ma réservation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Réservation annulée }
 *       '400': { description: Annulation interdite pour ce statut }
 *       '401': { description: Jeton absent ou invalide }
 *       '403': { description: Réservation appartenant à un autre voyageur }
 *       '404': { description: Réservation introuvable }
 */

/**
 * @openapi
 * /comptes:
 *   get:
 *     tags: [Comptes]
 *     summary: Lister les comptes
 *     responses:
 *       '200': { description: Liste des comptes }
 *       '500': { description: Erreur interne }
 */

/**
 * @openapi
 * /comptes/{id}:
 *   get:
 *     tags: [Comptes]
 *     summary: Consulter un compte
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer, minimum: 1 }
 *     responses:
 *       '200': { description: Compte trouvé }
 *       '404': { description: Compte introuvable }
 *       '500': { description: Erreur interne }
 */
