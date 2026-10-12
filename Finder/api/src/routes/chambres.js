import { Router } from "express";
import prisma from "../prisma.js";
import { authRequis, exigeRole, valider } from "../middlewares.js";
import { SchemaCreationChambre, SchemaModificationChambre, SchemaRechercheChambre } from "../schemas.js";

const router = Router();

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
router.get("/:id", async (req, res, next) => {
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
router.post(
  "/",
  authRequis,
  exigeRole("hotelier"),
  valider(SchemaCreationChambre),
  async (req, res, next) => {
    const { numero, categorie, capacite, description, disponible, prixNuit } =
      req.body;

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
router.patch(
  "/:id",
  authRequis,
  exigeRole("hotelier"),
  valider(SchemaModificationChambre),
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
router.delete(
  "/:id",
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
router.get("/", async (req, res, next) => {
  const resultat = SchemaRechercheChambre.safeParse(req.query);
  if (!resultat.success) {
    return res.status(400).json({
      erreur: "Parametres de recherche invalides",
      erreurs: resultat.error.issues,
    });
  }

  const { hotel_id, prix_max, capacite, categorie, date_debut, date_fin } =
    resultat.data;
  const filtre = {};
  if (hotel_id !== undefined) filtre.hotel_id = { equals: hotel_id };
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

export default router;
