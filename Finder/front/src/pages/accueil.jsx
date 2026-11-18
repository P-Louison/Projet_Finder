import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { effacerJeton, useJeton } from "../auth";

export function PageEnConstruction({ titre }) {
  return (
    <section className="page-en-construction">
      <p className="accueil-surtitre">BIENTÔT DISPONIBLE</p>
      <h1>{titre}</h1>
      <p>Cette page est en préparation. Revenez bientôt pour la découvrir.</p>
      <Link className="bouton-recherche" to="/">
        Retour à l’accueil
      </Link>
    </section>
  );
}

export function PageAccueil() {
  return (
    <div className="accueil-page">
      <section className="accueil-hero">
        <div className="accueil-hero-content">
          <p className="accueil-surtitre">VOTRE PROCHAINE ESCAPADE</p>
          <h1>
            Le bon séjour,
            <br />
            au bon endroit.
          </h1>
          <p className="accueil-description">
            Trouvez une chambre qui vous ressemble. Choisissez vos critères,
            comparez les disponibilités et préparez votre prochain départ.
          </p>
          <Link className="accueil-hero-button" to="/recherches">
            Trouver une chambre <span aria-hidden="true">→</span>
          </Link>
          <div className="accueil-points">
            <span>Des hôtels sélectionnés</span>
            <span>Une recherche simple</span>
            <span>Votre séjour, à votre rythme</span>
          </div>
        </div>
        <div className="accueil-hero-art" aria-hidden="true">
          <div className="accueil-art-sun" />
          <div className="accueil-art-card">
            <span className="accueil-art-label">PROCHAINE ESCALE</span>
            <strong>
              La chambre
              <br />
              qui vous attend.
            </strong>
            <span className="accueil-art-stars">✦ ✦ ✦ ✦ ✦</span>
          </div>
          <span className="accueil-art-orbit accueil-art-orbit-one" />
          <span className="accueil-art-orbit accueil-art-orbit-two" />
        </div>
      </section>

    </div>
  );
}

export default function Accueil() {
  const navigate = useNavigate();
  const token = useJeton();

  function deconnecter() {
    effacerJeton();
    navigate("/", { replace: true });
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <Link className="site-brand" to="/" aria-label="Finder, accueil">
            <span className="site-brand-mark" aria-hidden="true">
              F
            </span>
            <span>
              <strong>finder</strong>
              <small>VOTRE PROCHAIN SÉJOUR</small>
            </span>
          </Link>
          <nav className="site-navigation" aria-label="Navigation principale">
            <NavLink
              end
              to="/"
              className={({ isActive }) =>
                `site-nav-link${isActive ? " is-active" : ""}`
              }
            >
              Accueil
            </NavLink>
            <NavLink
              to="/recherches"
              className={({ isActive }) =>
                `site-nav-link${isActive ? " is-active" : ""}`
              }
            >
              Rechercher
            </NavLink>
            <NavLink
              to="/reservation"
              className={({ isActive }) =>
                `site-nav-link${isActive ? " is-active" : ""}`
              }
            >
              Réservation
            </NavLink>
            <NavLink
              to="/mes-reservations"
              className={({ isActive }) =>
                `site-nav-link${isActive ? " is-active" : ""}`
              }
            >
              Mes réservations
            </NavLink>
            {token ? (
              <>
                <NavLink
                  to="/compte"
                  className={({ isActive }) =>
                    `site-nav-link${isActive ? " is-active" : ""}`
                  }
                >
                  Modifier mon compte
                </NavLink>
                <button
                  className="site-nav-link site-nav-cta site-nav-button"
                  type="button"
                  onClick={deconnecter}
                >
                  Se déconnecter
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/connexion"
                  className={({ isActive }) =>
                    `site-nav-link${isActive ? " is-active" : ""}`
                  }
                >
                  Connexion
                </NavLink>
                <NavLink
                  to="/inscription"
                  className={({ isActive }) =>
                    `site-nav-link site-nav-cta${isActive ? " is-active" : ""}`
                  }
                >
                  Créer un compte
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <span>finder</span>
        <span>Le bon séjour commence ici.</span>
      </footer>
    </div>
  );
}
