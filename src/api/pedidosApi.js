import { apiRequest } from "./apiClient";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

/* =========================================================
   PEDIDOS
   ========================================================= */

export function crearPedidoRequest({ lineaId, insumos }) {
  return apiRequest("/api/pedidos", {
    method: "POST",
    body: JSON.stringify({
      lineaId,
      insumos,
    }),
  });
}

export function getPedidoDetalleRequest(pedidoId) {
  return apiRequest(`/api/pedidos/${pedidoId}`, {
    method: "GET",
  });
}

export function getPedidosPendientesArmadoRequest() {
  return apiRequest("/api/pedidos/pendientes-armado", {
    method: "GET",
  });
}

export function iniciarArmadoPedidoRequest(pedidoId) {
  return apiRequest(`/api/pedidos/${pedidoId}/inicio-armado`, {
    method: "PATCH",
  });
}

export function guardarArmadoPedidoRequest({ pedidoId, insumos }) {
  return apiRequest(`/api/pedidos/${pedidoId}/armado`, {
    method: "PATCH",
    body: JSON.stringify({ insumos }),
  });
}

export function getPedidosPendientesSalidaDepositoRequest() {
  return apiRequest("/api/pedidos/pendientes-salida-deposito", {
    method: "GET",
  });
}

export function guardarSalidaDepositoRequest({ pedidoId, insumos }) {
  return apiRequest(`/api/pedidos/${pedidoId}/salida-deposito`, {
    method: "PATCH",
    body: JSON.stringify({ insumos }),
  });
}

export function getPedidosPendientesControlLineaRequest() {
  return apiRequest("/api/pedidos/pendientes-control-linea", {
    method: "GET",
  });
}

export function guardarControlLineaRequest({ pedidoId, insumos }) {
  return apiRequest(`/api/pedidos/${pedidoId}/control-linea`, {
    method: "PATCH",
    body: JSON.stringify({ insumos }),
  });
}

/* =========================================================
   TRILAY
   ========================================================= */

export async function getPedidosPendientesTrilayRequest() {
  const response = await fetch(
    `${API_BASE_URL}/api/pedidos/pendientes-trilay`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    let detalle = "";
    try {
      detalle = await response.text();
    } catch {
      detalle = "";
    }
    throw new Error(
      detalle || "No se pudieron cargar los pedidos pendientes de Trilay"
    );
  }

  return response.json();
}

export function marcarPedidoCargaTrilayRequest(pedidoId) {
  return apiRequest(`/api/pedidos/${pedidoId}/carga-trilay`, {
    method: "PATCH",
  });
}

/* =========================================================
   EXPORTACIONES
   ========================================================= */

async function descargarExcel(response, nombreArchivo, mensajeError) {
  if (!response.ok) {
    let detalle = "";
    try {
      detalle = await response.text();
    } catch {
      detalle = "";
    }
    throw new Error(detalle || mensajeError);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombreArchivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportarTodosLosPedidosRequest({
  desde = null,
  hasta = null,
} = {}) {
  const params = new URLSearchParams();

  if (desde && hasta) {
    params.set("desde", desde);
    params.set("hasta", hasta);
  }

  const query = params.toString();
  const url = query
    ? `${API_BASE_URL}/api/pedidos/export/todos?${query}`
    : `${API_BASE_URL}/api/pedidos/export/todos`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  const nombreArchivo =
    desde && hasta
      ? `pedidos-${desde}-a-${hasta}.xlsx`
      : "pedidos-todos.xlsx";

  await descargarExcel(
    response,
    nombreArchivo,
    "No se pudo exportar el reporte general de pedidos"
  );
}

export async function exportarPendientesTrilayRequest() {
  const response = await fetch(
    `${API_BASE_URL}/api/pedidos/pendientes-trilay/export`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  await descargarExcel(
    response,
    "pedidos-pendientes-trilay.xlsx",
    "No se pudo exportar el Excel de pendientes Trilay"
  );
}

export async function exportarPedidosSeleccionadosRequest(pedidoIds) {
  if (!Array.isArray(pedidoIds) || pedidoIds.length === 0) {
    throw new Error("No hay pedidos seleccionados para exportar");
  }

  const params = new URLSearchParams();
  pedidoIds.forEach((id) => params.append("ids", id));

  const response = await fetch(
    `${API_BASE_URL}/api/pedidos/export/seleccionados?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  await descargarExcel(
    response,
    "pedidos-seleccionados-trilay.xlsx",
    "No se pudo exportar el Excel de pedidos seleccionados"
  );
}

/* =========================================================
   HISTORIAL
   ========================================================= */

export function getHistorialPedidosRequest({
  page = 0,
  size = 20,
  cargaTrilay = null,
}) {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("size", size);

  if (cargaTrilay !== null) {
    params.set("cargaTrilay", String(cargaTrilay));
  }

  return apiRequest(`/api/pedidos/historial?${params.toString()}`, {
    method: "GET",
  });
}
