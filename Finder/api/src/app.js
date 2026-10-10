import express from "express";
import dotenv from "dotenv";
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
app.use(express.json());

export const prisma = new PrismaClient();

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


app.get("/health", (req, res) => res.json({ ok: true }));


app.post(
  "/auth/register",
  validerCorps(SchemaInscriptionUtilisateur),
  async (req, res, next) => {
    const { email, motDePasse, nom, prenom, telephone } = req.body;

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


app.post(
  "/auth/login",
  validerCorps(SchemaConnexionUtilisateur),
  async (req, res, next) => {
    const { email, motDePasse } = req.body;

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


app.post("/auth/logout", authRequis, (req, res) => res.status(204).end());


app.get("/voyageurs", authRequis, exigeRole("admin"), async (req, res, next) => {
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
  validerCorps(SchemaCreationChambre),
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


app.get("/chambres", async (req, res, next) => {
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
      next(error);
    }
  },
);


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
  apis: [
    path
      .relative(process.cwd(), path.join(import.meta.dirname, "openApi", "*.js"))
      .replaceAll("\\", "/"),
  ],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

export { app, spec };

export default app;
