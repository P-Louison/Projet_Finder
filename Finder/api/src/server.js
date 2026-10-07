import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  SchemaConnexionUtilisateur,
  SchemaCreationChambre,
  SchemaInscriptionUtilisateur,
  SchemaModificationChambre,
  SchemaModificationVoyageur,
  SchemaRechercheChambre,
  SchemaCreationReservation,
  SchemaModificationReservations,
} from "./schema.js";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env") });

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

const comptePublic = ({ motDePasse, ...compte }) => compte;

const validerCorps = (schema) => (req, res, next) => {
  const resultat = schema.safeParse(req.body);
  if (!resultat.success) {
    return res.status(400).json({
      erreur: "Corps de requete invalide",
      erreurs: resultat.error.issues,
    });
  }
  req.body = resultat.data;
  next();
};

const authRequis = (req, res, next) => {
  const authorization = req.headers.authorization;
  const [type, token] = authorization?.split(" ") ?? [];

  if (type !== "Bearer" || !token || !JWT_SECRET) {
    return res.status(401).json({ erreur: "Authentification requise" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: Number(payload.userId ?? payload.sub),
      hotelId: payload.hotelId ?? payload.hotel_id ?? null,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ erreur: "Jeton invalide ou expire" });
  }
};

const exigeRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user?.userId || !roles.includes(req.user.role)) {
      return res.status(403).json({ erreur: "Role non autorise" });
    }
    next();
  };

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Système]
 *     summary: Vérifier que le serveur fonctionne
 *     responses:
 *       '200': { description: Serveur disponible }
 */
