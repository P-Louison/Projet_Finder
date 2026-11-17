export default function ErreurApi({ message, onRetry }) {
  return (
    <main className="page-erreur-api" role="alert">
      <section className="carte-erreur-api">
        <p className="code-erreur-api">503</p>
        <h1>API indisponible</h1>
        <p>{message}</p>
        <button
          className="bouton-recherche bouton-erreur-api"
          type="button"
          onClick={onRetry}
        >
          Actualiser
        </button>
      </section>
    </main>
  );
}
