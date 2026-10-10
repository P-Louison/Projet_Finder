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
const reservationsCreees = [];

afterEach(async () => {
  if (reservationsCreees.length > 0) {
    await prisma.reservation.deleteMany({
      where: { id: { in: reservationsCreees.splice(0) } },
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Réservations", () => {
  it("crée une réservation pour le voyageur connecté", async () => {
    const response = await request(app)
      .post("/reservations")
      .set("Authorization", `Bearer ${tokenVoyageur}`)
      .send({
        chambre_id: 1,
        date_arrivee: "2030-06-01T15:00:00.000Z",
        date_depart: "2030-06-03T11:00:00.000Z",
        nb_personne: 1,
        statut: "en_attente",
      });

    expect(response.status).toBe(201);
    expect(response.body.compte_id).toBe(4);
    expect(response.body.chambre_id).toBe(1);
    expect(response.body.demande_speciale).toBe("");
    reservationsCreees.push(response.body.id);
  });

  it("ne renvoie que les réservations du voyageur connecté", async () => {
    const response = await request(app)
      .get("/reservations/mine")
      .set("Authorization", `Bearer ${tokenVoyageur}`);

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every((reservation) => reservation.compte_id === 4),
    ).toBe(true);
  });
});
