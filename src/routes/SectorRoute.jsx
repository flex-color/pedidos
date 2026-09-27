import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../constants/routes";

export function rutaInicialParaUsuario(usuario) {
  if (!usuario) return ROUTES.LOGIN;
  if (usuario.rol === "ADMIN") return ROUTES.CREAR;

  switch (usuario.sector) {
    case "ARMADOR":
      return ROUTES.CREAR;
    case "VALIDADOR":
      return ROUTES.SALIDA_DEPOSITO;
    case "EXPORTADOR":
      return ROUTES.EXPORTAR;
    case "TODO":
      return ROUTES.CREAR;
    default:
      return ROUTES.HISTORIAL;
  }
}

export function puedeAccederSector(usuario, sectoresPermitidos) {
  if (!usuario) return false;
  if (usuario.rol === "ADMIN") return true;
  if (usuario.sector === "TODO") return true;
  return sectoresPermitidos.includes(usuario.sector);
}

export default function SectorRoute({ sectoresPermitidos }) {
  const { usuario } = useAuth();

  if (!puedeAccederSector(usuario, sectoresPermitidos)) {
    return <Navigate to={rutaInicialParaUsuario(usuario)} replace />;
  }

  return <Outlet />;
}
