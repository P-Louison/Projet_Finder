import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { appelApi, ErreurApi } from "../api";

export default function Reservation() {
  const [parametres] = useSearchParams();
  const navigate = useNavigate();
  const chambreId = Number(parametres.get("chambre_id"));
  const chambreValide = Number.isInteger(chambreId) && chambreId > 0;
  const [dateArrivee, setDateArrivee] = useState("");
  const [dateDepart, setDateDepart] = useState("");
  const [nombrePersonnes, setNombrePersonnes] = useState("1");
  const [demandeSpeciale, setDemandeSpeciale] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);
  const [connexionRequise, setConnexionRequise] = useState(false);

  async function reserver(e) {
    e.preventDefault();
    setErreur("");

    if (!dateArrivee || !dateDepart || dateDepart <= dateArrivee) {
      setErreur("La date de départ doit être postérieure à la date d’arrivée.");
      return;
    }

    setChargement(true);
    try {
      await appelApi("/reservations", {
        auth: true,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chambre_id: chambreId,
          date_arrivee: new Date(
            `${dateArrivee}T15:00:00.000Z`,
          ).toISOString(),
          date_depart: new Date(`${dateDepart}T11:00:00.000Z`).toISOString(),
          nb_personne: Number(nombrePersonnes),
          statut: "en_attente",
          demande_special: demandeSpeciale.trim(),
        }),
      });

      navigate("/mes-reservations", {
        replace: true,
        state: { message: "Votre demande de réservation a bien été envoyée." },
      });
    } catch (e) {
      if (e instanceof ErreurApi && e.status === 401) {
        setConnexionRequise(true);
      } else {
        setErreur(
          e instanceof Error ? e.message : "Impossible de créer la réservation.",
        );
      }
    } finally {
      setChargement(false);
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

  if (!chambreValide) {
    return (
      <section className="reservation-page">
        <div className="reservation-form-card">
          <h1>Choisissez d’abord une chambre</h1>
          <p>Relancez une recherche pour sélectionner la chambre à réserver.</p>
          <Link className="bouton-recherche reservation-submit" to="/recherches">
            Rechercher une chambre
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="reservation-page">
      <header className="page-heading">
        <p className="accueil-surtitre">VOTRE SÉJOUR</p>
        <h1>Réserver la chambre {chambreId}</h1>
        <p>Indiquez vos dates et le nombre de voyageurs.</p>
      </header>

      <form className="reservation-form-card" onSubmit={reserver}>
        {erreur && (
          <p className="auth-message auth-message-erreur" role="alert">
            {erreur}
          </p>
        )}
        <div className="reservation-form-grid">
          <div className="auth-field">
            <label htmlFor="date-arrivee">Date d’arrivée</label>
            <input
              id="date-arrivee"
              type="date"
              required
              value={dateArrivee}
              onChange={(e) => setDateArrivee(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="date-depart">Date de départ</label>
            <input
              id="date-depart"
              type="date"
              required
              min={dateArrivee || undefined}
              value={dateDepart}
              onChange={(e) => setDateDepart(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="nombre-personnes">Nombre de voyageurs</label>
            <input
              id="nombre-personnes"
              type="number"
              min="1"
              step="1"
              required
              value={nombrePersonnes}
              onChange={(e) => setNombrePersonnes(e.target.value)}
            />
          </div>
          <div className="auth-field reservation-field-full">
            <label htmlFor="demande-speciale">
              Demande spéciale <span>(facultatif, 200 caractères maximum)</span>
            </label>
            <textarea
              id="demande-speciale"
              rows="4"
              maxLength={200}
              value={demandeSpeciale}
              onChange={(e) => setDemandeSpeciale(e.target.value)}
            />
          </div>
        </div>
        <div className="reservation-actions">
          <Link to="/recherches">Retour à la recherche</Link>
          <button
            className="bouton-recherche reservation-submit"
            type="submit"
            disabled={chargement}
          >
            {chargement ? "Envoi..." : "Confirmer la demande"}
          </button>
        </div>
      </form>
    </section>
  );
}