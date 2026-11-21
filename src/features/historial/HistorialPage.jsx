import { useEffect, useMemo, useState } from "react";
import {
  exportarTodosLosPedidosRequest,
  getHistorialPedidosRequest,
  getPedidoDetalleRequest,
  actualizarNumeroOpRequest,
} from "../../api/pedidosApi";
import { formatearFechaHoraArgentina } from "../../utils/fechas";
import "./HistorialPage.css";

const formatearFecha = (fecha) => formatearFechaHoraArgentina(fecha, "-");

function estadoPedido(pedido) {
  if (pedido.cargaTrilay) return "Exportado";
  if (pedido.validado) return "Pendiente de exportación";
  if (pedido.revisado) return "Pendiente de control en línea";
  if (pedido.preparado) return "Pendiente de revisión salida depósito";
  return "Pendiente de armado";
}

function normalizarPedido(pedido) {
  return {
    id: pedido.id,
    codigo: pedido.codigo || `PEDIDO ${pedido.id}`,
    numeroOp: pedido.numeroOp || "",
    lineaNombre: pedido.lineaNombre || "",
    fechaSolicitud: pedido.fechaSolicitud || "",
    fechaArmado: pedido.fechaArmado || "",
    fechaSalidaDeposito: pedido.fechaSalidaDeposito || "",
    fechaControlLinea: pedido.fechaControlLinea || "",
    fechaExportado: pedido.fechaExportado || "",
    estado: estadoPedido(pedido),
    cargaTrilay: Boolean(pedido.cargaTrilay),
    esParcial: Boolean(pedido.esParcial),
    noConforme: Boolean(pedido.noConforme),
  };
}

function estadoLegible(estado) {
  const mapa = {
    PENDIENTE_ARMADO: "Pendiente de armado",
    PENDIENTE_REVISION_SALIDA_DEPOSITO: "Pendiente de revisión salida depósito",
    PENDIENTE_CONTROL_EN_LINEA: "Pendiente de control en línea",
    PENDIENTE_EXPORTACION: "Pendiente de exportación",
    EXPORTADO: "Exportado",
  };
  return mapa[estado] || estado || "-";
}

