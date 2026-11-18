import { effacerJeton, jeton } from "./auth";
import { API } from "./config";

export class ErreurApi extends Error {
  constructor(message, status = null) {
    super(message);
    this.name = "ErreurApi";
    this.status = status;
  }
}

export async function appelApi(chemin, options = {}) {
  const { auth = false, ...optionsFetch } = options;
  const headers = new Headers(optionsFetch.headers);

  if (auth) {
    const token = jeton();
    if (!token) {
      throw new ErreurApi("Connexion requise.", 401);
    }
    headers.set("Authorization", `Bearer ${token}`);
  }

  let reponse;
  try {
    reponse = await fetch(`${API}${chemin}`, {
      ...optionsFetch,
      headers,
    });
  } catch {
    throw new ErreurApi(
      "Impossible de contacter le serveur. Vérifiez que l’API est démarrée.",
    );
  }

  if (auth && reponse.status === 401) {
    effacerJeton();
  }

  let donnees = null;
  if (reponse.status !== 204) {
    try {
      donnees = await reponse.json();
    } catch {
      throw new ErreurApi(
        "Le serveur a renvoyé une réponse illisible.",
        reponse.status,
      );
    }
  }

  if (!reponse.ok) {
    throw new ErreurApi(
      donnees?.erreur ??
        `Le serveur a répondu avec le code HTTP ${reponse.status}.`,
      reponse.status,
    );
  }

  return donnees;
}
