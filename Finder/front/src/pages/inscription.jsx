import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { appelApi } from "../api";

export default function Inscription() {
  const navigate = useNavigate();
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  async function inscrire(e) {
    e.preventDefault();
    setErreur("");

    if (motDePasse !== confirmation) {
      setErreur("Les mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);
    try {
      await appelApi("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          motDePasse,
          nom: nom.trim(),
          prenom: prenom.trim(),
          telephone: telephone.trim() || null,
        }),
      });

      navigate("/connexion", {
        replace: true,
        state: { message: "Votre compte est créé. Vous pouvez vous connecter." },
      });
    } catch (e) {
      setErreur(
        e instanceof Error ? e.message : "Impossible de créer le compte.",
      );
    } finally {
      setChargement(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card auth-card-large">
        <p className="accueil-surtitre">BIENVENUE CHEZ FINDER</p>
        <h1>Créer un compte</h1>
        <p className="auth-description">
          Quelques informations pour commencer à organiser vos séjours.
        </p>
        {erreur && (
          <p className="auth-message auth-message-erreur" role="alert">
            {erreur}
          </p>
        )}
        <form className="auth-form auth-form-grid" onSubmit={inscrire}>
          <div className="auth-field">
            <label htmlFor="inscription-prenom">Prénom</label>
            <input
              id="inscription-prenom"
              name="prenom"
              autoComplete="given-name"
              required
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="inscription-nom">Nom</label>
            <input
              id="inscription-nom"
              name="nom"
              autoComplete="family-name"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>
          <div className="auth-field auth-field-full">
            <label htmlFor="inscription-email">Adresse e-mail</label>
            <input
              id="inscription-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="auth-field auth-field-full">
            <label htmlFor="inscription-telephone">
              Téléphone <span>(facultatif)</span>
            </label>
            <input
              id="inscription-telephone"
              name="telephone"
              type="tel"
              autoComplete="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="inscription-mot-de-passe">Mot de passe</label>
            <input
              id="inscription-mot-de-passe"
              name="motDePasse"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="inscription-confirmation">
              Confirmer le mot de passe
            </label>
            <input
              id="inscription-confirmation"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              minLength={6}
              required
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
          </div>
          <button
            className="bouton-recherche auth-submit auth-field-full"
            type="submit"
            disabled={chargement}
          >
            {chargement ? "Création du compte..." : "Créer mon compte"}
          </button>
        </form>
        <p className="auth-alternative">
          Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
        </p>
      </div>
    </section>
  );
}