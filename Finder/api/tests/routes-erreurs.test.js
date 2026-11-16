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

  it("retourne 404 pour le profil d'un voyageur inexistant", async () => {
    const response = await request(app)
      .get("/voyageurs/me")
      .set("Authorization", `Bearer ${tokenPour(99999999, "voyageur")}`);

    expect(response.status).toBe(404);
  });

  it("retourne 404 pour une chambre inexistante", async () => {
    const response = await request(app).get("/chambres/101");

    expect(response.status).toBe(404);
  });
});
