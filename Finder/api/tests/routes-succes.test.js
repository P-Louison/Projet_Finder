import { afterAll, afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import app from "../src/app.js";

const prisma = new PrismaClient();
const tokenVoyageur = jwt.sign(
  { userId: 4, role: "voyageur" },
  process.env.JWT_SECRET,
);
const tokenHotelier = jwt.sign(
  { userId: 1, role: "hotelier", hotelId: 1 },
  process.env.JWT_SECRET,
);
const comptesCrees = [];
const chambresCreees = [];
const reservationsCreees = [];

const creerReservation = () =>
  prisma.reservation.create({
    data: {
      chambre_id: 1,
      compte_id: 4,
      date_arrivee: new Date("2031-06-01T15:00:00.000Z"),
      date_depart: new Date("2031-06-03T11:00:00.000Z"),
      nb_personnes: 1,
      statut: "en_attente",
    },
  });

afterEach(async () => {
  if (comptesCrees.length) {
    await prisma.comptes.deleteMany({
      where: { id: { in: comptesCrees.splice(0) } },
    });
  }
  if (reservationsCreees.length) {
    await prisma.reservation.deleteMany({
      where: { id: { in: reservationsCreees.splice(0) } },
    });
  }
  if (chambresCreees.length) {
    await prisma.chambre.deleteMany({
      where: { id: { in: chambresCreees.splice(0) } },
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Routes de lecture et opérations réussies", () => {
  it("crée un nouveau compte voyageur sans renvoyer son mot de passe", async () => {
    const response = await request(app)
      .post("/auth/register")
      .send({
        email: `test-${Date.now()}@mail.example`,
        motDePasse: "MotDePasse-2026!",
        nom: "Test",
        prenom: "Voyageur",
      });

    expect(response.status).toBe(201);
    expect(response.body.role).toBe("voyageur");
    expect(response.body).not.toHaveProperty("motDePasse");
    comptesCrees.push(response.body.id);
  });

  it("lit et modifie le profil du voyageur connecté", async () => {
    const profil = await request(app)
      .get("/voyageurs/me")
      .set("Authorization", `Bearer ${tokenVoyageur}`);
    const modification = await request(app)
      .patch("/voyageurs/me")
      .set("Authorization", `Bearer ${tokenVoyageur}`)
      .send({ nom: "Morel" });

    expect(profil.status).toBe(200);
    expect(profil.body.prenom).toBe("Anaïs");
    expect(modification.status).toBe(200);
    expect(modification.body.nom).toBe("Morel");
  });

  it("lit un hôtel, ses chambres et une chambre", async () => {
    const hotel = await request(app).get("/hotels/1");
    const chambresHotel = await request(app).get("/hotels/1/chambres");
    const chambre = await request(app).get("/chambres/1");

    expect(hotel.status).toBe(200);
    expect(hotel.body.id).toBe(1);
    expect(chambresHotel.status).toBe(200);
    expect(chambresHotel.body.length).toBeGreaterThan(0);
    expect(chambresHotel.body[0]).toHaveProperty("hotelId", 1);
    expect(chambre.status).toBe(200);
    expect(chambre.body.id).toBe(1);
  });

  it("refuse de créer un numéro de chambre déjà utilisé", async () => {
    const response = await request(app)
      .post("/chambres")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({
        numero: 101,
        categorie: "simple",
        capacite: 1,
        description: "Numéro déjà présent",
        disponible: true,
        prixNuit: 69,
      });

    expect(response.status).toBe(409);
  });

  it("permet à l'hôtelier de voir les réservations reçues", async () => {
    const response = await request(app)
      .get("/reservations/received")
      .set("Authorization", `Bearer ${tokenHotelier}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].chambre).toHaveProperty("hotel_id", 1);
  });

  it("confirme puis annule une réservation de test et la nettoie", async () => {
    const reservation = await creerReservation();
    reservationsCreees.push(reservation.id);

    const confirmation = await request(app)
      .patch(`/reservations/${reservation.id}`)
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ statut: "confirmee" });
    const annulation = await request(app)
      .delete(`/reservations/${reservation.id}`)
      .set("Authorization", `Bearer ${tokenVoyageur}`);

    expect(confirmation.status).toBe(200);
    expect(confirmation.body.statut).toBe("confirmee");
    expect(annulation.status).toBe(200);
    expect(annulation.body.statut).toBe("annulee");
  });

  it("refuse une transition quand la réservation a un statut inconnu", async () => {
    const reservation = await prisma.reservation.create({
      data: {
        chambre_id: 1,
        compte_id: 4,
        date_arrivee: new Date("2031-07-01T15:00:00.000Z"),
        date_depart: new Date("2031-07-03T11:00:00.000Z"),
        nb_personnes: 1,
        statut: "statut_inconnu",
      },
    });
    reservationsCreees.push(reservation.id);

    const response = await request(app)
      .patch(`/reservations/${reservation.id}`)
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ statut: "annulee" });

    expect(response.status).toBe(400);
  });

  it("renvoie le compte demandé", async () => {
    const response = await request(app).get("/comptes/4");

    expect(response.status).toBe(200);
    expect(response.body.email).toBe("a.morel@mail.example");
  });
});
