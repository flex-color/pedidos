import { useEffect, useMemo, useState } from "react";
import {
  exportarPedidosSeleccionadosRequest,
  exportarPendientesTrilayRequest,
  exportarTodosLosPedidosRequest,
  getPedidosPendientesTrilayRequest,
  marcarPedidoCargaTrilayRequest,
} from "../../api/pedidosApi";
import "./ExportarPage.css";

export default function ExportarPage() {
  const [pedidos, setPedidos] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [descargandoTodos, setDescargandoTodos] = useState(false);
  const [exportandoSeleccionados, setExportandoSeleccionados] =
    useState(false);
  const [exportandoTodo, setExportandoTodo] = useState(false);

  const [confirmacionTrilay, setConfirmacionTrilay] =
    useState(null);
  const [confirmandoTrilay, setConfirmandoTrilay] =
    useState(false);

  /*
   * Modal reporte general.
   */
  const [modalReporteGeneral, setModalReporteGeneral] =
    useState(false);

  const [modoReporteGeneral, setModoReporteGeneral] =
    useState("todos");

  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    cargarPedidosPendientes();
  }, []);

  async function cargarPedidosPendientes() {
    try {
      setLoading(true);
      setError("");

      const data =
        await getPedidosPendientesTrilayRequest();

      const pedidosNormalizados = (data || []).map(
        (pedido) => ({
          id: pedido.id,

          codigo:
            pedido.codigo ||
            `PEDIDO ${pedido.id}`,

          fecha:
            pedido.fechaControlLinea ||
            pedido.fechaSolicitud ||
            "",

          lineaNombre: pedido.lineaNombre || "",

          estado: pedido.esParcial
            ? "Parcial"
            : "Completo",

          cargaTrilay: Boolean(
            pedido.cargaTrilay
          ),

          controlLineaPorUsername:
            pedido.controlLineaPorUsername ??
            "",

          insumos: Array.isArray(pedido.insumos)
            ? pedido.insumos.map((insumo) => ({
              id:
                insumo.id ??
                insumo.insumoId ??
                insumo.idInsumo ??
                null,

              sku:
                insumo.sku ??
                insumo.SKU ??
                "",

              codigoProveedor:
                insumo.codigoProveedor ??
                insumo.codigo_proveedor ??
                "",

              nombre:
                insumo.nombre ??
                insumo.insumoNombre ??
                "Insumo",

              cantidadSolicitada:
                insumo.cantidadSolicitada ??
                insumo.cantidad ??
                0,

              cantidadControlLinea:
                insumo.cantidadControlLinea ??
                null,

              unidad:
                insumo.unidad ??
                "unidad",

              unidadTrilay:
                insumo.unidadTrilay ??
                insumo.unidad_trilay ??
                insumo.unidad ??
                "unidad",

              factorConversionTrilay:
                insumo.factorConversionTrilay ??
                insumo.factor_conversion_trilay ??
                1,

              cantidadTrilay:
                insumo.cantidadTrilay ??
                insumo.cantidad_trilay ??
                null,
            }))
            : [],
        })
      );

      setPedidos(pedidosNormalizados);
    } catch (error) {
      setError(
        error.message ||
        "No se pudieron cargar los pedidos."
      );
    } finally {
      setLoading(false);
    }
  }

  const cantidadSeleccionada = useMemo(() => {
    return Object.values(seleccionados).filter(
      Boolean
    ).length;
  }, [seleccionados]);

  const idsSeleccionados = useMemo(() => {
    return Object.entries(seleccionados)
      .filter(([, seleccionado]) => seleccionado)
      .map(([pedidoId]) => Number(pedidoId));
  }, [seleccionados]);

  function togglePedido(pedidoId) {
    setMensaje("");
    setError("");

    setSeleccionados((actual) => ({
      ...actual,
      [pedidoId]: !actual[pedidoId],
    }));
  }

  /*
   * =========================================================
   * AGREGAR A TRILAY - SELECCIÓN
   * =========================================================
   */

  async function agregarATrilaySeleccion() {
    if (idsSeleccionados.length === 0) {
      return;
    }

    try {
      setExportandoSeleccionados(true);
      setMensaje("");
      setError("");

      await exportarPedidosSeleccionadosRequest(
        idsSeleccionados
      );

      setConfirmacionTrilay({
        pedidoIds: [...idsSeleccionados],
        tipo: "seleccion",
      });
    } catch (error) {
      setError(
        error.message ||
        "No se pudo generar el archivo para Trilay."
      );
    } finally {
      setExportandoSeleccionados(false);
    }
  }

  function formatearFechaVisual(fecha) {
    if (!fecha) {
      return "Sin fecha";
    }
  
    const date = new Date(fecha);
  
    if (Number.isNaN(date.getTime())) {
      return fecha;
    }
  
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  /*
   * =========================================================
   * AGREGAR A TRILAY - TODO
   * =========================================================
   */

  async function agregarATrilayTodo() {
    if (pedidos.length === 0) {
      return;
    }

    const pedidoIds = pedidos.map(
      (pedido) => pedido.id
    );

    try {
      setExportandoTodo(true);
      setMensaje("");
      setError("");

      await exportarPendientesTrilayRequest();

      setConfirmacionTrilay({
        pedidoIds,
        tipo: "todo",
      });
    } catch (error) {
      setError(
        error.message ||
        "No se pudo generar el archivo para Trilay."
      );
    } finally {
      setExportandoTodo(false);
    }
  }

  /*
   * =========================================================
   * CONFIRMAR CARGA TRILAY
   * =========================================================
   */

  async function confirmarCargaTrilay() {
    if (
      !confirmacionTrilay ||
      confirmacionTrilay.pedidoIds.length === 0
    ) {
      return;
    }

    const pedidoIds =
      confirmacionTrilay.pedidoIds;

    try {
      setConfirmandoTrilay(true);
      setError("");

      for (const pedidoId of pedidoIds) {
        await marcarPedidoCargaTrilayRequest(
          pedidoId
        );
      }

      setPedidos((actuales) =>
        actuales.filter(
          (pedido) =>
            !pedidoIds.includes(pedido.id)
        )
      );

      setSeleccionados({});
      setPedidoDetalle(null);
      setConfirmacionTrilay(null);

      setMensaje(
        "Pedidos marcados correctamente como cargados a Trilay."
      );
    } catch (error) {
      setError(
        error.message ||
        "El archivo fue descargado, pero no se pudieron marcar todos los pedidos como cargados a Trilay."
      );

      setConfirmacionTrilay(null);

      await cargarPedidosPendientes();
    } finally {
      setConfirmandoTrilay(false);
    }
  }

  function cancelarCargaTrilay() {
    setConfirmacionTrilay(null);

    setMensaje(
      "El archivo fue descargado. Los pedidos continúan pendientes de Trilay."
    );
  }

  /*
   * =========================================================
   * REPORTE GENERAL
   * =========================================================
   */

  function abrirReporteGeneral() {
    setMensaje("");
    setError("");

    setModoReporteGeneral("todos");
    setFechaDesde("");
    setFechaHasta("");

    setModalReporteGeneral(true);
  }

  function cerrarReporteGeneral() {
    if (descargandoTodos) {
      return;
    }

    setModalReporteGeneral(false);
  }

  async function descargarReporteGeneral() {
    /*
     * Si eligió rango, ambas fechas son obligatorias.
     */
    if (modoReporteGeneral === "fechas") {
      if (!fechaDesde || !fechaHasta) {
        setError(
          "Debés seleccionar una fecha desde y una fecha hasta."
        );
        return;
      }

      if (fechaHasta < fechaDesde) {
        setError(
          "La fecha hasta no puede ser anterior a la fecha desde."
        );
        return;
      }
    }

    try {
      setDescargandoTodos(true);
      setMensaje("");
      setError("");

      if (modoReporteGeneral === "todos") {
        await exportarTodosLosPedidosRequest();
      } else {
        await exportarTodosLosPedidosRequest({
          desde: fechaDesde,
          hasta: fechaHasta,
        });
      }

      setModalReporteGeneral(false);

      if (modoReporteGeneral === "todos") {
        setMensaje(
          "Reporte general de todos los pedidos descargado correctamente."
        );
      } else {
        setMensaje(
          `Reporte general descargado desde ${fechaDesde} hasta ${fechaHasta}.`
        );
      }
    } catch (error) {
      setError(
        error.message ||
        "No se pudo descargar el reporte general."
      );
    } finally {
      setDescargandoTodos(false);
    }
  }

  /*
   * =========================================================
   * DETALLE TRILAY
   * =========================================================
   */

  function cantidadParaMostrar(insumo) {
    if (
      insumo.cantidadControlLinea !== null &&
      insumo.cantidadControlLinea !== undefined
    ) {
      return insumo.cantidadControlLinea;
    }

    return insumo.cantidadSolicitada ?? 0;
  }

  function calcularCantidadTrilay(insumo) {
    if (insumo.cantidadTrilay !== null && insumo.cantidadTrilay !== undefined) {
      return Number(insumo.cantidadTrilay);
    }

    const cantidad = Number(cantidadParaMostrar(insumo));
    const factor = Number(insumo.factorConversionTrilay ?? 1);
    if (Number.isNaN(cantidad) || Number.isNaN(factor)) return 0;
    return Number((cantidad * factor).toFixed(8));
  }

  const procesando =
    exportandoSeleccionados ||
    exportandoTodo ||
    confirmandoTrilay ||
    descargandoTodos;

  if (loading) {
    return (
      <section className="exportar-page">
        <header className="exportar-header">
          <div>
            <p className="exportar-header__eyebrow">
              Trilay
            </p>

            <h1 className="exportar-header__title">
              Exportar pedidos
            </h1>
          </div>
        </header>

        <p>Cargando pedidos pendientes...</p>
      </section>
    );
  }

  return (
    <section className="exportar-page">
      <header className="exportar-header">
        <div>
          <p className="exportar-header__eyebrow">
            Trilay
          </p>

          <h1 className="exportar-header__title">
            Exportar pedidos
          </h1>
        </div>

        <span className="exportar-header__badge">
          {pedidos.length} pendientes
        </span>
      </header>

      {mensaje && (
        <div className="exportar-success">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="exportar-error">
          {error}
        </div>
      )}

      <section className="exportar-actions">
        <button
          type="button"
          className="exportar-actions__secondary"
          disabled={
            cantidadSeleccionada === 0 ||
            procesando
          }
          onClick={agregarATrilaySeleccion}
        >
          {exportandoSeleccionados
            ? "Generando archivo..."
            : `Agregar a Trilay selección${cantidadSeleccionada > 0
              ? ` (${cantidadSeleccionada})`
              : ""
            }`}
        </button>

        <button
          type="button"
          className="exportar-actions__primary"
          disabled={
            pedidos.length === 0 ||
            procesando
          }
          onClick={agregarATrilayTodo}
        >
          {exportandoTodo
            ? "Generando archivo..."
            : "Agregar a Trilay todo"}
        </button>

        <button
          type="button"
          className="exportar-actions__primary"
          disabled={procesando}
          onClick={abrirReporteGeneral}
        >
          Descargar reporte general
        </button>
      </section>

      {pedidos.length === 0 ? (
        <div className="exportar-empty">
          <h2>
            No hay pedidos pendientes para Trilay
          </h2>

          <p>
            Cuando haya pedidos con Control en Línea completo y no
            cargados a Trilay, van a aparecer acá.
          </p>
        </div>
      ) : (
        <section className="exportar-list">
          {pedidos.map((pedido) => {
            const seleccionado =
              seleccionados[pedido.id] === true;

            return (
              <article
                key={pedido.id}
                className="exportar-card"
              >
                <label className="exportar-card__check">
                  <input
                    type="checkbox"
                    checked={seleccionado}
                    onChange={() =>
                      togglePedido(pedido.id)
                    }
                    disabled={procesando}
                  />

                  <span />
                </label>

                <div className="exportar-card__info">
                  <h3>{pedido.codigo}</h3>

                  <div className="exportar-card__meta">
                    <span>
                    {formatearFechaVisual(pedido.fecha)}
                    </span>

                    <span>
                      {pedido.estado}
                    </span>

                    {pedido.lineaNombre && <span>Línea: {pedido.lineaNombre}</span>}

                    <span>
                      Control en línea por:{" "}
                      {pedido.controlLineaPorUsername || "Sin usuario"}
                    </span>

                    <span>
                      Pendiente Trilay
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="exportar-card__detail"
                  onClick={() =>
                    setPedidoDetalle(pedido)
                  }
                >
                  Ver detalle
                </button>
              </article>
            );
          })}
        </section>
      )}

      {/* =====================================================
          MODAL DETALLE TRILAY
          ===================================================== */}

      {pedidoDetalle &&
        !confirmacionTrilay &&
        !modalReporteGeneral && (
          <div className="exportar-modal">
            <button
              type="button"
              className="exportar-modal__backdrop"
              onClick={() =>
                setPedidoDetalle(null)
              }
              aria-label="Cerrar detalle"
            />

            <section className="exportar-modal__card">
              <div className="exportar-modal__header">
                <div>
                  <p>Detalle Trilay</p>

                  <h2>
                    {pedidoDetalle.codigo}
                  </h2>

                  <p>
                    Control en línea por:{" "}
                    {pedidoDetalle.controlLineaPorUsername || "Sin usuario"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPedidoDetalle(null)
                  }
                >
                  ×
                </button>
              </div>

              <div className="exportar-modal__items">
                {pedidoDetalle.insumos.length === 0 ? (
                  <p>
                    No hay detalle de insumos
                    disponible en esta respuesta.
                  </p>
                ) : (
                  pedidoDetalle.insumos.map(
                    (insumo) => {
                      const cantidadOrigen =
                        cantidadParaMostrar(
                          insumo
                        );

                      const cantidadTrilay =
                        calcularCantidadTrilay(
                          insumo
                        );

                      return (
                        <article
                          key={
                            insumo.id ||
                            `${insumo.sku}-${insumo.nombre}`
                          }
                          className="exportar-modal__item"
                        >
                          <div>
                            <span>
                              {insumo.sku}
                              {insumo.codigoProveedor ? ` | ${insumo.codigoProveedor}` : ""}
                            </span>

                            <strong>
                              {insumo.nombre}
                            </strong>

                            <small>
                              {cantidadOrigen}{" "}
                              {insumo.unidad}
                              {" → "}
                              {cantidadTrilay}{" "}
                              {insumo.unidadTrilay}
                            </small>
                          </div>

                          <b>
                            {cantidadTrilay}{" "}
                            {insumo.unidadTrilay}
                          </b>
                        </article>
                      );
                    }
                  )
                )}
              </div>
            </section>
          </div>
        )}

      {/* =====================================================
          MODAL CONFIRMACIÓN TRILAY
          ===================================================== */}

      {confirmacionTrilay && (
        <div className="exportar-modal">
          <div className="exportar-modal__backdrop" />

          <section className="exportar-modal__card">
            <div className="exportar-modal__header">
              <div>
                <p>Confirmación Trilay</p>

                <h2>
                  ¿Se cargaron correctamente los
                  pedidos a Trilay?
                </h2>
              </div>
            </div>

            <div className="exportar-modal__items">
              <p>
                Se descargó el archivo con{" "}
                <strong>
                  {
                    confirmacionTrilay
                      .pedidoIds.length
                  }
                </strong>{" "}
                pedido
                {confirmacionTrilay.pedidoIds
                  .length !== 1
                  ? "s"
                  : ""}
                .
              </p>

              <p>
                Solo se marcarán como cargados si
                confirmás que la carga en Trilay fue
                correcta.
              </p>
            </div>

            <div className="exportar-modal__actions">
              <button
                type="button"
                className="exportar-actions__secondary"
                onClick={cancelarCargaTrilay}
                disabled={confirmandoTrilay}
              >
                No
              </button>

              <button
                type="button"
                className="exportar-actions__primary"
                onClick={confirmarCargaTrilay}
                disabled={confirmandoTrilay}
              >
                {confirmandoTrilay
                  ? "Confirmando..."
                  : "Sí, se cargaron"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* =====================================================
          MODAL REPORTE GENERAL
          ===================================================== */}

      {modalReporteGeneral && (
        <div className="exportar-modal">
          <button
            type="button"
            className="exportar-modal__backdrop"
            onClick={cerrarReporteGeneral}
            aria-label="Cerrar reporte general"
          />

          <section className="exportar-modal__card">
            <div className="exportar-modal__header">
              <div>
                <p>Reporte general</p>

                <h2>
                  Descargar pedidos
                </h2>
              </div>

              <button
                type="button"
                onClick={cerrarReporteGeneral}
                disabled={descargandoTodos}
              >
                ×
              </button>
            </div>

            <div className="exportar-modal__items">
              <p>
                Elegí qué pedidos querés incluir en el reporte.
              </p>

              <div className="exportar-report-options">
                <button
                  type="button"
                  className={`exportar-report-option ${modoReporteGeneral === "todos"
                      ? "is-active"
                      : ""
                    }`}
                  onClick={() =>
                    setModoReporteGeneral("todos")
                  }
                  disabled={descargandoTodos}
                >
                  Todos
                </button>

                <button
                  type="button"
                  className={`exportar-report-option ${modoReporteGeneral === "fechas"
                      ? "is-active"
                      : ""
                    }`}
                  onClick={() =>
                    setModoReporteGeneral("fechas")
                  }
                  disabled={descargandoTodos}
                >
                  Filtrar por fecha
                </button>
              </div>

              {modoReporteGeneral === "fechas" && (
                <div className="exportar-report-dates">
                  <label className="exportar-report-field">
                    <span>Fecha desde</span>

                    <input
                      type="date"
                      value={fechaDesde}
                      onChange={(event) =>
                        setFechaDesde(
                          event.target.value
                        )
                      }
                      disabled={descargandoTodos}
                    />
                  </label>

                  <label className="exportar-report-field">
                    <span>Fecha hasta</span>

                    <input
                      type="date"
                      value={fechaHasta}
                      onChange={(event) =>
                        setFechaHasta(
                          event.target.value
                        )
                      }
                      disabled={descargandoTodos}
                    />
                  </label>
                </div>
              )}
            </div>

            <div className="exportar-modal__actions">
              <button
                type="button"
                className="exportar-actions__secondary"
                onClick={cerrarReporteGeneral}
                disabled={descargandoTodos}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="exportar-actions__primary"
                onClick={descargarReporteGeneral}
                disabled={
                  descargandoTodos ||
                  (
                    modoReporteGeneral === "fechas" &&
                    (!fechaDesde || !fechaHasta)
                  )
                }
              >
                {descargandoTodos
                  ? "Descargando..."
                  : "Descargar"}
              </button>
            </div>
          </section>
        </div>
      )}

    </section>
  );
}