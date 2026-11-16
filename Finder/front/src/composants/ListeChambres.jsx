export default function ListeChambres({ chambres, onChoix }) {
  if (chambres.length === 0) {
    return <p>Aucune chambre à afficher.</p>;
  }
  return (
    <ul className="liste-chambres">
      {chambres.map((chambre) => (
        <li key={chambre.id}>
          <button
            className="chambre-choix"
            type="button"
            onClick={() => onChoix(chambre)}
          >
            <strong>{chambre.nom}</strong>
            <span>{chambre.prix} €</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
