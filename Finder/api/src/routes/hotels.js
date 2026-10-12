import { Router } from "express";
import prisma from "../prisma.js";

const router = Router();


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
router.get("/", async (req, res, next) => {
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
router.get("/:id", async (req, res, next) => {
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
router.get("/:id/chambres", async (req, res, next) => {
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

export default router;
