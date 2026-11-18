import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API } from "../config";
import ErreurApi from "../composants/ErreurApi";
import FicheChambre from "../composants/FicheChambre";
import FicheHotel from "../composants/FicheHotel";
import ListeChambres from "../composants/ListeChambres";

class ApiIndisponibleError extends Error {
  constructor() {
    super(
      "Le serveur API ne répond pas. Vérifie qu’il est démarré, puis réessaie.",
    );
    this.name = "ApiIndisponibleError";
  }
}

function messageErreur(erreur) {
  return erreur instanceof Error
    ? erreur.message
    : "Impossible de contacter le serveur.";
}

async function lireApi(url) {
  let reponse;
  try {
    reponse = await fetch(url);
  } catch {
    throw new ApiIndisponibleError();
  }

  if (reponse.status === 404 || reponse.status >= 500) {
    throw new ApiIndisponibleError();
  }
  if (!reponse.ok) {
    throw new Error(`L’API a répondu avec le code HTTP ${reponse.status}.`);
  }
  return reponse.json();
}

async function chargerChambres(params) {
  const resultats = await lireApi(`${API}/chambres?${params.toString()}`);
  return resultats.map((chambre) => ({
    ...chambre,
    nom: `Chambre ${chambre.numero}`,
    prix: chambre.prixNuit,
  }));
}

async function chargerHotels() {
  return lireApi(`${API}/hotels`);
}

export default function Recherches() {
  const [chambres, setChambres] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selection, setSelection] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [etatApi, setEtatApi] = useState("chargement");
  const [messageApi, setMessageApi] = useState("");
  const [tentativeApi, setTentativeApi] = useState(0);
  const [rechercheEffectuee, setRechercheEffectuee] = useState(false);
  const [criteres, setCriteres] = useState({
    hotel: "",
    date_debut: "",
    date_fin: "",
    capacite: "",
    prix_max: "",
    categorie: "",
  });

  useEffect(() => {
    let ignore = false;

    async function charger() {
      setEtatApi("chargement");
      try {
        const resultatsHotels = await chargerHotels();
        if (!ignore) {
          setHotels(resultatsHotels);
          setErreur("");
          setMessageApi("");
          setEtatApi("pret");
        }
      } catch (e) {
        if (!ignore) {
          setMessageApi(messageErreur(e));
          setEtatApi("erreur");
        }
      }
    }

    charger();
    return () => {
      ignore = true;
    };
  }, [tentativeApi]);

  async function rechercherChambres(e) {
    e.preventDefault();
    setChargement(true);
    setRechercheEffectuee(true);
    setErreur("");
    setSelection(null);

    const params = new URLSearchParams();
    if (criteres.hotel) params.set("hotel_id", criteres.hotel);
    if (criteres.date_debut) params.set("date_debut", criteres.date_debut);
    if (criteres.date_fin) params.set("date_fin", criteres.date_fin);
    if (criteres.capacite) params.set("capacite", criteres.capacite);
    if (criteres.prix_max) params.set("prix_max", criteres.prix_max);
    if (criteres.categorie) params.set("categorie", criteres.categorie);

    try {
      setChambres(await chargerChambres(params));
    } catch (e) {
      if (e instanceof ApiIndisponibleError) {
        setMessageApi(e.message);
        setEtatApi("erreur");
      } else {
        setErreur(messageErreur(e));
      }
    } finally {
      setChargement(false);
    }
  }

  if (etatApi === "erreur") {
    return (
      <ErreurApi
        message={messageApi}
        onRetry={() => setTentativeApi((tentative) => tentative + 1)}
      />
    );
  }

  if (etatApi === "chargement") {
    return (
      <main className="attente-api" role="status">
        Connexion à l’API...
      </main>
    );
  }

  const hotelSelectionne = hotels.find(
    (hotelOption) => String(hotelOption.id) === criteres.hotel,
  );
  const hotelDeSelection =
    selection?.hotel ??
    hotels.find(
      (hotelOption) => hotelOption.id === selection?.hotel_id,
    ) ??
    hotelSelectionne;

  function changerCritere(e) {
    setCriteres((actuels) => ({
      ...actuels,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <div className="app">
      <header className="page-heading">
        <p className="accueil-surtitre">RECHERCHE EN ACCÈS LIBRE</p>
        <h1>Trouvez la chambre qui vous convient</h1>
        <p>Choisissez vos critères et comparez les chambres disponibles.</p>
      </header>
      <header className="app-entete">
        {hotelSelectionne && (
          <div className="fiche-hotel-panneau">
            <FicheHotel hotel={hotelSelectionne} />
          </div>
        )}
      </header>
      <section>
        <div className="recherche-panneau">
          <h2 className="recherche-titre">Vos critères de recherche</h2>
          <form
            id="formulaire-recherche"
            className="formulaire-recherche"
            onSubmit={rechercherChambres}
          >
            <div className="champ-recherche">
              <label htmlFor="hotel">Hôtel</label>
              <select
                id="hotel"
                name="hotel"
                value={criteres.hotel}
                onChange={changerCritere}
              >
                <option value="">Tous les hôtels</option>
                {hotels.map((hotelOption) => (
                  <option key={hotelOption.id} value={hotelOption.id}>
                    {hotelOption.id} : {hotelOption.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="champ-recherche">
              <label htmlFor="date_debut">Date de début</label>
              <input
                id="date_debut"
                name="date_debut"
                type="date"
                value={criteres.date_debut}
                onChange={changerCritere}
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="date_fin">Date de fin</label>
              <input
                id="date_fin"
                name="date_fin"
                type="date"
                value={criteres.date_fin}
                onChange={changerCritere}
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="prix_max">Prix maximum (€)</label>
              <input
                id="prix_max"
                name="prix_max"
                type="number"
                placeholder="Ex. 150"
                value={criteres.prix_max}
                onChange={changerCritere}
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="capacite">Capacité</label>
              <input
                id="capacite"
                name="capacite"
                type="number"
                placeholder="Nombre de personnes"
                value={criteres.capacite}
                onChange={changerCritere}
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="categorie">Catégorie</label>
              <select
                id="categorie"
                name="categorie"
                value={criteres.categorie}
                onChange={changerCritere}
              >
                <option value="">Toutes les catégories</option>
                <option value="simple">Simple</option>
                <option value="double">Double</option>
                <option value="familiale">Familiale</option>
                <option value="suite">Suite</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            <button
              className="bouton-recherche"
              type="submit"
              disabled={chargement}
            >
              {chargement ? "Recherche..." : "Rechercher"}
            </button>
          </form>
        </div>
        {erreur ? (
          <p role="alert">{erreur}</p>
        ) : !rechercheEffectuee ? (
          <p className="recherche-message-initial">
            Vos résultats apparaîtront ici après votre recherche.
          </p>
        ) : chargement ? (
          <p>Chargement des chambres...</p>
        ) : chambres.length === 0 ? (
          <p className="recherche-message-initial">
            Aucune chambre ne correspond à ces critères. Essayez de les
            modifier.
          </p>
        ) : (
          <ListeChambres
            chambres={chambres}
            onChoix={setSelection}
            selectionId={selection?.id}
          />
        )}
      </section>
      {selection && (
        <section className="detail-panneau">
          <FicheChambre chambre={selection} hotel={hotelDeSelection} />
          <Link
            className="bouton-recherche bouton-reservation"
            to={`/reservation?chambre_id=${selection.id}`}
          >
            Réserver cette chambre
          </Link>
        </section>
      )}
    </div>
  );
}
