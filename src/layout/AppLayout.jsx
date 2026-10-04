import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { logoutRequest } from "../api/authApi";
import { ROUTES } from "../constants/routes";
import BottomNav from "./BottomNav";
import "./AppLayout.css";

export default function AppLayout() {
  const navigate = useNavigate();
  const { usuario, cerrarSesionLocal } = useAuth();

  async function handleLogout() {
    try {
      await logoutRequest();
    } catch {
      // Igual cerramos la sesión local del frontend.
    } finally {
      cerrarSesionLocal();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <strong>FlexColor</strong>
          <span>Sistema de pedidos</span>
        </div>

        <div className="app-header__actions">
          {usuario?.rol === "ADMIN" && (
            <Link to={ROUTES.ADMIN} className="app-header__admin-link">
              Admin
            </Link>
          )}

          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
