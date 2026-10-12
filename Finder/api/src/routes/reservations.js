









import { Router } from "express";
import prisma from "../prisma.js";
import { authRequis, exigeRole, valider } from "../middlewares.js";
import { SchemaCreationReservation, SchemaModificationReservations } from "../schemas.js";

const router = Router();


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
router.post(
  "/",
  authRequis,
  exigeRole("voyageur"),
  valider(SchemaCreationReservation),
  async (req, res, next) => {
    const {
      chambre_id,
      date_arrivee,
      date_depart,
      nb_personne,
      statut,
      demande_special = "",
    } = req.body;

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
router.get(
  "/mine",
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
      next(error);
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
router.get(
  "/received",
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
router.patch(
  "/:id",
  authRequis,
  exigeRole("hotelier"),
  valider(SchemaModificationReservations),
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
router.delete(
  "/:id",
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

export default router;
