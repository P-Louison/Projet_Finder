export default function FicheHotel({ hotel }) {
  const lieu = [hotel.ville, hotel.adresse, hotel.code_postal]
    .filter((valeur) => valeur !== null && valeur !== undefined && valeur !== "")
    .join(", ");

  return (
    <article className="fiche-hotel">
      <h2>
        {hotel.id} : {hotel.nom}
      </h2>
      {lieu && (
        <p className="fiche-hotel-lieu">
          <strong>Lieu :</strong> {lieu}
        </p>
      )}
      <div className="fiche-hotel-informations">
        <h3>Informations</h3>
        {hotel.gerant && (
          <p>
            <strong>Gérant :</strong> {hotel.gerant}
          </p>
        )}
        {hotel.etoile !== null && hotel.etoile !== undefined && (
          <p>
            <strong>Nombre d’étoiles :</strong> {hotel.etoile}
          </p>
        )}
        {hotel.description && (
          <p>
            <strong>Description :</strong> {hotel.description}
          </p>
        )}
      </div>
    </article>
  );
}