app.get("/health", (req, res) => res.json({ ok: true }));

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
app.post(
  "/auth/register",
  validerCorps(SchemaInscriptionUtilisateur),
  async (req, res, next) => {
    const { email, motDePasse, nom, prenom, telephone } = req.body ?? {};
    if (!email || !motDePasse || !nom || !prenom) {
      return res
        .status(400)
        .json({ erreur: "email, motDePasse, nom et prenom sont requis" });
    }

    try {
      const compteExistant = await prisma.comptes.findFirst({
        where: { email },
      });
      if (compteExistant)
        return res.status(409).json({ erreur: "Email deja utilise" });

      const compte = await prisma.comptes.create({
        data: {
          email,
          motDePasse: await bcrypt.hash(motDePasse, 12),
          role: "voyageur",
          nom,
          prenom,
          telephone: telephone ?? null,
        },
      });
      res.status(201).json(comptePublic(compte));
    } catch (error) {
      next(error);
    }
  },
);

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
app.post(
  "/auth/login",
  validerCorps(SchemaConnexionUtilisateur),
  async (req, res, next) => {
    const { email, motDePasse } = req.body ?? {};
    if (!email || !motDePasse) {
      return res
        .status(400)
        .json({ erreur: "email et motDePasse sont requis" });
    }

    try {
      const compte = await prisma.comptes.findFirst({ where: { email } });
      const motDePasseValide = compte
        ? await bcrypt.compare(motDePasse, compte.motDePasse)
        : false;
      if (!compte || !motDePasseValide || !JWT_SECRET) {
        return res
          .status(401)
          .json({ erreur: "Email ou mot de passe incorrect" });
      }

      const token = jwt.sign(
        {
          userId: compte.id,
          hotelId: compte.hotel_id,
          role: compte.role,
        },
        JWT_SECRET,
        { subject: String(compte.id), expiresIn: "24h" },
      );
      res.json({ token, compte: comptePublic(compte) });
    } catch (error) {
      next(error);
    }
  },
);

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
app.post("/auth/logout", authRequis, (req, res) => res.status(204).end());

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
app.get(
  "/voyageurs/me",
  authRequis,
  exigeRole("voyageur"),
  async (req, res, next) => {
    try {
      const compte = await prisma.comptes.findUnique({
        where: { id: req.user.userId },
        select: { nom: true, prenom: true, telephone: true },
      });
      if (!compte)
        return res.status(404).json({ erreur: "Voyageur introuvable" });
      res.json(compte);
    } catch (error) {
      next(error);
    }
  },
);

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
app.patch(
  "/voyageurs/me",
  authRequis,
  exigeRole("voyageur"),
  validerCorps(SchemaModificationVoyageur),
  async (req, res, next) => {
    try {
      const compte = await prisma.comptes.update({
        where: { id: req.user.userId },
        data: req.body,
        select: { nom: true, prenom: true, telephone: true },
      });
      res.json(compte);
    } catch (error) {
      next(error);
    }
  },
);

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
app.get("/hotels", async (req, res, next) => {
  try {
    res.json(await prisma.hotel.findMany({ include: { chambre: true } }));
  } catch (error) {
    next(error);
  }
});

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
app.get("/hotels/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: { chambre: true },
    });
    if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
    res.json(hotel);
  } catch (error) {
    next(error);
  }
});

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
app.get("/hotels/:id/chambres", async (req, res, next) => {
  const hotelId = Number(req.params.id);
  if (!Number.isInteger(hotelId) || hotelId < 1) {
    return res.status(404).json({ erreur: "Hotel introuvable" });
  }

  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) return res.status(403).json({ erreur: "Hotel introuvable" });

    const chambres = await prisma.chambre.findMany({
      where: { hotel_id: hotelId },
    });
    res.json(
      chambres.map(({ hotel_id, ...chambre }) => ({
        ...chambre,
        hotelId: hotel_id,
      })),
    );
  } catch (error) {
    next(error);
  }
});

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
app.get("/chambres/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const chambre = await prisma.chambre.findUnique({ where: { id } });
    if (!chambre)
      return res.status(404).json({ erreur: "chambre introuvable" });
    res.json(chambre);
  } catch (error) {
    next(error);
  }
});

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
app.post(
  "/chambres",
  authRequis,
  exigeRole("hotelier"),
  validerCorps(SchemaCreationChambre),
  async (req, res, next) => {
    const { numero, categorie, capacite, description, disponible, prixNuit } =
      req.body ?? {};
    if (
      numero === undefined ||
      !categorie ||
      capacite === undefined ||
      !description ||
      disponible === undefined ||
      prixNuit === undefined
    ) {
      return res.status(400).json({ erreur: "Champs de chambre incomplets" });
    }

    try {
      const chambreExistante = await prisma.chambre.findFirst({
        where: {
          hotel_id: Number(req.user.hotelId),
          numero: Number(numero),
        },
      });
      if (chambreExistante) {
        return res.status(409).json({
          erreur: "Ce numero existe deja dans cet hotel",
        });
      }

      const chambre = await prisma.chambre.create({
        data: {
          hotel_id: Number(req.user.hotelId),
          numero: Number(numero),
          categorie: String(categorie),
          capacite: Number(capacite),
          description: String(description),
          disponible: Boolean(disponible),
          prixNuit: Number(prixNuit),
        },
      });
      res.status(201).json(chambre);
    } catch (error) {
      next(error);
    }
  },
);

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
app.patch(
  "/chambres/:id",
  authRequis,
  exigeRole("hotelier"),
  validerCorps(SchemaModificationChambre),
  async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const chambre = await prisma.chambre.findFirst({
        where: { id, hotel_id: Number(req.user.hotelId) },
      });
      if (!chambre)
        return res.status(403).json({ erreur: "Acces refuse a cette chambre" });

      res.json(await prisma.chambre.update({ where: { id }, data: req.body }));
    } catch (error) {
      next(error);
    }
  },
);

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
app.delete(
  "/chambres/:id",
  authRequis,
  exigeRole("hotelier"),
  async (req, res, next) => {
    const id = Number(req.params.id);
    try {
      const chambre = await prisma.chambre.findFirst({
        where: { id, hotel_id: Number(req.user.hotelId) },
      });
      if (!chambre)
        return res.status(403).json({ erreur: "Acces refuse a cette chambre" });
      await prisma.chambre.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /chambres:
 *   get:
 *     tags: [Chambres]
 *     summary: Rechercher des chambres
 *     parameters:
 *       - in: query
 *         name: hotel
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
app.get("/chambres", async (req, res, next) => {
  const resultat = SchemaRechercheChambre.safeParse(req.query);
  if (!resultat.success) {
    return res.status(400).json({
      erreur: "Parametres de recherche invalides",
      erreurs: resultat.error.issues,
    });
  }

  const { hotel, prix_max, capacite, categorie, date_debut, date_fin } =
    resultat.data;
  const filtre = {};
  if (hotel !== undefined) filtre.hotel_id = { equals: hotel };
  if (prix_max !== undefined) filtre.prixNuit = { lte: prix_max };
  if (capacite !== undefined) filtre.capacite = { equals: capacite };
  if (categorie) filtre.categorie = { equals: categorie };

  if (date_debut && date_fin) {
    const debut = new Date(date_debut);
    const fin = new Date(date_fin);
    const reservations = await prisma.reservation.findMany({
      where: {
        statut: { equals: "confirmee" },
        date_arrivee: { lt: fin },
        date_depart: { gt: debut },
      },
      select: { chambre_id: true },
    });

    filtre.id = { notIn: reservations.map(({ chambre_id }) => chambre_id) };
  }

  const chambres = await prisma.chambre.findMany({
    where: filtre,
    include: { hotel: false },
  });
  res.json(chambres);
});

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
app.post(
  "/reservations",
  authRequis,
  exigeRole("voyageur"),
  validerCorps(SchemaCreationReservation),
  async (req, res, next) => {
    const {
      chambre_id,
      date_arrivee,
      date_depart,
      nb_personne,
      statut,
      demande_special = "",
    } = req.body ?? {};

    try {
      const reservation = await prisma.reservation.create({
        data: {
          chambre_id: Number(chambre_id),
          compte_id: Number(req.user.userId),
          date_arrivee: new Date(date_arrivee),
          date_depart: new Date(date_depart),
          nb_personnes: Number(nb_personne),
          statut: String(statut),
          demande_speciale: String(demande_special),
        },
      });
      res.status(201).json(reservation);
    } catch (error) {
      next(error);
    }
  },
);

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
app.get(
  "/reservations/mine",
  authRequis,
  exigeRole("voyageur"),
  async (req, res, next) => {
    try {
      const reservations = await prisma.reservation.findMany({
        where: { compte_id: req.user.userId },
        include: { chambre: true },
      });
      res.json(reservations);
    } catch (error) {
      console.error("les parametres du voyageur sont invalides : ", error);
    }
  },
);

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
app.get(
  "/reservations/received",
  authRequis,
  exigeRole("hotelier"),
  async (req, res, next) => {
    try {
      const reservations = await prisma.reservation.findMany({
        where: {
          chambre: { is: { hotel_id: Number(req.user.hotelId) } },
        },
        include: { chambre: true },
      });
      res.json(reservations);
    } catch (error) {
      next(error);
    }
  },
);

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
app.patch(
  "/reservations/:id",
  authRequis,
  exigeRole("hotelier"),
  validerCorps(SchemaModificationReservations),
  async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        include: { chambre: { select: { hotel_id: true } } },
      });
      if (!reservation)
        return res
          .status(404)
          .json({ erreur: "le format de la reservation n'est pas correcte" });

      if (reservation.chambre.hotel_id !== req.user.hotelId) {
        return res
          .status(403)
          .json({ erreur: "Acces refuse a cette reservation" });
      }

      if (
        req.body.statut &&
        !transitionValide(reservation.statut, req.body.statut)
      ) {
        return res
          .status(400)
          .json({ erreur: "Transition de statut non autorisee" });
      }

      res.json(
        await prisma.reservation.update({
          where: { id },
          data: req.body,
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);
const TRANSITIONS_AUTORISEES = {
  en_attente: ["confirmee", "refusee", "annulee"],
  confirmee: ["annulee"],
  annulee: [],
  refusee: [],
};

function transitionValide(statutActuel, statutVoulu) {
  return (TRANSITIONS_AUTORISEES[statutActuel] || []).includes(statutVoulu);
}

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
app.delete(
  "/reservations/:id",
  authRequis,
  exigeRole("voyageur"),
  async (req, res, next) => {
    const id = Number(req.params.id);

    try {
      const reservation = await prisma.reservation.findUnique({
        where: { id: id },
        include: { chambre: { select: { hotel_id: true } } },
      });
      if (!reservation)
        return res
          .status(404)
          .json({ erreur: "le format de la reservation n'est pas correcte" });

      if (reservation.compte_id !== req.user.userId) {
        return res.status(403).json({
          erreur: "Cette réservation ne vous appartient pas",
        });
      }
      if (!transitionValide(reservation.statut, "annulee")) {
        return res
          .status(400)
          .json({ erreur: "Transition de statut non autorisee" });
      }

      res.json(
        await prisma.reservation.update({
          where: { id: id },
          data: { statut: "annulee" },
        }),
      );
    } catch (error) {
      next(error);
    }
  },
);

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
app.get("/comptes", async (req, res, next) => {
  try {
    res.json(await prisma.comptes.findMany());
  } catch (error) {
    next(error);
  }
});

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
app.get("/comptes/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const compte = await prisma.comptes.findUnique({ where: { id } });
    if (!compte) return res.status(404).json({ erreur: "compte introuvable" });
    res.json(compte);
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ erreur: "Erreur interne du serveur" });
});

import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
const spec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: { title: "Finder API", version: "1.0.0" },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./src/**/*.js"],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
