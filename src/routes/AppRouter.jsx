import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "../auth/AuthContext";
import AppLayout from "../layout/AppLayout";
import AdminPage from "../features/admin/AdminPage";
import ArmarPage from "../features/armar/ArmarPage";
import CrearPage from "../features/crear/CrearPage";
import ExportarPage from "../features/exportar/ExportarPage";
import HistorialPage from "../features/historial/HistorialPage";
import LoginPage from "../features/auth/LoginPage";
import RevisionSalidaDepositoPage from "../features/salida-deposito/RevisionSalidaDepositoPage";
import ControlEnLineaPage from "../features/control-linea/ControlEnLineaPage";
import { ROUTES } from "../constants/routes";
import AdminRoute from "./AdminRoute";
import PrivateRoute from "./PrivateRoute";
import SectorRoute, { rutaInicialParaUsuario } from "./SectorRoute";

function InicioProtegido() {
  const { usuario } = useAuth();
  return <Navigate to={rutaInicialParaUsuario(usuario)} replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />

      <Route
        element={
          <AuthProvider>
            <PrivateRoute />
          </AuthProvider>
        }
      >
        <Route element={<AppLayout />}>
          <Route path="/" element={<InicioProtegido />} />

          <Route element={<SectorRoute sectoresPermitidos={["ARMADOR"]} />}>
            <Route path={ROUTES.CREAR} element={<CrearPage />} />
            <Route path={ROUTES.ARMAR} element={<ArmarPage />} />
          </Route>

          <Route element={<SectorRoute sectoresPermitidos={["VALIDADOR"]} />}>
            <Route
              path={ROUTES.SALIDA_DEPOSITO}
              element={<RevisionSalidaDepositoPage />}
            />
            <Route path={ROUTES.CONTROL_LINEA} element={<ControlEnLineaPage />} />
          </Route>

          <Route element={<SectorRoute sectoresPermitidos={["EXPORTADOR"]} />}>
            <Route path={ROUTES.EXPORTAR} element={<ExportarPage />} />
          </Route>

          <Route path={ROUTES.HISTORIAL} element={<HistorialPage />} />

          <Route element={<AdminRoute />}>
            <Route path={ROUTES.ADMIN} element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
    </Routes>
  );
}
