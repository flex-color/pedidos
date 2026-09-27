import { apiRequest } from "./apiClient";

export function buscarUsuariosRequest(q = "") {
  const params = new URLSearchParams();

  if (q.trim()) {
    params.set("q", q.trim());
  }

  return apiRequest(`/api/usuarios?${params.toString()}`, {
    method: "GET",
  });
}

export function crearUsuarioRequest(usuario) {
  return apiRequest("/api/usuarios", {
    method: "POST",
    body: JSON.stringify(usuario),
  });
}

export function actualizarUsuarioRequest(idUsuario, usuario) {
  return apiRequest(`/api/usuarios/${idUsuario}`, {
    method: "PUT",
    body: JSON.stringify(usuario),
  });
}

export function borrarUsuarioRequest(idUsuario) {
  return apiRequest(`/api/usuarios/${idUsuario}`, {
    method: "DELETE",
  });
}
