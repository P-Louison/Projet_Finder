import FicheChambre from "./composants/FicheChambre";
import ListeChambres from "./composants/ListeChambres";
import { useState } from "react";

const hotel = {
  id: 1,
  nom: "Sofitel",
  adresse: "rue de QUIBERON",
  ville: "QUIBERON",
};

const listeChambres = [
  {
    id: 1,
    nom: "Chambre 1",
    description: "Une chambre confortable",
    prix: 100,
  },
  {
    id: 2,
    nom: "Chambre 2",
    description: "Une chambre spacieuse",
    prix: 150,
  },
  {
    id: 3,
    nom: "Chambre 3",
    description: "Une chambre luxueuse",
    prix: 200,
  },
  {
    id: 4,
    nom: "Chambre 4",
    description: "Une chambre moderne",
    prix: 250,
  },
  {
    id: 5,
    nom: "Chambre 5",
    description: "Une chambre lumineuse",
    prix: 180,
  },
  {
    id: 6,
    nom: "Chambre 6",
    description: "Une chambre avec vue",
    prix: 220,
  },
  {
    id: 7,
    nom: "Chambre 7",
    description: "Une chambre calme",
    prix: 160,
  },
  {
    id: 8,
    nom: "Chambre 8",
    description: "Une chambre familiale",
    prix: 280,
  },
  {
    id: 9,
    nom: "Chambre 9",
    description: "Une chambre elegante",
    prix: 240,
  },
  {
    id: 10,
    nom: "Chambre 10",
    description: "Une chambre avec balcon",
    prix: 260,
  },
  {
    id: 11,
    nom: "Chambre 11",
    description: "Une chambre spacieuse",
    prix: 300,
  },
  {
    id: 12,
    nom: "Chambre 12",
    description: "Une chambre premium",
    prix: 350,
  },
];

export default function App({ chambres: chambresInitiales = listeChambres }) {
  const [chambres] = useState(chambresInitiales);
  const [selection, setSelection] = useState(null);
  const [criteres, setCriteres] = useState({
    hotel: "",
    date_debut: "",
    date_fin: "",
    capacite: "",
    prix_max: "",
    categorie: "",
    titre: "",
    anneeMax: "",
  });

  return (
    <main className="app">
      <section>
        <h1>Chambres disponibles</h1>
        <div className="recherche-panneau">
          <h2 className="recherche-titre">Rechercher une chambre</h2>
          <form
            className="formulaire-recherche"
            onSubmit={(e) => e.preventDefault()}
          >
            <div className="champ-recherche">
              <label htmlFor="titre">Titre ou mot-clé</label>
              <input
                id="titre"
                name="titre"
                placeholder="Ex. chambre avec vue"
                value={criteres.titre}
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
              />
            </div>
            <div className="champ-recherche">
              <label htmlFor="anneeMax">Année maximum</label>
              <input
                id="anneeMax"
                name="anneeMax"
                type="number"
                placeholder="Ex. 2026"
                value={criteres.anneeMax}
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
              <input
                id="categorie"
                name="categorie"
                placeholder="Ex. familiale"
                value={criteres.categorie}
                onChange={(e) =>
                  setCriteres({ ...criteres, [e.target.name]: e.target.value })
                }
              />
            </div>
            <button className="bouton-recherche" type="submit">
              Rechercher
            </button>
          </form>
        </div>
        <ListeChambres chambres={chambres} onChoix={setSelection} />
      </section>
      <section>
        <h2 id="titre-detail">Détail de la chambre</h2>
        {selection ? (
          <FicheChambre chambre={selection} hotel={hotel} />
        ) : (
          <p>Choisissez une chambre pour afficher son détail.</p>
        )}
      </section>
    </main>
  );
}
