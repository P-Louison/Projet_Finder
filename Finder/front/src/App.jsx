import FicheChambre from "./composants/FicheChambre";
import ErreurApi from "./composants/ErreurApi";
import ListeChambres from "./composants/ListeChambres";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3300";

class ApiIndisponibleError extends Error {
  constructor() {
    super("Le serveur API ne répond pas. Vérifie qu’il est démarré, puis réessaie.");
    this.name = "ApiIndisponibleError";
  }
}

const hotel = {
  id: 1,
  nom: "Sofitel",
  adresse: "rue de QUIBERON",
  ville: "QUIBERON",
};

async function chargerChambres(params) {
  const resultats = await lireApi(
    `${API_URL}/chambres?${params.toString()}`,
  );
  return resultats.map((chambre) => ({
    ...chambre,
    nom: `Chambre ${chambre.numero}`,
    prix: chambre.prixNuit,
  }));
}

async function chargerHotels() {
  return lireApi(`${API_URL}/hotels`);
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

function messageErreur(erreur) {
  return erreur instanceof Error
    ? erreur.message
    : "Impossible de contacter le serveur.";
}

export default function App() {
  const [chambres, setChambres] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selection, setSelection] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");
  const [etatApi, setEtatApi] = useState("chargement");
  const [messageApi, setMessageApi] = useState("");
  const [tentativeApi, setTentativeApi] = useState(0);
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
        const [resultatsChambres, resultatsHotels] = await Promise.all([
          chargerChambres(new URLSearchParams()),
          chargerHotels(),
        ]);
        if (!ignore) {
          setChambres(resultatsChambres);
          setHotels(resultatsHotels);
          setErreur("");
          setMessageApi("");
          setChargement(false);
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

  return (
    <main className="app">
      <section>
        <h1>Chambres disponibles</h1>
        <div className="recherche-panneau">
          <h2 className="recherche-titre">Rechercher une chambre</h2>
          <form className="formulaire-recherche" onSubmit={rechercherChambres}>
            <div className="champ-recherche">
              <label htmlFor="hotel">Hôtel</label>
              <select
                id="hotel"
                name="hotel"
                value={criteres.hotel}
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
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
                placeholder="Ex. 2023-01-01"
                value={criteres.date_debut}
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="date_fin">Date de fin</label>
              <input
                id="date_fin"
                name="date_fin"
                type="date"
                placeholder="Ex. 2023-01-01"
                value={criteres.date_fin}
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
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
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
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
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="categorie">Catégorie</label>
              <select
                id="categorie"
                name="categorie"
                value={criteres.categorie}
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
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
        ) : chargement ? (
          <p>Chargement des chambres...</p>
        ) : (
          <ListeChambres chambres={chambres} onChoix={setSelection} />
        )}
      </section>
      <section>
        <h2 id="titre-detail">Détail de la chambre</h2>
        {selection ? (
          <FicheChambre chambre={selection} hotel={selection.hotel ?? hotel} />
        ) : (
          <p>Choisissez une chambre pour afficher son détail.</p>
        )}
      </section>
    </main>
  );
}
