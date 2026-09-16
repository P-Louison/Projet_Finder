import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.ts";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env") });

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/hotels", async (req, res, next) => {
  try {
    res.json(await prisma.hotel.findMany({ include: { chambre: true } }));
  } catch (error) {
    next(error);
  }
});

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

app.get("/hotels/:id/chambres", async (req, res, next) => {
  const hotelId = Number(req.params.id);
  if (!Number.isInteger(hotelId) || hotelId < 1) {
    return res.status(404).json({ erreur: "Hotel introuvable" });
  }

  try {
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });

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

app.get("/chambres", async (req, res, next) => {
  const { hotel_id, prix_max, capacite, categorie } = req.query;
  const filtre = {};
  if (hotel_id) filtre.hotel_id = { equals: Number(hotel_id) };
  if (prix_max) filtre.prixNuit = { lte: Number(prix_max) };
  if (capacite) filtre.capacite = { equals: Number(capacite) };
  if (categorie) filtre.categorie = { contains: String(categorie) };

  const chambres = await prisma.chambre.findMany({
    where: filtre,
    include: { hotel: true },
  });
  res.json(chambres);
});

app.get("/reservations", async (req, res, next) => {
  try {
    res.json(await prisma.reservation.findMany());
  } catch (error) {
    next(error);
  }
});

app.get("/reservations/:id", async (req, res, next) => {
  const id = Number(req.params.id);
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id } });
    if (!reservation)
      return res.status(404).json({ erreur: "reservation introuvable" });
    res.json(reservation);
  } catch (error) {
    next(error);
  }
});

app.get("/comptes", async (req, res, next) => {
  try {
    res.json(await prisma.comptes.findMany());
  } catch (error) {
    next(error);
  }
});

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

const PORT = process.env.PORT ?? 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});
