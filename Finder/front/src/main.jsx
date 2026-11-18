import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { PageAccueil, PageEnConstruction } from "./pages/accueil.jsx";
import Recherches from "./pages/recherches.jsx";
import Reservation from "./pages/reservation.jsx";
import Connexion from "./pages/connexion.jsx";
import Inscription from "./pages/inscription.jsx";
import MesReservations from "./pages/mesReservations.jsx";
import ModifierCompte from "./pages/modifierCompte.jsx";
import RouteProtegee from "./composants/RouteProtegee.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <PageAccueil /> },
      { path: "recherches", element: <Recherches /> },
      {
        path: "mes-reservations",
        element: (
          <RouteProtegee>
            <MesReservations />
          </RouteProtegee>
        ),
      },
      {
        path: "reservation",
        element: (
          <RouteProtegee>
            <Reservation />
          </RouteProtegee>
        ),
      },
      {
        path: "compte",
        element: (
          <RouteProtegee>
            <ModifierCompte />
          </RouteProtegee>
        ),
      },
      { path: "connexion", element: <Connexion /> },
      { path: "inscription", element: <Inscription /> },
      {
        path: "*",
        element: <PageEnConstruction titre="Page introuvable" />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
