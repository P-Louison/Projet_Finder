export default function Recherche() {
  const [criteres, setCriteres] = useState({
    hotel: "",
    date_debut: "",
    date_fin: "",
    capacite: "",
    prix_max: "",
    categorie: "",
  });
  function changer(e) {
    setCriteres({ ...criteres, [e.target.name]: e.target.value });
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault(); /* question 2 */
      }}
    >
      <input name="titre" value={criteres.titre} onChange={changer} />

      <input name="anneeMax" value={criteres.anneeMax} onChange={changer} />
      <button type="submit">Rechercher</button>
    </form>
  );
}
