import { useEffect, useMemo, useState } from "react";
import {
  getInsumosPorLineaRequest,
  getLineasRequest,
} from "../../api/lineasApi";
import "./CrearPage.css";

import { crearPedidoRequest } from "../../api/pedidosApi";

function numeroSeguro(valor, fallback = 0) {
  const normalizado =
    typeof valor === "string"
      ? valor.trim().replace(",", ".")
      : valor;

  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : fallback;
}

function cantidadConPrecision(valor) {
  return Number(Number(valor).toFixed(8));
}

export default function CrearPage() {
  const [lineas, setLineas] = useState([]);
  const [lineaSeleccionada, setLineaSeleccionada] = useState(null);
  const [insumos, setInsumos] = useState([]);

  const [creandoPedido, setCreandoPedido] = useState(false);
  const [errorPedido, setErrorPedido] = useState("");

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [cantidades, setCantidades] = useState({});

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState(false);

  const [loadingLineas, setLoadingLineas] = useState(true);
  const [loadingInsumos, setLoadingInsumos] = useState(false);

  const [errorLineas, setErrorLineas] = useState("");
  const [errorInsumos, setErrorInsumos] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function cargarLineas() {
      try {
        setLoadingLineas(true);
        setErrorLineas("");

        const data = await getLineasRequest();

        if (!isMounted) return;

        const lineasNormalizadas = Array.isArray(data)
          ? data.map((linea) => ({
              id: linea.id_linea ?? linea.id ?? linea.idLinea,
              nombre: linea.nombre,
            }))
          : [];

        setLineas(lineasNormalizadas);
        setLineaSeleccionada(lineasNormalizadas[0] || null);
      } catch (error) {
        if (isMounted) {
          setErrorLineas(
            error.message || "No se pudieron cargar las líneas."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingLineas(false);
        }
      }
    }

    cargarLineas();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lineaSeleccionada) {
      setInsumos([]);
      return;
    }

    let isMounted = true;

    async function cargarInsumos() {
      try {
        setLoadingInsumos(true);
        setErrorInsumos("");
        setInsumos([]);
        setCantidades({});
        setPedidoCreado(false);

        const data = await getInsumosPorLineaRequest(
          lineaSeleccionada.id
        );

        if (!isMounted) return;

        const insumosNormalizados = Array.isArray(data)
          ? data.map((insumo) => {
              const lote = numeroSeguro(insumo.lote, 1);

              return {
                /*
                 * IMPORTANTE:
                 * Ahora el endpoint devuelve BomLineaResponse.
                 * id = ID del BOM
                 * idInsumo = ID real del insumo
                 */
                id:
                  insumo.idInsumo ??
                  insumo.id_insumo ??
                  null,

                idBom: insumo.id ?? null,

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
                  "",

                unidad:
                  insumo.unidad ||
                  "unidad",

                cantidadBase:
                  numeroSeguro(
                    insumo.cantidadBase ??
                      insumo.cantidad_base,
                    1
                  ),

                variable:
                  Boolean(insumo.variable),

                lote:
                  lote > 0
                    ? lote
                    : 1,

                unidadTrilay:
                  insumo.unidadTrilay ??
                  insumo.unidad_trilay ??
                  null,

                factorConversionTrilay:
                  numeroSeguro(
                    insumo.factorConversionTrilay ??
                      insumo.factor_conversion_trilay,
                    1
                  ),

                almacen:
                  insumo.almacen ?? "",

                pasillo:
                  insumo.pasillo ?? "",

                rack:
                  insumo.rack ?? "",

                nivelRack:
                  insumo.nivelRack ??
                  insumo.nivel_rack ??
                  "",
              };
            })
          : [];

        setInsumos(insumosNormalizados);
      } catch (error) {
        if (isMounted) {
          setErrorInsumos(
            error.message ||
              "No se pudieron cargar los insumos."
          );
        }
      } finally {
        if (isMounted) {
          setLoadingInsumos(false);
        }
      }
    }

    cargarInsumos();

    return () => {
      isMounted = false;
    };
  }, [lineaSeleccionada]);

  const insumosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return insumos
      .filter((insumo) => {
        if (!texto) return true;

        return (
          insumo.nombre
            .toLowerCase()
            .includes(texto) ||
          insumo.sku
            .toLowerCase()
            .includes(texto) ||
          insumo.codigoProveedor
            .toLowerCase()
            .includes(texto)
        );
      })
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre)
      );
  }, [insumos, busqueda]);

  const insumosSeleccionados = useMemo(() => {
    return insumos
      .filter(
        (insumo) =>
          numeroSeguro(
            cantidades[insumo.id],
            0
          ) > 0
      )
      .map((insumo) => ({
        ...insumo,
        cantidad: numeroSeguro(
          cantidades[insumo.id],
          0
        ),
      }));
  }, [insumos, cantidades]);

  const haySeleccionados =
    insumosSeleccionados.length > 0;

  function seleccionarLinea(linea) {
    setLineaSeleccionada(linea);
    setBusqueda("");
    setMenuAbierto(false);
  }

  /*
   * Para insumos NO variables.
   * Suma o resta exactamente el lote.
   */
  function cambiarCantidadPorLote(
    insumoId,
    lote,
    direccion
  ) {
    const loteSeguro =
      numeroSeguro(lote, 1) > 0
        ? numeroSeguro(lote, 1)
        : 1;

    setCantidades((cantidadesActuales) => {
      const cantidadActual =
        numeroSeguro(
          cantidadesActuales[insumoId],
          0
        );

      const cambio =
        direccion === "sumar"
          ? loteSeguro
          : -loteSeguro;

      const nuevaCantidad =
        cantidadConPrecision(
          Math.max(
            0,
            cantidadActual + cambio
          )
        );

      return {
        ...cantidadesActuales,
        [insumoId]: nuevaCantidad,
      };
    });

    setPedidoCreado(false);
  }

  /*
   * Para insumos variables, la cantidad solicitada representa
   * cantidad de rollos. No se cambia la unidad guardada en DB.
   */
  function cambiarCantidadRollos(insumoId, direccion) {
    setCantidades((cantidadesActuales) => {
      const actual = Math.max(0, Math.trunc(numeroSeguro(cantidadesActuales[insumoId], 0)));
      const nuevaCantidad = Math.max(0, actual + direccion);
      return {
        ...cantidadesActuales,
        [insumoId]: nuevaCantidad,
      };
    });

    setPedidoCreado(false);
  }

  function abrirModalConfirmacion() {
    if (!haySeleccionados) return;

    setErrorPedido("");
    setModalAbierto(true);
  }

  function cerrarModalConfirmacion() {
    setModalAbierto(false);
  }

  async function hacerPedido() {
    try {
      setCreandoPedido(true);
      setErrorPedido("");

      const payload =
        insumosSeleccionados.map(
          (insumo) => ({
            insumoId: insumo.id,
            cantidad: insumo.cantidad,
          })
        );

      await crearPedidoRequest({
        lineaId: lineaSeleccionada.id,
        insumos: payload,
      });

      setCantidades({});
      setBusqueda("");
      setModalAbierto(false);
      setPedidoCreado(true);
    } catch (error) {
      setErrorPedido(
        error.message ||
          "No se pudo crear el pedido."
      );
    } finally {
      setCreandoPedido(false);
    }
  }

  return (
    <section className="crear-page">
      <header className="crear-header">
        <div>
          <p className="crear-header__eyebrow">
            Nuevo pedido
          </p>

          <h1 className="crear-header__title">
            Crear pedido
          </h1>
        </div>

        <button
          type="button"
          className="crear-header__menu-button"
          onClick={() => setMenuAbierto(true)}
        >
          Líneas
        </button>
      </header>

      {pedidoCreado && (
        <div className="crear-success">
          Pedido creado correctamente.
        </div>
      )}

      {errorLineas && (
        <div className="crear-empty">
          {errorLineas}
        </div>
      )}

      <div className="crear-layout">
        <aside
          className={`crear-sidebar ${
            menuAbierto ? "is-open" : ""
          }`}
        >
          <div className="crear-sidebar__header">
            <h2>Líneas</h2>

            <button
              type="button"
              className="crear-sidebar__close"
              onClick={() =>
                setMenuAbierto(false)
              }
            >
              ×
            </button>
          </div>

          <div className="crear-sidebar__list">
            {loadingLineas && (
              <div className="crear-empty">
                Cargando líneas...
              </div>
            )}

            {!loadingLineas &&
              lineas.map((linea) => (
                <button
                  key={linea.id}
                  type="button"
                  className={
                    lineaSeleccionada?.id ===
                    linea.id
                      ? "crear-sidebar__item is-active"
                      : "crear-sidebar__item"
                  }
                  onClick={() =>
                    seleccionarLinea(linea)
                  }
                >
                  {linea.nombre}
                </button>
              ))}
          </div>
        </aside>

        {menuAbierto && (
          <button
            type="button"
            className="crear-overlay"
            onClick={() =>
              setMenuAbierto(false)
            }
            aria-label="Cerrar menú de líneas"
          />
        )}

        <main className="crear-content">
          <div className="crear-content__top">
            <div>
              <p className="crear-content__label">
                Línea seleccionada
              </p>

              <h2>
                {lineaSeleccionada?.nombre ||
                  "Sin línea"}
              </h2>
            </div>

            <span className="crear-content__count">
              {insumosFiltrados.length} insumos
            </span>
          </div>

          <label className="crear-search">
            <span>Buscar insumo</span>

            <input
              type="text"
              value={busqueda}
              onChange={(event) =>
                setBusqueda(event.target.value)
              }
              placeholder="Buscar por nombre, SKU o código proveedor"
              disabled={
                !lineaSeleccionada ||
                loadingInsumos
              }
            />
          </label>

          {haySeleccionados && (
            <div className="crear-summary">
              <strong>
                {insumosSeleccionados.length}
              </strong>

              <span>
                insumos seleccionados
              </span>
            </div>
          )}

          <div className="crear-insumos">
            {loadingInsumos && (
              <div className="crear-empty">
                Cargando insumos...
              </div>
            )}

            {errorInsumos && (
              <div className="crear-empty">
                {errorInsumos}
              </div>
            )}

            {!loadingInsumos &&
              !errorInsumos &&
              insumosFiltrados.map(
                (insumo) => {
                  const cantidad =
                    numeroSeguro(
                      cantidades[insumo.id],
                      0
                    );

                  return (
                    <article
                      key={insumo.id}
                      className="crear-insumo-card"
                    >
                      <div className="crear-insumo-card__info">
                        <p className="crear-insumo-card__sku">
                          {insumo.sku}
                          {insumo.codigoProveedor?.trim()
                            ? ` | ${insumo.codigoProveedor}`
                            : ""}
                        </p>

                        <h3>
                          {insumo.nombre}
                        </h3>

                        <div className="crear-insumo-card__meta">
                          <span>
                            Unidad:{" "}
                            <strong>
                              {insumo.variable ? "rollo" : insumo.unidad}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {insumo.variable ? (
                        <div className="crear-insumo-card__qty">
                          <button
                            type="button"
                            onClick={() => cambiarCantidadRollos(insumo.id, -1)}
                            disabled={cantidad <= 0}
                          >
                            −
                          </button>

                          <div className="crear-insumo-card__qty-value">
                            <strong>{cantidad}</strong>
                            <span>rollos</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => cambiarCantidadRollos(insumo.id, 1)}
                          >
                            ＋
                          </button>
                        </div>
                      ) : (
                        <div className="crear-insumo-card__qty">
                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidadPorLote(
                                insumo.id,
                                insumo.lote,
                                "restar"
                              )
                            }
                            disabled={
                              cantidad <= 0
                            }
                          >
                            −
                          </button>

                          <div className="crear-insumo-card__qty-value">
                            <strong>
                              {cantidad}
                            </strong>

                            <span>
                              {
                                insumo.unidad
                              }
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              cambiarCantidadPorLote(
                                insumo.id,
                                insumo.lote,
                                "sumar"
                              )
                            }
                          >
                            ＋
                          </button>
                        </div>
                      )}
                    </article>
                  );
                }
              )}

            {!loadingInsumos &&
              !errorInsumos &&
              lineaSeleccionada &&
              insumosFiltrados.length ===
                0 && (
                <div className="crear-empty">
                  No encontramos insumos para
                  esta búsqueda.
                </div>
              )}
          </div>

          <div className="crear-actions">
            <button
              type="button"
              className="crear-actions__confirm"
              disabled={!haySeleccionados}
              onClick={
                abrirModalConfirmacion
              }
            >
              Crear pedido
            </button>
          </div>
        </main>
      </div>

      {modalAbierto && (
        <div className="crear-modal">
          <button
            type="button"
            className="crear-modal__backdrop"
            onClick={
              cerrarModalConfirmacion
            }
            aria-label="Cerrar confirmación"
          />

          <section className="crear-modal__card">
            <div className="crear-modal__header">
              <div>
                <p>Confirmación</p>

                <h2>
                  Confirmar pedido
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  cerrarModalConfirmacion
                }
              >
                ×
              </button>
            </div>

            <div className="crear-modal__linea">
              Línea:{" "}
              <strong>
                {
                  lineaSeleccionada?.nombre
                }
              </strong>
            </div>

            <div className="crear-modal__items">
              {insumosSeleccionados.map(
                (insumo) => {
                  return (
                    <article
                      key={insumo.id}
                      className="crear-modal__item"
                    >
                      <div>
                        <span>
                          {insumo.sku}
                          {insumo.codigoProveedor?.trim()
                            ? ` | ${insumo.codigoProveedor}`
                            : ""}
                        </span>

                        <strong>
                          {insumo.nombre}
                        </strong>
                      </div>

                      <b>
                        {insumo.variable
                          ? `${insumo.cantidad} rollos`
                          : `${insumo.cantidad} ${insumo.unidad}`}
                      </b>
                    </article>
                  );
                }
              )}
            </div>

            {errorPedido && (
              <p className="crear-modal__error">
                {errorPedido}
              </p>
            )}

            <div className="crear-modal__actions">
              <button
                type="button"
                className="crear-modal__secondary"
                onClick={
                  cerrarModalConfirmacion
                }
              >
                Volver
              </button>

              <button
                type="button"
                className="crear-modal__primary"
                onClick={hacerPedido}
                disabled={creandoPedido}
              >
                {creandoPedido
                  ? "Creando..."
                  : "Hacer pedido"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}