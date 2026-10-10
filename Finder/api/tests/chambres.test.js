import { afterAll, afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import app from "../src/app.js";

const prisma = new PrismaClient();
const tokenHotelier = jwt.sign(
  { userId: 1, role: "hotelier", hotelId: 1 },
  process.env.JWT_SECRET,
);
const chambresCreees = [];

const nouvelleChambre = () => ({
  numero: 900000 + Math.floor(Math.random() * 99999),
  categorie: "double",
  capacite: 2,
  description: "Chambre créée par un test",
  disponible: true,
  prixNuit: 120,
});

async function creerChambre() {
  const response = await request(app)
    .post("/chambres")
    .set("Authorization", `Bearer ${tokenHotelier}`)
    .send(nouvelleChambre());

  expect(response.status).toBe(201);
  chambresCreees.push(response.body.id);
  return response.body;
}

afterEach(async () => {
  if (chambresCreees.length > 0) {
    await prisma.chambre.deleteMany({
      where: { id: { in: chambresCreees.splice(0) } },
    });
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Chambres et recherche", () => {
  it("filtre les chambres avec les critères de recherche", async () => {
    const response = await request(app).get(
      "/chambres?hotel_id=1&categorie=double&capacite=2",
    );

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(
      response.body.every(
        (chambre) =>
          chambre.hotel_id === 1 &&
          chambre.categorie === "double" &&
          chambre.capacite === 2,
      ),
    ).toBe(true);
  });

  it("rejette des critères de recherche invalides", async () => {
    const response = await request(app).get("/chambres?hotel_id=invalide");

    expect(response.status).toBe(400);
  });

  it("filtre les chambres selon le prix maximum", async () => {
    const response = await request(app).get("/chambres?prix_max=70");

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((chambre) => chambre.prixNuit <= 70)).toBe(true);
  });

  it("exclut les chambres déjà réservées sur les dates demandées", async () => {
    const response = await request(app).get(
      "/chambres?date_debut=2026-10-10&date_fin=2026-10-12",
    );

    expect(response.status).toBe(200);
    expect(response.body.some((chambre) => chambre.id === 4)).toBe(false);
  });

  it("crée une chambre pour l'hôtel du compte hôtelier", async () => {
    const response = await request(app)
      .post("/chambres")
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send(nouvelleChambre());

    expect(response.status).toBe(201);
    expect(response.body.hotel_id).toBe(1);
    chambresCreees.push(response.body.id);
  });

  it("modifie une chambre appartenant à l'hôtelier", async () => {
    const chambre = await creerChambre();
    const response = await request(app)
      .patch(`/chambres/${chambre.id}`)
      .set("Authorization", `Bearer ${tokenHotelier}`)
      .send({ description: "Description modifiée par le test" });

    expect(response.status).toBe(200);
    expect(response.body.description).toBe("Description modifiée par le test");
  });

  it("supprime une chambre appartenant à l'hôtelier", async () => {
    const chambre = await creerChambre();
    const response = await request(app)
      .delete(`/chambres/${chambre.id}`)
      .set("Authorization", `Bearer ${tokenHotelier}`);

    expect(response.status).toBe(204);
    expect(await prisma.chambre.findUnique({ where: { id: chambre.id } })).toBe(
      null,
    );
    chambresCreees.splice(chambresCreees.indexOf(chambre.id), 1);
  });
});
