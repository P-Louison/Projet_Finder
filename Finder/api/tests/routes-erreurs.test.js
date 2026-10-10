import { describe, expect, it, vi } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app, { prisma } from "../src/app.js";

const tokenPour = (userId, role, hotelId = null) =>
  jwt.sign({ userId, role, hotelId }, process.env.JWT_SECRET);

const tokenVoyageur = tokenPour(4, "voyageur");
const tokenHotelier = tokenPour(1, "hotelier", 1);
const tokenAdmin = tokenPour(9, "admin");

describe("Réponses d'erreur des routes", () => {
  it("vérifie les routes de disponibilité et les listes publiques", async () => {
    const [health, hotels, comptes] = await Promise.all([
      request(app).get("/health"),
      request(app).get("/hotels"),
      request(app).get("/comptes"),
    ]);

    expect(health.status).toBe(200);
    expect(health.body).toEqual({ ok: true });
    expect(hotels.status).toBe(200);
    expect(hotels.body.length).toBeGreaterThan(0);
    expect(comptes.status).toBe(200);
    expect(comptes.body.length).toBeGreaterThan(0);
  });

  it("rejette une inscription invalide et un compte déjà inscrit", async () => {
    const invalide = await request(app).post("/auth/register").send({
      email: "pas-une-adresse",
      motDePasse: "123",
    });
    const doublon = await request(app).post("/auth/register").send({
      email: "a.morel@mail.example",
      motDePasse: "Voyage-2026!",
      nom: "Morel",
      prenom: "Anaïs",
    });

    expect(invalide.status).toBe(400);
    expect(doublon.status).toBe(409);
  });

  it("rejette une requête de connexion mal formée", async () => {
    const response = await request(app)
      .post("/auth/login")
      .send({ email: "invalide" });

    expect(response.status).toBe(400);
  });

  it("refuse la connexion pour une adresse inconnue", async () => {
    const response = await request(app).post("/auth/login").send({
      email: "personne-inconnue@mail.example",
      motDePasse: "MotDePasse-2026!",
    });

    expect(response.status).toBe(401);
  });

  it("refuse une déconnexion sans jeton", async () => {
    const response = await request(app).post("/auth/logout");

    expect(response.status).toBe(401);
  });

  it("déconnecte un utilisateur avec un jeton valide", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", `Bearer ${tokenVoyageur}`);

    expect(response.status).toBe(204);
  });

  it("refuse un jeton mal formé", async () => {
    const response = await request(app)
      .post("/auth/logout")
      .set("Authorization", "Bearer jeton-invalide");

    expect(response.status).toBe(401);
  });

  it("accepte les anciens noms de propriétés du jeton hôtelier", async () => {
    const tokenLegacy = jwt.sign(
      { userId: 9, role: "admin", hotel_id: 1 },
      process.env.JWT_SECRET,
    );
    const response = await request(app)
      .get("/voyageurs")
      .set("Authorization", `Bearer ${tokenLegacy}`);

    expect(response.status).toBe(200);
  });

  it("accepte l'identifiant du sujet comme identifiant du compte dans le jeton", async () => {
    const tokenAvecSujet = jwt.sign(
      { role: "admin" },
      process.env.JWT_SECRET,
      { subject: "9" },
    );
    const response = await request(app)
      .get("/voyageurs")
      .set("Authorization", `Bearer ${tokenAvecSujet}`);

    expect(response.status).toBe(200);
  });

  it("refuse à un voyageur l'accès à la liste des voyageurs", async () => {
    const response = await request(app)
      .get("/voyageurs")
      .set("Authorization", `Bearer ${tokenVoyageur}`);

    expect(response.status).toBe(403);
  });

  it("refuse un profil modifié avec un corps vide", async () => {
    const response = await request(app)
      .patch("/voyageurs/me")
      .set("Authorization", `Bearer ${tokenVoyageur}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("retourne 404 pour le profil d'un voyageur inexistant", async () => {
    const response = await request(app)
      .get("/voyageurs/me")
      .set("Authorization", `Bearer ${tokenPour(99999999, "voyageur")}`);

    expect(response.status).toBe(404);
  });

  it("retourne 404 pour un hôtel inexistant", async () => {
    const response = await request(app).get("/hotels/99999999");

    expect(response.status).toBe(404);
  });

  it("refuse la liste des chambres d'un identifiant d'hôtel invalide", async () => {
    const response = await request(app).get("/hotels/abc/chambres");

    expect(response.status).toBe(404);
  });

  it("signale un hôtel inexistant dans la liste de ses chambres", async () => {
    const response = await request(app).get("/hotels/99999999/chambres");

    expect(response.status).toBe(403);
  });

  it("retourne 404 pour une chambre inexistante", async () => {
    const response = await request(app).get("/chambres/99999999");

    expect(response.status).toBe(404);
  });

  it("refuse la création d'une chambre avec un corps invalide", async () => {
    const response = await request(app)
      .post("/chambres")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ numero: -1 });

    expect(response.status).toBe(400);
  });

  it("refuse une modification de chambre avec un corps vide", async () => {
    const response = await request(app)
      .patch("/chambres/1")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("refuse à l'hôtelier une chambre inexistante lors de la modification", async () => {
    const response = await request(app)
      .patch("/chambres/99999999")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ description: "Chambre absente" });

    expect(response.status).toBe(403);
  });

  it("refuse à l'hôtelier la suppression d'une chambre inexistante", async () => {
    const response = await request(app)
      .delete("/chambres/99999999")
      .set("Authorization", `Bearer ${tokenHotelier}`);

    expect(response.status).toBe(403);
  });

  it("refuse une réservation avec un corps invalide", async () => {
    const response = await request(app)
      .post("/reservations")
      .set("Authorization", `Bearer ${tokenVoyageur}`)
      .send({ chambre_id: "invalide" });

    expect(response.status).toBe(400);
  });

  it("refuse la modification d'une réservation avec un corps vide", async () => {
    const response = await request(app)
      .patch("/reservations/1")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it("refuse la consultation des réservations sans jeton", async () => {
    const response = await request(app).get("/reservations/mine");

    expect(response.status).toBe(401);
  });

  it("refuse à un voyageur la consultation des réservations reçues par un hôtel", async () => {
    const response = await request(app)
      .get("/reservations/received")
      .set("Authorization", `Bearer ${tokenVoyageur}`);

    expect(response.status).toBe(403);
  });

  it("retourne 404 pour la modification d'une réservation inexistante", async () => {
    const response = await request(app)
      .patch("/reservations/99999999")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ statut: "confirmee" });

    expect(response.status).toBe(404);
  });

  it("refuse la modification d'une réservation appartenant à un autre hôtel", async () => {
    const tokenAutreHotel = tokenPour(2, "hotelier", 2);
    const response = await request(app)
      .patch("/reservations/1")
      .set("Authorization", `Bearer ${tokenAutreHotel}`)
      .send({ statut: "confirmee" });

    expect(response.status).toBe(403);
  });

  it("refuse une transition de statut interdite", async () => {
    const response = await request(app)
      .patch("/reservations/1")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ statut: "refusee" });

    expect(response.status).toBe(400);
  });

  it("retourne 404 pour l'annulation d'une réservation inexistante", async () => {
    const response = await request(app)
      .delete("/reservations/99999999")
      .set("Authorization", `Bearer ${tokenVoyageur}`);

    expect(response.status).toBe(404);
  });

  it("refuse l'annulation d'une réservation appartenant à un autre voyageur", async () => {
    const response = await request(app)
      .delete("/reservations/1")
      .set("Authorization", `Bearer ${tokenPour(5, "voyageur")}`);

    expect(response.status).toBe(403);
  });

  it("refuse l'annulation d'une réservation déjà refusée", async () => {
    const response = await request(app)
      .delete("/reservations/5")
      .set("Authorization", `Bearer ${tokenPour(7, "voyageur")}`);

    expect(response.status).toBe(400);
  });

  it("retourne 404 pour un compte inexistant", async () => {
    const response = await request(app).get("/comptes/99999999");

    expect(response.status).toBe(404);
  });

  it("redirige les erreurs JSON de parsing vers le gestionnaire d'erreurs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(app)
      .post("/auth/login")
      .set("Content-Type", "application/json")
      .send("{json invalide");
    log.mockRestore();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ erreur: "Erreur interne du serveur" });
  });

  it("redirige les erreurs de requête Prisma vers le gestionnaire d'erreurs", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await request(app).get("/comptes/abc");
    log.mockRestore();

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ erreur: "Erreur interne du serveur" });
  });

  it("transmet les erreurs des routes reçues, annulation et comptes", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const reservationsFindMany = vi
      .spyOn(prisma.reservation, "findMany")
      .mockRejectedValueOnce(new Error("Erreur simulée findMany"));
    const reservationsFindUnique = vi
      .spyOn(prisma.reservation, "findUnique")
      .mockRejectedValueOnce(new Error("Erreur simulée findUnique"));
    const comptesFindMany = vi
      .spyOn(prisma.comptes, "findMany")
      .mockRejectedValueOnce(new Error("Erreur simulée findMany"));

    try {
      const [reservationsRecues, annulation, comptes] = await Promise.all([
        request(app)
          .get("/reservations/received")
          .set("Authorization", `Bearer ${tokenPour(1, "hotelier", 1)}`),
        request(app)
          .delete("/reservations/1")
          .set("Authorization", `Bearer ${tokenVoyageur}`),
        request(app).get("/comptes"),
      ]);

      expect(reservationsRecues.status).toBe(500);
      expect(annulation.status).toBe(500);
      expect(comptes.status).toBe(500);
      expect(log).toHaveBeenCalledTimes(3);
    } finally {
      reservationsFindMany.mockRestore();
      reservationsFindUnique.mockRestore();
      comptesFindMany.mockRestore();
      log.mockRestore();
    }
  });

  it("transmet les erreurs de création et lecture de réservations", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const findMany = vi
      .spyOn(prisma.reservation, "findMany")
      .mockRejectedValueOnce(new Error("Erreur simulée findMany"));

    try {
      const lecture = await request(app)
        .get("/reservations/mine")
        .set("Authorization", `Bearer ${tokenVoyageur}`);
      const creation = await request(app)
        .post("/reservations")
        .set("Authorization", `Bearer ${tokenVoyageur}`)
        .send({
          chambre_id: 99999999,
          date_arrivee: "2032-06-01T15:00:00.000Z",
          date_depart: "2032-06-03T11:00:00.000Z",
          nb_personne: 1,
          statut: "en_attente",
        });

      expect(lecture.status).toBe(500);
      expect(creation.status).toBe(500);
      expect(log).toHaveBeenCalledTimes(2);
    } finally {
      findMany.mockRestore();
      log.mockRestore();
    }
  });

  it("transmet une erreur Prisma lors de la modification d'une réservation", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const findUnique = vi
      .spyOn(prisma.reservation, "findUnique")
      .mockRejectedValueOnce(new Error("Erreur simulée findUnique"));

    try {
      const response = await request(app)
        .patch("/reservations/1")
        .set("Authorization", `Bearer ${tokenPour(1, "hotelier", 1)}`)
        .send({ statut: "confirmee" });

      expect(response.status).toBe(500);
      expect(log).toHaveBeenCalledOnce();
    } finally {
      findUnique.mockRestore();
      log.mockRestore();
    }
  });

  it("transmet les erreurs Prisma de création, modification et suppression de chambres", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const findFirst = vi
      .spyOn(prisma.chambre, "findFirst")
      .mockRejectedValueOnce(new Error("Erreur simulée création"))
      .mockRejectedValueOnce(new Error("Erreur simulée modification"))
      .mockRejectedValueOnce(new Error("Erreur simulée suppression"));
    const chambre = {
      numero: 777777,
      categorie: "double",
      capacite: 2,
      description: "Chambre utilisée pour le test d'erreur",
      disponible: true,
      prixNuit: 120,
    };

    try {
      const creation = await request(app)
        .post("/chambres")
        .set("Authorization", `Bearer ${tokenHotelier}`)
        .send(chambre);
      const modification = await request(app)
        .patch("/chambres/1")
        .set("Authorization", `Bearer ${tokenHotelier}`)
        .send({ description: "Modification" });
      const suppression = await request(app)
        .delete("/chambres/1")
        .set("Authorization", `Bearer ${tokenHotelier}`);

      expect(creation.status).toBe(500);
      expect(modification.status).toBe(500);
      expect(suppression.status).toBe(500);
      expect(log).toHaveBeenCalledTimes(3);
    } finally {
      findFirst.mockRestore();
      log.mockRestore();
    }
  });

  it("transmet les erreurs Prisma des routes de lecture des hôtels et chambres", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const hotelsFindMany = vi
      .spyOn(prisma.hotel, "findMany")
      .mockRejectedValueOnce(new Error("Erreur simulée hôtels"));
    const hotelsFindUnique = vi
      .spyOn(prisma.hotel, "findUnique")
      .mockRejectedValueOnce(new Error("Erreur simulée hôtel"))
      .mockRejectedValueOnce(new Error("Erreur simulée chambres hôtel"));
    const chambresFindUnique = vi
      .spyOn(prisma.chambre, "findUnique")
      .mockRejectedValueOnce(new Error("Erreur simulée chambre"));

    try {
      const [hotels, hotel, chambresHotel, chambre] = await Promise.all([
        request(app).get("/hotels"),
        request(app).get("/hotels/1"),
        request(app).get("/hotels/1/chambres"),
        request(app).get("/chambres/1"),
      ]);

      expect(hotels.status).toBe(500);
      expect(hotel.status).toBe(500);
      expect(chambresHotel.status).toBe(500);
      expect(chambre.status).toBe(500);
      expect(log).toHaveBeenCalledTimes(4);
    } finally {
      hotelsFindMany.mockRestore();
      hotelsFindUnique.mockRestore();
      chambresFindUnique.mockRestore();
      log.mockRestore();
    }
  });

  it("transmet les erreurs Prisma des routes de connexion et de profil", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const findFirst = vi
      .spyOn(prisma.comptes, "findFirst")
      .mockRejectedValueOnce(new Error("Erreur simulée connexion"));
    const findMany = vi
      .spyOn(prisma.comptes, "findMany")
      .mockRejectedValueOnce(new Error("Erreur simulée liste voyageurs"));
    const findUnique = vi
      .spyOn(prisma.comptes, "findUnique")
      .mockRejectedValueOnce(new Error("Erreur simulée profil"));
    const update = vi
      .spyOn(prisma.comptes, "update")
      .mockRejectedValueOnce(new Error("Erreur simulée modification profil"));

    try {
      const connexion = await request(app).post("/auth/login").send({
        email: "a.morel@mail.example",
        motDePasse: "Voyage-2026!",
      });
      const voyageurs = await request(app)
        .get("/voyageurs")
        .set("Authorization", `Bearer ${tokenAdmin}`);
      const profil = await request(app)
        .get("/voyageurs/me")
        .set("Authorization", `Bearer ${tokenVoyageur}`);
      const modification = await request(app)
        .patch("/voyageurs/me")
        .set("Authorization", `Bearer ${tokenVoyageur}`)
        .send({ nom: "Morel" });

      expect(connexion.status).toBe(500);
      expect(voyageurs.status).toBe(500);
      expect(profil.status).toBe(500);
      expect(modification.status).toBe(500);
      expect(log).toHaveBeenCalledTimes(4);
    } finally {
      findFirst.mockRestore();
      findMany.mockRestore();
      findUnique.mockRestore();
      update.mockRestore();
      log.mockRestore();
    }
  });

  it("transmet les erreurs Prisma lors de l'inscription", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const findFirst = vi
      .spyOn(prisma.comptes, "findFirst")
      .mockRejectedValueOnce(new Error("Erreur simulée inscription"));

    try {
      const response = await request(app)
        .post("/auth/register")
        .send({
          email: `inscription-${Date.now()}@mail.example`,
          motDePasse: "MotDePasse-2026!",
          nom: "Test",
          prenom: "Inscription",
        });

      expect(response.status).toBe(500);
      expect(log).toHaveBeenCalledOnce();
    } finally {
      findFirst.mockRestore();
      log.mockRestore();
    }
  });

  it("rejette les filtres de recherche invalides", async () => {
    const response = await request(app).get("/chambres?categorie=palace");

    expect(response.status).toBe(400);
  });

  it("exige un jeton pour les routes protégées sans authentification", async () => {
    const [voyageurs, chambres, reservations] = await Promise.all([
      request(app).get("/voyageurs"),
      request(app).post("/chambres").send({}),
      request(app).get("/reservations/received"),
    ]);

    expect(voyageurs.status).toBe(401);
    expect(chambres.status).toBe(401);
    expect(reservations.status).toBe(401);
  });
});
