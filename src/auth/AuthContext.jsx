import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCurrentUserRequest } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [status, setStatus] = useState("checking");

  function cerrarSesionLocal() {
    setUsuario(null);
    setStatus("unauthenticated");
  }

  async function refrescarUsuario() {
    try {
      setStatus("checking");
      const data = await getCurrentUserRequest();
      setUsuario(data);
      setStatus("authenticated");
      return data;
    } catch (error) {
      cerrarSesionLocal();
      throw error;
    }
  }

  useEffect(() => {
    let activo = true;

    getCurrentUserRequest()
      .then((data) => {
        if (!activo) return;
        setUsuario(data);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!activo) return;
        setUsuario(null);
        setStatus("unauthenticated");
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      cerrarSesionLocal();
    }

    window.addEventListener(
      "auth:unauthorized",
      handleUnauthorized
    );

    return () => {
      window.removeEventListener(
        "auth:unauthorized",
        handleUnauthorized
      );
    };
  }, []);

  const value = useMemo(
    () => ({
      usuario,
      status,
      setUsuario,
      refrescarUsuario,
      cerrarSesionLocal,
    }),
    [usuario, status]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth debe usarse dentro de AuthProvider"
    );
  }

  return contexto;
}
