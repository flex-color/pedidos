import {
  apiDownload,
  apiRequest,
} from "./apiClient";

export function buscarBomPorLineaRequest(idLinea) {
  return apiRequest(`/api/bom/lineas/${idLinea}`, {
    method: "GET",
  });
}

export function agregarInsumoABomRequest({
  idLinea,
  idInsumo,
  cantidadBase,
}) {
  return apiRequest("/api/bom", {
    method: "POST",
    body: JSON.stringify({
      idLinea,
      idInsumo,
      cantidadBase,
    }),
  });
}

export function actualizarBomRequest(
  idBom,
  data
) {
  return apiRequest(
    `/api/bom/${idBom}`,
    {
      method: "PUT",
      body: JSON.stringify(data),
    }
  );
}

export function borrarBomRequest(idBom) {
  return apiRequest(
    `/api/bom/${idBom}`,
    {
      method: "DELETE",
    }
  );
}

export function borrarTodosBomRequest() {
  return apiRequest(
    "/api/bom/todos",
    {
      method: "DELETE",
    }
  );
}

export function importarBomRequest(archivo) {
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
    "/api/bom/importar",
    {
      method: "POST",
      body: formData,
    }
  );
}

export function descargarBomRequest() {
  return apiDownload(
    "/api/bom/exportar",
    "bom.xlsx"
  );
}