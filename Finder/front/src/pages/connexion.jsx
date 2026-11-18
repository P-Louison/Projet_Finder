import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { appelApi } from "../api";
import { setJeton } from "../auth";

export default function Connexion() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function connecter(e) {
    e.preventDefault();
    setErreur("");
    setChargement(true);

    try {
      const donnees = await appelApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), motDePasse }),
      });

      if (typeof donnees?.token !== "string" || donnees.token.length === 0) {
        throw new Error("La réponse du serveur ne contient pas de jeton.");
      }

      setJeton(donnees.token);
      navigate("/recherches", { replace: true });
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Impossible de se connecter.",
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="accueil-surtitre">HEUREUX DE VOUS REVOIR</p>
        <h1>Connexion</h1>
        <p className="auth-description">
          Connectez-vous pour retrouver vos réservations et préparer votre
          prochain séjour.
        </p>
        {location.state?.message && (
          <p className="auth-message auth-message-succes" role="status">
            {location.state.message}
          </p>
        )}
        {location.state?.from && (
          <p className="auth-message" role="status">
            Connectez-vous pour accéder à cette page.
          </p>
        )}
        {erreur && (
          <p className="auth-message auth-message-erreur" role="alert">
            {erreur}
          </p>
        )}
        <form className="auth-form" onSubmit={connecter}>
          <div className="auth-field">
            <label htmlFor="connexion-email">Adresse e-mail</label>
            <input
              id="connexion-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="connexion-mot-de-passe">Mot de passe</label>
            <input
              id="connexion-mot-de-passe"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>
          <button
            className="bouton-recherche auth-submit"
            type="submit"
            disabled={chargement}
          >
            {chargement ? "Connexion..." : "Se connecter"}
          </button>
        </form>
        <p className="auth-alternative">
          Pas encore de compte ? <Link to="/inscription">Créer un compte</Link>
        </p>
      </div>
    </section>
  );
}
