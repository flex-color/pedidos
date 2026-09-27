import {
  apiDownload,
  apiRequest,
} from "./apiClient";

export function buscarLineasRequest(q = "") {
  const params = new URLSearchParams();

  if (q.trim()) {
    params.set("q", q.trim());
  }

  const query = params.toString();

  return apiRequest(
    query
      ? `/api/lineas?${query}`
      : "/api/lineas",
    {
      method: "GET",
    }
  );
}

export function crearLineaRequest(linea) {
  return apiRequest("/api/lineas", {
    method: "POST",
    body: JSON.stringify(linea),
  });
}

export function actualizarLineaRequest(
  idLinea,
  linea
) {
  return apiRequest(
    `/api/lineas/${idLinea}`,
    {
      method: "PUT",
      body: JSON.stringify(linea),
    }
  );
}

export function borrarLineaRequest(idLinea) {
  return apiRequest(
    `/api/lineas/${idLinea}`,
    {
      method: "DELETE",
    }
  );
}

export function importarLineasRequest(archivo) {
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
    "/api/lineas/importar",
    {
      method: "POST",
      body: formData,
    }
  );
}

export function descargarLineasRequest() {
  return apiDownload(
    "/api/lineas/exportar",
    "lineas.xlsx"
  );
}

export function borrarTodosLineasRequest() {
  return apiRequest("/api/lineas/todos", {
    method: "DELETE",
  });
}