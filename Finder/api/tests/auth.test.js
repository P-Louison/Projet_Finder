import { describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

const tokenPour = (userId, role, hotelId = null) =>
  jwt.sign({ userId, role, hotelId }, process.env.JWT_SECRET);

describe("Authentification et voyageurs", () => {
  it("connecte un voyageur et refuse un mot de passe incorrect", async () => {
    const connexion = await request(app).post("/auth/login").send({
      email: "a.morel@mail.example",
      motDePasse: "Voyage-2026!",
    });
    const refus = await request(app).post("/auth/login").send({
      email: "a.morel@mail.example",
      motDePasse: "incorrect",
    });

    expect(connexion.status).toBe(200);
    expect(connexion.body.token).toEqual(expect.any(String));
    expect(connexion.body.compte).not.toHaveProperty("motDePasse");
    expect(refus.status).toBe(401);
  });

  it("refuse l'accès au profil sans jeton", async () => {
    const response = await request(app).get("/voyageurs/me");

    expect(response.status).toBe(401);
  });

  it("renvoie les voyageurs à un administrateur sans leurs mots de passe", async () => {
    const response = await request(app)
      .get("/voyageurs")
      .set("Authorization", `Bearer ${tokenPour(9, "admin")}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(5);
    expect(
      response.body.every((voyageur) => !("motDePasse" in voyageur)),
    ).toBe(true);
  });
});
