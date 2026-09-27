import { apiRequest } from "./apiClient";

export function getLineasRequest() {
  return apiRequest("/api/lineas", {
    method: "GET",
  });
}

export function getInsumosPorLineaRequest(lineaId) {
  return apiRequest(`/api/lineas/${lineaId}/insumos`, {
    method: "GET",
  });
}
