import { Router } from "express";
import prisma from "../prisma.js";
import { authRequis, exigeRole, valider } from "../middlewares.js";
import { SchemaModificationVoyageur } from "../schemas.js";

const router = Router();


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
router.get("/", authRequis, exigeRole("admin"), async (req, res, next) => {
  try {
    const voyageurs = await prisma.comptes.findMany({
      where: { role: "voyageur" },
      select: { id: true, nom: true, prenom: true, telephone: true, email: true },
    });
    res.json(voyageurs);
  } catch (error) {
    next(error);
  }
});


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
router.get(
  "/me",
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
router.patch(
  "/me",
  authRequis,
  exigeRole("voyageur"),
  valider(SchemaModificationVoyageur),
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

export default router;
