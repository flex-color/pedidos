import {
  apiDownload,
  apiRequest,
} from "./apiClient";

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

export function getPedidosPendientesTrilayRequest() {
  return apiRequest("/api/pedidos/pendientes-trilay", {
    method: "GET",
  });
}

export function marcarPedidoCargaTrilayRequest(pedidoId) {
  return apiRequest(`/api/pedidos/${pedidoId}/carga-trilay`, {
    method: "PATCH",
  });
}

/* =========================================================
   EXPORTACIONES
   ========================================================= */

export function exportarTodosLosPedidosRequest({
  desde = null,
  hasta = null,
} = {}) {
  const params = new URLSearchParams();

  if (desde && hasta) {
    params.set("desde", desde);
    params.set("hasta", hasta);
  }

  const query = params.toString();
  const path = query
    ? `/api/pedidos/export/todos?${query}`
    : "/api/pedidos/export/todos";

  const nombreArchivo =
    desde && hasta
      ? `pedidos-${desde}-a-${hasta}.xlsx`
      : "pedidos-todos.xlsx";

  return apiDownload(
    path,
    nombreArchivo,
    "No se pudo exportar el reporte general de pedidos"
  );
}

export function exportarPendientesTrilayRequest() {
  return apiDownload(
    "/api/pedidos/pendientes-trilay/export",
    "pedidos-pendientes-trilay.xlsx",
    "No se pudo exportar el Excel de pendientes Trilay"
  );
}

export function exportarPedidosSeleccionadosRequest(pedidoIds) {
  if (!Array.isArray(pedidoIds) || pedidoIds.length === 0) {
    throw new Error(
      "No hay pedidos seleccionados para exportar"
    );
  }

  const params = new URLSearchParams();
  pedidoIds.forEach((id) =>
    params.append("ids", id)
  );

  return apiDownload(
    `/api/pedidos/export/seleccionados?${params.toString()}`,
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
    params.set(
      "cargaTrilay",
      String(cargaTrilay)
    );
  }

  return apiRequest(
    `/api/pedidos/historial?${params.toString()}`,
    {
      method: "GET",
    }
  );
}
