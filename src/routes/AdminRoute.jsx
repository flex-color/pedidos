import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../constants/routes";

export default function AdminRoute() {
  const { usuario } = useAuth();

  if (usuario?.rol !== "ADMIN") {
    return <Navigate to={ROUTES.HISTORIAL} replace />;
  }

  return <Outlet />;
}
