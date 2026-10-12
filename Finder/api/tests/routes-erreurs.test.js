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

});
