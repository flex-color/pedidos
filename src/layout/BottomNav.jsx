import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROUTES } from "../constants/routes";
import { puedeAccederSector } from "../routes/SectorRoute";
import "./BottomNav.css";

const navItems = [
  { to: ROUTES.CREAR, label: "Crear", icon: "＋", sectores: ["ARMADOR"] },
  { to: ROUTES.ARMAR, label: "Armar", icon: "▣", sectores: ["ARMADOR"] },
  {
    to: ROUTES.SALIDA_DEPOSITO,
    label: "Salida depósito",
    icon: "✓",
    sectores: ["VALIDADOR"],
  },
  {
    to: ROUTES.CONTROL_LINEA,
    label: "Control línea",
    icon: "◎",
    sectores: ["VALIDADOR"],
  },
  { to: ROUTES.EXPORTAR, label: "Exportar", icon: "↧", sectores: ["EXPORTADOR"] },
  { to: ROUTES.HISTORIAL, label: "Historial", icon: "◷", sectores: null },
];

export default function BottomNav() {
  const { usuario } = useAuth();

  const itemsVisibles = navItems.filter((item) => {
    if (!item.sectores) return true;
    return puedeAccederSector(usuario, item.sectores);
  });

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {itemsVisibles.map((item) => (
        <NavLink key={item.to} to={item.to} className="bottom-nav__link">
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__text">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
