import { useEffect, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { appelApi, ErreurApi } from "../api";

function afficherDate(date) {
  const valeur = new Date(date);
  return Number.isNaN(valeur.getTime())
    ? date
    : valeur.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export default function MesReservations() {
  const location = useLocation();
  const [reservations, setReservations] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [connexionRequise, setConnexionRequise] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function chargerReservations() {
      try {
        const resultat = await appelApi("/reservations/mine", { auth: true });
        if (!Array.isArray(resultat)) {
          throw new Error("La réponse des réservations est invalide.");
        }
        if (!ignore) {
          setReservations(resultat);
        }
      } catch (e) {
        if (!ignore) {
          if (e instanceof ErreurApi && e.status === 401) {
            setConnexionRequise(true);
          } else {
            setErreur(
              e instanceof Error
                ? e.message
                : "Impossible de charger vos réservations.",
            );
          }
        }
      } finally {
        if (!ignore) {
          setChargement(false);
        }
      }
    }

    chargerReservations();
    return () => {
      ignore = true;
    };
  }, []);

  if (connexionRequise) {
    return <Navigate to="/connexion" replace />;
  }

  return (
    <section className="reservations-page">
      <header className="page-heading">
        <p className="accueil-surtitre">VOTRE ESPACE</p>
        <h1>Mes réservations</h1>
        <p>Retrouvez ici les détails de vos séjours.</p>
      </header>

      {location.state?.message && (
        <p className="auth-message auth-message-succes" role="status">
          {location.state.message}
        </p>
      )}

      {chargement ? (
        <p className="reservations-message" role="status">
          Chargement de vos réservations...
        </p>
      ) : erreur ? (
        <p className="auth-message auth-message-erreur" role="alert">
          {erreur}
        </p>
      ) : reservations.length === 0 ? (
        <div className="reservations-message">
          <p>Vous n’avez pas encore de réservation.</p>
          <Link className="bouton-recherche bouton-reservation" to="/recherches">
            Trouver une chambre
          </Link>
        </div>
      ) : (
        <div className="reservations-list">
          {reservations.map((reservation) => (
            <article className="reservation-card" key={reservation.id}>
              <div className="reservation-card-heading">
                <div>
                  <p className="reservation-label">
                    RÉSERVATION #{reservation.id}
                  </p>
                  <h2>Chambre {reservation.chambre.numero}</h2>
                </div>
                <span className="reservation-statut">{reservation.statut}</span>
              </div>
              <p className="reservation-hotel">
                {reservation.chambre.hotel?.nom ?? "Hôtel"}
                <span>
                  {" "}
                  · Hôtel #
                  {reservation.chambre.hotel?.id ??
                    reservation.chambre.hotel_id}
                </span>
              </p>
              <p className="reservation-categorie">
                {reservation.chambre.categorie}
              </p>
              <div className="reservation-dates">
                <p>
                  <span>Arrivée</span>
                  <strong>{afficherDate(reservation.date_arrivee)}</strong>
                </p>
                <p>
                  <span>Départ</span>
                  <strong>{afficherDate(reservation.date_depart)}</strong>
                </p>
                <p>
                  <span>Voyageurs</span>
                  <strong>{reservation.nb_personnes}</strong>
                </p>
              </div>
              {reservation.chambre.prixNuit && (
                <p className="reservation-prix">
                  {reservation.chambre.prixNuit} € <span>/ nuit</span>
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}