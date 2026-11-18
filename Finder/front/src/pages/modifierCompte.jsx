import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { appelApi, ErreurApi } from "../api";

export default function ModifierCompte() {
  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [connexionRequise, setConnexionRequise] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function chargerProfil() {
      try {
        const resultat = await appelApi("/voyageurs/me", { auth: true });
        if (!ignore) {
          setProfil({
            nom: resultat.nom ?? "",
            prenom: resultat.prenom ?? "",
            telephone: resultat.telephone ?? "",
          });
        }
      } catch (e) {
        if (!ignore) {
          if (e instanceof ErreurApi && e.status === 401) {
            setConnexionRequise(true);
          } else {
            setErreur(
              e instanceof Error ? e.message : "Impossible de charger le profil.",
            );
          }
        }
      } finally {
        if (!ignore) {
          setChargement(false);
        }
      }
    }

    chargerProfil();
    return () => {
      ignore = true;
    };
  }, []);

  function changerChamp(e) {
    setProfil((actuel) => ({ ...actuel, [e.target.name]: e.target.value }));
    setSucces("");
  }

  async function enregistrer(e) {
    e.preventDefault();
    setErreur("");
    setSucces("");
    setEnregistrement(true);

    try {
      const resultat = await appelApi("/voyageurs/me", {
        auth: true,
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: profil.nom.trim(),
          prenom: profil.prenom.trim(),
          telephone: profil.telephone.trim() || null,
        }),
      });

      setProfil({
        nom: resultat.nom ?? "",
        prenom: resultat.prenom ?? "",
        telephone: resultat.telephone ?? "",
      });
      setSucces("Votre profil a bien été mis à jour.");
    } catch (e) {
      if (e instanceof ErreurApi && e.status === 401) {
        setConnexionRequise(true);
      } else {
        setErreur(
          e instanceof Error ? e.message : "Impossible de modifier le profil.",
        );
      }
    } finally {
      setEnregistrement(false);
    }
  }

  if (connexionRequise) {
    return (
      <Navigate
        to="/connexion"
        replace
        state={{ message: "Votre session a expiré. Reconnectez-vous." }}
      />
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="accueil-surtitre">VOTRE ESPACE</p>
        <h1>Modifier mon compte</h1>
        <p className="auth-description">
          Modifiez vos coordonnées personnelles.
        </p>

        {chargement ? (
          <p className="reservations-message" role="status">
            Chargement de votre profil...
          </p>
        ) : erreur && !profil ? (
          <p className="auth-message auth-message-erreur" role="alert">
            {erreur}
          </p>
        ) : (
          <>
            {erreur && (
              <p className="auth-message auth-message-erreur" role="alert">
                {erreur}
              </p>
            )}
            {succes && (
              <p className="auth-message auth-message-succes" role="status">
                {succes}
              </p>
            )}
            <form className="auth-form" onSubmit={enregistrer}>
              <div className="auth-field">
                <label htmlFor="compte-prenom">Prénom</label>
                <input
                  id="compte-prenom"
                  name="prenom"
                  autoComplete="given-name"
                  required
                  value={profil.prenom}
                  onChange={changerChamp}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="compte-nom">Nom</label>
                <input
                  id="compte-nom"
                  name="nom"
                  autoComplete="family-name"
                  required
                  value={profil.nom}
                  onChange={changerChamp}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="compte-telephone">
                  Téléphone <span>(facultatif)</span>
                </label>
                <input
                  id="compte-telephone"
                  name="telephone"
                  type="tel"
                  autoComplete="tel"
                  value={profil.telephone}
                  onChange={changerChamp}
                />
              </div>
              <button
                className="bouton-recherche auth-submit"
                type="submit"
                disabled={enregistrement}
              >
                {enregistrement ? "Enregistrement..." : "Enregistrer"}
              </button>
            </form>
            <p className="auth-note">
              L’adresse e-mail et le mot de passe ne sont pas modifiables depuis
              cette page.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
