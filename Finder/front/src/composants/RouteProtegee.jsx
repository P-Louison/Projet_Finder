import { Navigate, useLocation } from "react-router-dom";
import { useJeton } from "../auth";

export default function RouteProtegee({ children }) {
  const location = useLocation();
  const token = useJeton();

  if (!token) {
    return (
      <Navigate to="/connexion" replace state={{ from: location }} />
    );
  }

  return children;
}
