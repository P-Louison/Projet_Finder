import { z } from "zod";

const telephoneValide = z
  .string()
  .regex(
    /^(?:0[1-9](?:[ .-]?\d{2}){4}|\+?[1-9]\d{7,14})$/,
    "Telephone invalide",
  );

export const SchemaConnexionUtilisateur = z
  .object({
    email: z.string().email("Email invalide"),
    motDePasse: z.string().min(6, "Mot de passe trop court"),
  })
  .strict();

export const SchemaInscriptionUtilisateur = z
  .object({
    email: z.string().email("Email invalide"),
    motDePasse: z.string().min(6, "Mot de passe trop court"),
    nom: z.string().min(1, "Nom obligatoire"),
    prenom: z.string().min(1, "Prenom obligatoire"),
    telephone: telephoneValide.nullable().optional(),
  })
  .strict();

export const SchemaCreationChambre = z
  .object({
    numero: z.number().int().positive("Numero de chambre invalide"),
    categorie: z.string().min(1, "Categorie obligatoire"),
    capacite: z.number().int().positive("Capacite invalide"),
    description: z.string().min(1, "Description obligatoire"),
    disponible: z.boolean(),
    prixNuit: z.number().int().positive("Prix par nuit invalide"),
  })
  .strict();

export const SchemaModificationChambre = SchemaCreationChambre.partial()
  .strict()
  .refine((donnees) => Object.keys(donnees).length > 0, {
    message: "Au moins un champ doit etre fourni",
  });

export const SchemaModificationVoyageur = z
  .object({
    nom: z.string().min(1, "Nom obligatoire").optional(),
    prenom: z.string().min(1, "Prenom obligatoire").optional(),
    telephone: telephoneValide.nullable().optional(),
  })
  .strict()
  .refine((donnees) => Object.keys(donnees).length > 0, {
    message: "Au moins un champ doit etre fourni",
  });
