export default function FicheHotel({ hotel }) {
  return (
    <article>
      <h2>{hotel.nom}</h2>
      <p>{hotel.adresse}</p>
      <p>{hotel.ville}</p>
    </article>
  );
}
