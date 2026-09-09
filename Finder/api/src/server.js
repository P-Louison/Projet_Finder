import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

const hotels = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "..", "finder-data", "hotels.json"),
    "utf8",
  ),
);
const chambres = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "..", "finder-data", "chambres.json"),
    "utf8",
  ),
);
const comptes = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "..", "finder-data", "comptes.json"),
    "utf8",
  ),
);
const reservations = JSON.parse(
  readFileSync(
    path.join(import.meta.dirname, "..", "finder-data", "reservations.json"),
    "utf8",
  ),
);

app.get("/hotels", (req, res) => res.json(hotels));
app.get("/hotels/:id", (req, res) => {
  const id = Number(req.params.id);
  const hotel = hotels.find((l) => l.id === id);
  if (!hotel) return res.status(404).json({ erreur: "Hotel introuvable" });
  res.json(hotel);
});

app.get("/chambres/:id", (req, res) => {
  const id = Number(req.params.id);
  const chambre = chambres.find((l) => l.id === id);
  if (!chambre) return res.status(404).json({ erreur: "chambre introuvable" });
  res.json(chambre);
});

app.get("/chambres", (req, res) => {
  const { prix_max } = req.query;
  const chambre = prix.filter((c) => c.prix_nuit < prix_max);
  if (isNaN(Number(prix_max)))
    return res.status(404).json({ erreur: "le prix n'est pas un chiffre" });
  res.json(chambre.filter((c) => c.prix_nuit < Number(prix_max)));
});

app.get("/reservations", (req, res) => res.json(reservations));
app.get("/reservations/:id", (req, res) => {
  const id = Number(req.params.id);
  const reservation = reservations.find((l) => l.id === id);
  if (!reservation)
    return res.status(404).json({ erreur: "reservation introuvable" });
  res.json(reservation);
});

app.get("/comptes", (req, res) => res.json(comptes));
app.get("/comptes/:id", (req, res) => {
  const id = Number(req.params.id);
  const compte = hotels.find((l) => l.id === id);
  if (!compte) return res.status(404).json({ erreur: "comptes introuvable" });
  res.json(compte);
});

app.listen(process.env.PORT ?? 3000);
