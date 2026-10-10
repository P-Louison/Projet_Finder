import { Router } from "express";

export function creerRouteVoyageurs({ prisma, authRequis, exigeRole }) {
  const router = Router();

  router.get("/", authRequis, exigeRole("admin"), async (req, res, next) => {
    try {
      const voyageurs = await prisma.comptes.findMany({
        where: { role: "voyageur" },
        select: {
          id: true,
          nom: true,
          prenom: true,
          telephone: true,
          email: true,
        },
      });
      res.json(voyageurs);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
