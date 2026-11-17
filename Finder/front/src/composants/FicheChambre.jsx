export default function FicheChambre({ chambre, hotel }) {
  return (
    <article>
      <h2>{chambre.nom}</h2>
      <p>{chambre.description}</p>
      <p>{chambre.prix} €</p>
    </article>
  );
}
