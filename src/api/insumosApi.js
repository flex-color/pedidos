import {
  apiDownload,
  apiRequest,
} from "./apiClient";

export function buscarInsumosRequest(q = "") {
  const params = new URLSearchParams();

  if (q.trim()) {
    params.set("q", q.trim());
  }

  const query = params.toString();

  return apiRequest(
    query
      ? `/api/insumos?${query}`
      : "/api/insumos",
    {
      method: "GET",
    }
  );
}

export function crearInsumoRequest(insumo) {
  return apiRequest("/api/insumos", {
    method: "POST",
    body: JSON.stringify(insumo),
  });
}

export function actualizarInsumoRequest(
  idInsumo,
  insumo
) {
  return apiRequest(
    `/api/insumos/${idInsumo}`,
    {
      method: "PUT",
      body: JSON.stringify(insumo),
    }
  );
}

export function borrarInsumoRequest(idInsumo) {
  return apiRequest(
    `/api/insumos/${idInsumo}`,
    {
      method: "DELETE",
    }
  );
}

export function importarInsumosRequest(archivo) {
  if (!archivo) {
    throw new Error(
      "Debés seleccionar un archivo Excel."
    );
  }

  const formData = new FormData();

  formData.append(
    "archivo",
    archivo
  );

  return apiRequest(
    "/api/insumos/importar",
    {
      method: "POST",
      body: formData,
    }
  );
}

export function descargarInsumosRequest() {
  return apiDownload(
    "/api/insumos/exportar",
    "insumos.xlsx"
  );
}

export function borrarTodosInsumosRequest() {
  return apiRequest("/api/insumos/todos", {
    method: "DELETE",
  });
}