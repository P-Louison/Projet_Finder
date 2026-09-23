import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

dotenv.config({ path: path.join(import.meta.dirname, "..", ".env") });

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET;

const comptePublic = ({ motDePasse, ...compte }) => compte;

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

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/auth/register", async (req, res, next) => {
  const { email, motDePasse, nom, prenom, telephone } = req.body ?? {};
  if (!email || !motDePasse || !nom || !prenom) {
    return res
      .status(400)
      .json({ erreur: "email, motDePasse, nom et prenom sont requis" });
  }

  try {
    const compteExistant = await prisma.comptes.findFirst({ where: { email } });
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
});

app.post("/auth/login", async (req, res, next) => {
  const { email, motDePasse } = req.body ?? {};
  if (!email || !motDePasse) {
    return res.status(400).json({ erreur: "email et motDePasse sont requis" });
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
});

app.post("/auth/logout", authRequis, (req, res) => res.status(204).end());

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

app.patch(
  "/voyageurs/me",
  authRequis,
  exigeRole("voyageur"),
  async (req, res, next) => {
    const { nom, prenom, telephone } = req.body ?? {};
    const data = Object.fromEntries(
      Object.entries({ nom, prenom, telephone }).filter(
        ([, valeur]) => valeur !== undefined,
      ),
    );
    if (!Object.keys(data).length) {
      return res
        .status(400)
        .json({ erreur: "Aucun champ de profil a modifier" });
    }

    try {
      const compte = await prisma.comptes.update({
        where: { id: req.user.userId },
        data,
        select: { nom: true, prenom: true, telephone: true },
      });
      res.json(compte);
    } catch (error) {
      next(error);
    }
  },
);

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

app.post(
  "/chambres",
  authRequis,
  exigeRole("hotelier"),
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

app.patch(
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
        return res.status(404).json({ erreur: "chambre introuvable" });

      const champs = [
        "numero",
        "categorie",
        "capacite",
        "description",
        "disponible",
        "prixNuit",
      ];
      const data = Object.fromEntries(
        champs
          .filter((champ) => req.body?.[champ] !== undefined)
          .map((champ) => [champ, req.body[champ]]),
      );
      res.json(await prisma.chambre.update({ where: { id }, data }));
    } catch (error) {
      next(error);
    }
  },
);

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
        return res.status(404).json({ erreur: "chambre introuvable" });
      await prisma.chambre.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

app.get("/chambres", async (req, res, next) => {
  const { hotel_id, prix_max, capacite, categorie, date_debut, date_fin } =
    req.query;
  const filtre = {};
  if (hotel_id) filtre.hotel_id = { equals: Number(hotel_id) };
  if (prix_max) filtre.prixNuit = { lte: Number(prix_max) };
  if (capacite) filtre.capacite = { equals: Number(capacite) };
  if (categorie) filtre.categorie = { contains: String(categorie) };

  if (date_debut && date_fin) {
    const debut = new Date(String(date_debut));
    const fin = new Date(String(date_fin));
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