export default function HistorialPage() {
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTrilay, setFiltroTrilay] = useState("todos");
  const [pedidoDetalle, setPedidoDetalle] = useState(null);
  const [numeroOpEdicion, setNumeroOpEdicion] = useState("");
  const [guardandoOp, setGuardandoOp] = useState(false);
  const [errorOp, setErrorOp] = useState("");
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    cargarHistorial();
  }, [page, filtroTrilay]);

  async function cargarHistorial() {
    try {
      setLoading(true);
      setError("");

      const cargaTrilay =
        filtroTrilay === "todos" ? null : filtroTrilay === "cargados";

      const data = await getHistorialPedidosRequest({ page, size: 20, cargaTrilay });
      const contenido = data.content || [];
      setPedidos(contenido.map(normalizarPedido));
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || contenido.length);
    } catch (e) {
      setError(e.message || "No se pudo cargar el historial.");
    } finally {
      setLoading(false);
    }
  }

  const pedidosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return pedidos;
    return pedidos.filter(
      (pedido) =>
        pedido.codigo.toLowerCase().includes(texto) ||
        pedido.numeroOp.toLowerCase().includes(texto) ||
        pedido.lineaNombre.toLowerCase().includes(texto)
    );
  }, [pedidos, busqueda]);

  async function abrirDetalle(pedido) {
    try {
      setPedidoDetalle({ resumen: pedido, data: null });
      setLoadingDetalle(true);
      setErrorDetalle("");
      const data = await getPedidoDetalleRequest(pedido.id);
      setNumeroOpEdicion(data?.pedido?.numeroOp ?? pedido.numeroOp ?? "");
      setErrorOp("");
      setPedidoDetalle({ resumen: pedido, data });
    } catch (e) {
      setErrorDetalle(e.message || "No se pudo cargar el detalle del pedido.");
    } finally {
      setLoadingDetalle(false);
    }
  }

  async function guardarNumeroOp() {
    if (!pedidoDetalle) return;
    try {
      setGuardandoOp(true);
      setErrorOp("");
      const numeroOp = numeroOpEdicion.trim();
      await actualizarNumeroOpRequest(pedidoDetalle.resumen.id, numeroOp);
      setPedidos((prev) => prev.map((p) => p.id === pedidoDetalle.resumen.id ? {...p, numeroOp} : p));
      setPedidoDetalle((prev) => prev ? {
        ...prev,
        resumen: {...prev.resumen, numeroOp},
        data: prev.data ? {...prev.data, pedido: {...prev.data.pedido, numeroOp}} : null,
      } : prev);
    } catch (e) {
      setErrorOp(e.message || "No se pudo guardar la OP.");
    } finally {
      setGuardandoOp(false);
    }
  }

  function cambiarFiltroTrilay(valor) {
    setFiltroTrilay(valor);
    setPage(0);
    setMensaje("");
    setError("");
    setPedidoDetalle(null);
  }

  async function exportarHistorialCompleto() {
    try {
      setExportando(true);
      setMensaje("");
      setError("");
      await exportarTodosLosPedidosRequest();
      setMensaje("Excel de historial completo descargado correctamente.");
    } catch (e) {
      setError(e.message || "No se pudo exportar el historial completo.");
    } finally {
      setExportando(false);
    }
  }

  const detalle = pedidoDetalle?.data;
  const pedidoDetalleEntity = detalle?.pedido;

  return (
    <section className="historial-page">
      <header className="historial-header">
        <div><p className="historial-header__eyebrow">Consulta</p><h1 className="historial-header__title">Historial</h1></div>
        <span className="historial-header__badge">{totalElements} pedidos</span>
      </header>

      {mensaje && <div className="historial-success">{mensaje}</div>}
      {error && <div className="historial-error">{error}</div>}

      <section className="historial-filters">
        <label className="historial-filter">
          <span>Buscar por código o línea</span>
          <input type="text" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setMensaje(""); }} placeholder="Ej: OP-123, PEDIDO 1001 o Roller" />
        </label>

        <label className="historial-filter">
          <span>Estado Trilay</span>
          <select value={filtroTrilay} onChange={(event) => cambiarFiltroTrilay(event.target.value)}>
            <option value="todos">Todos</option>
            <option value="cargados">Cargados</option>
            <option value="no-cargados">No cargados</option>
          </select>
        </label>
      </section>

      {loading ? (
        <div className="historial-empty">Cargando historial...</div>
      ) : (
        <section className="historial-list">
          {pedidosFiltrados.map((pedido) => (
            <article key={pedido.id} className="historial-card">
              <div className="historial-card__info">
                <h3>{pedido.codigo}</h3>
                <small>OP: {pedido.numeroOp || "Sin asignar"}</small>
                <div className="historial-card__meta">
                  {pedido.lineaNombre && <span>{pedido.lineaNombre}</span>}
                  <span>{formatearFecha(pedido.fechaSolicitud)}</span>
                  <span>{pedido.estado}</span>
                  <span className={pedido.cargaTrilay ? "is-loaded" : "is-pending"}>{pedido.cargaTrilay ? "Cargado a Trilay" : "No cargado"}</span>
                </div>
              </div>
              <button type="button" className="historial-card__detail" onClick={() => abrirDetalle(pedido)}>Ver detalle</button>
            </article>
          ))}
          {pedidosFiltrados.length === 0 && <div className="historial-empty">No encontramos pedidos con esos filtros.</div>}
        </section>
      )}

      <div className="historial-pagination">
        <button type="button" disabled={page === 0 || loading} onClick={() => setPage((actual) => Math.max(0, actual - 1))}>Anterior</button>
        <span>Página {page + 1} de {totalPages}</span>
        <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => setPage((actual) => actual + 1)}>Siguiente</button>
      </div>

      <button type="button" className="historial-export" disabled={exportando} onClick={exportarHistorialCompleto}>{exportando ? "Exportando..." : "Exportar historial completo"}</button>

      {pedidoDetalle && (
        <div className="historial-modal">
          <button type="button" className="historial-modal__backdrop" onClick={() => setPedidoDetalle(null)} aria-label="Cerrar detalle" />
          <section className="historial-modal__card">
            <div className="historial-modal__header">
              <div><p>Detalle</p><h2>{pedidoDetalle.resumen.codigo}</h2></div>
              <button type="button" onClick={() => setPedidoDetalle(null)}>×</button>
            </div>

            {loadingDetalle && <div className="historial-empty">Cargando detalle...</div>}
            {errorDetalle && <div className="historial-error">{errorDetalle}</div>}

            {detalle && (
              <>
                <div className="historial-modal__status">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span>OP:</span>
                    <input type="text" value={numeroOpEdicion} maxLength={100}
                      onChange={(e) => setNumeroOpEdicion(e.target.value)}
                      placeholder="Sin asignar" aria-label="Número de OP"
                      style={{ minWidth: 160, padding: "6px 8px" }} />
                    <button type="button" onClick={guardarNumeroOp} disabled={guardandoOp || numeroOpEdicion.trim() === (pedidoDetalleEntity?.numeroOp ?? "")}>{guardandoOp ? "Guardando..." : "Guardar OP"}</button>
                    {errorOp && <small role="alert">{errorOp}</small>}
                  </label>
                  <span>Línea: {pedidoDetalleEntity?.lineaNombre || "-"}</span>
                  <span>Creado por: {detalle.solicitadoPorUsername || "-"}</span>
                  <span>Estado actual: {estadoLegible(detalle.estadoActual)}</span>
                  <span>Solicitud: {formatearFecha(pedidoDetalleEntity?.fechaSolicitud)}</span>
                  <span>Armado: {formatearFecha(pedidoDetalleEntity?.fechaArmado)}</span>
                  <span>Salida depósito: {formatearFecha(pedidoDetalleEntity?.fechaSalidaDeposito)}</span>
                  <span>Control línea: {formatearFecha(pedidoDetalleEntity?.fechaControlLinea)}</span>
                  <span>Exportado: {formatearFecha(pedidoDetalleEntity?.fechaExportado)}</span>
                </div>

                <div className="historial-modal__items">
                  {(detalle.insumos || []).map((insumo) => (
                    <article key={insumo.id || insumo.insumoId} className="historial-modal__item">
                      <div>
                        <span>{insumo.sku || ""}{insumo.codigoProveedor ? ` | ${insumo.codigoProveedor}` : ""}</span>
                        <strong>{insumo.nombre || "Insumo"}</strong>
                        {insumo.variable === true ? (
                          <div className="historial-modal__counts-inline">
                            <small>Solicitado: <strong>{insumo.cantidad ?? 0}</strong> {insumo.unidad || ""}</small>
                            <small>Salida depósito: <strong>{insumo.cantidadDinamicaSalDep ?? "—"}</strong></small>
                            <small>Control línea: <strong>{insumo.cantidadDinamicaControl ?? "—"}</strong></small>
                          </div>
                        ) : (
                          <small>Solicitado: {insumo.cantidad ?? 0} {insumo.unidad || ""}</small>
                        )}
                      </div>
                      <b>{insumo.variable === true
                        ? (insumo.cantidadDinamicaControl ?? insumo.cantidadDinamicaSalDep ?? insumo.cantidad ?? 0)
                        : (insumo.cantidad ?? 0)}</b>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
