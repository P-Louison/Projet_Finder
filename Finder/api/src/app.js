import express from "express";
import cors from "cors";
import path from "node:path";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import prisma from "./prisma.js";
import authRoutes from "./routes/auth.js";
import voyageursRoutes from "./routes/voyageurs.js";
import hotelsRoutes from "./routes/hotels.js";
import chambresRoutes from "./routes/chambres.js";
import reservationsRoutes from "./routes/reservations.js";
import comptesRoutes from "./routes/comptes.js";

const app = express();
app.use(cors());
app.use(express.json());

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Système]
 *     summary: Vérifier que le serveur fonctionne
 *     responses:
 *       '200': { description: Serveur disponible }
 */
app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/voyageurs", voyageursRoutes);
app.use("/hotels", hotelsRoutes);
app.use("/chambres", chambresRoutes);
app.use("/reservations", reservationsRoutes);
app.use("/comptes", comptesRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ erreur: "Erreur interne du serveur" });
});

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
    path.join(import.meta.dirname, "app.js").replaceAll("\\", "/"),
    path.join(import.meta.dirname, "routes", "*.js").replaceAll("\\", "/"),
  ],
});
app.use("/docs", swaggerUi.serve, swaggerUi.setup(spec));

export { app, prisma, spec };

export default app;
