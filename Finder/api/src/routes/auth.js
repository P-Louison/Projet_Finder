import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prisma.js";
import { authRequis, valider } from "../middlewares.js";
import { SchemaConnexionUtilisateur, SchemaInscriptionUtilisateur } from "../schemas.js";

const JWT_SECRET = process.env.JWT_SECRET;
const comptePublic = ({ motDePasse, ...compte }) => compte;

const router = Router();


/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Authentification]
 *     summary: Créer un compte voyageur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse, nom, prenom]
 *             properties:
 *               email: { type: string, format: email, example: voyageur@example.com }
 *               motDePasse: { type: string, minLength: 6, example: secret123 }
 *               nom: { type: string, example: Morel }
 *               prenom: { type: string, example: Anaïs }
 *               telephone: { type: string, nullable: true, example: "06 11 22 33 44" }
 *     responses:
 *       '201': { description: Compte créé }
 *       '400': { description: Corps JSON invalide }
 *       '409': { description: Adresse e-mail déjà utilisée }
 *       '500': { description: Erreur interne }
 */
router.post(
  "/register",
  valider(SchemaInscriptionUtilisateur),
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


/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Authentification]
 *     summary: Se connecter et obtenir un jeton JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, motDePasse]
 *             properties:
 *               email: { type: string, format: email, example: voyageur@example.com }
 *               motDePasse: { type: string, example: secret123 }
 *     responses:
 *       '200': { description: Connexion réussie avec token et compte }
 *       '400': { description: Corps JSON invalide }
 *       '401': { description: E-mail ou mot de passe incorrect }
 *       '500': { description: Erreur interne }
 */
router.post(
  "/login",
  valider(SchemaConnexionUtilisateur),
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


/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Authentification]
 *     summary: Terminer la session
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       '204': { description: Déconnexion effectuée }
 *       '401': { description: Jeton absent ou invalide }
 */
router.post("/logout", authRequis, (req, res) => res.status(204).end());

export default router;
