import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../constants/routes";

export default function PrivateRoute() {
  const { status } = useAuth();

  if (status === "checking") {
    return <div style={{ padding: 24, fontWeight: 800 }}>Verificando sesión...</div>;
  }

  if (status === "unauthenticated") {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}
