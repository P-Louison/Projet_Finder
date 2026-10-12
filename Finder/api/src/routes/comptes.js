



import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();


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
router.get("/", async (req, res, next) => {
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
router.get("/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const compte = await prisma.comptes.findUnique({ where: { id } });
    if (!compte) return res.status(404).json({ erreur: "compte introuvable" });
    res.json(compte);
  } catch (error) {
    next(error);
  }
});

export default router;
