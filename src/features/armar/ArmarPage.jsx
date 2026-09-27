import { useEffect, useMemo, useState } from "react";
import {
  getPedidosPendientesArmadoRequest,
  guardarArmadoPedidoRequest,
  iniciarArmadoPedidoRequest,
} from "../../api/pedidosApi";
import "./ArmarPage.css";

function getItemKey(pedidoId, insumoId) {
  return `${pedidoId}-${insumoId}`;
}

function formatearFecha(fecha) {
  if (!fecha) return "";
  const valor = String(fecha);
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return valor;
  const [, anio, mes, dia] = match;
  return `${dia}/${mes}/${anio}`;
}

function formatearFechaHora(fecha) {
  if (!fecha) return "";
  const valor = String(fecha);
  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return valor;
  const [, anio, mes, dia, hora, minuto] = match;
  return hora ? `${dia}/${mes}/${anio} ${hora}:${minuto}` : `${dia}/${mes}/${anio}`;
}

function numeroSeguro(valor, fallback = 0) {
  const normalizado = typeof valor === "string" ? valor.trim().replace(",", ".") : valor;
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : fallback;
}

function esCantidadParcial(insumo, cantidadEntregada) {
  if (insumo.variable) return false;
  const entregado = Number(cantidadEntregada || 0);
  const solicitado = Number(insumo.cantidad || 0);
  return solicitado > 0 && entregado >= 0 && entregado < solicitado;
}

function cantidadRollos(insumo) {
  return Math.max(0, Math.trunc(Number(insumo.cantidad || 0)));
}

function estadoInicial(insumo) {
  if (insumo.variable) {
    return {
      entregado: 0,
      rollos: Array.from({ length: cantidadRollos(insumo) }, () => ""),
      confirmado: false,
      parcial: false,
    };
  }

  return {
    entregado: Number(insumo.cantidad || 0),
    confirmado: false,
    parcial: false,
  };
}

function formatearUbicacion(insumo) {
  const partes = [];
  if (String(insumo.almacen || "").trim()) partes.push(`A${insumo.almacen}`);
  if (String(insumo.pasillo || "").trim()) partes.push(`P${insumo.pasillo}`);
  if (String(insumo.rack || "").trim()) partes.push(`R${insumo.rack}`);
  if (String(insumo.nivelRack || "").trim()) partes.push(`N${insumo.nivelRack}`);
  return partes.join(" · ");
}

export default function ArmarPage() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [lineas, setLineas] = useState({});
  const [guardandoArmado, setGuardandoArmado] = useState(false);
  const [iniciandoArmado, setIniciandoArmado] = useState(false);
  const [errorArmado, setErrorArmado] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargar() {
      try {
        setLoadingPedidos(true);
        setErrorPedidos("");
        const data = await getPedidosPendientesArmadoRequest();
        const normalizados = (data || []).map((pedido) => ({
          id: pedido.id,
          codigo: pedido.codigo || `PEDIDO ${pedido.id}`,
          fecha: pedido.fechaSolicitud || "",
          fechaInicioArmado: pedido.fechaInicioArmado || null,
          linea: pedido.lineaNombre || "",
          insumos: (pedido.insumos || []).map((insumo) => ({
            id: insumo.id,
            sku: insumo.sku || "",
            codigoProveedor: insumo.codigoProveedor || "",
            nombre: insumo.nombre || "Insumo",
            cantidad: Number(insumo.cantidad || 0),
            variable: Boolean(insumo.variable),
            unidad: insumo.unidad || "unidad",
            lote: Number(insumo.lote || 1),
            almacen: insumo.almacen ?? "",
            pasillo: insumo.pasillo ?? "",
            rack: insumo.rack ?? "",
            nivelRack: insumo.nivelRack ?? "",
          })),
        }));

        if (!activo) return;
        setPedidos(normalizados);
        setPedidoSeleccionadoId(normalizados[0]?.id ?? null);
      } catch (error) {
        if (activo) setErrorPedidos(error.message || "No se pudieron cargar los pedidos.");
      } finally {
        if (activo) setLoadingPedidos(false);
      }
    }

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const pedidoSeleccionado = useMemo(
    () => pedidos.find((pedido) => pedido.id === pedidoSeleccionadoId) || null,
    [pedidos, pedidoSeleccionadoId]
  );

  async function iniciarPedidoSeleccionado() {
    if (!pedidoSeleccionado || pedidoSeleccionado.fechaInicioArmado || iniciandoArmado) return;

    try {
      setIniciandoArmado(true);
      setErrorArmado("");

      const resultado = await iniciarArmadoPedidoRequest(pedidoSeleccionado.id);
      const fechaInicio = resultado?.fechaInicioArmado || new Date().toISOString();

      setPedidos((actuales) =>
        actuales.map((pedido) =>
          pedido.id === pedidoSeleccionado.id
            ? { ...pedido, fechaInicioArmado: fechaInicio }
            : pedido
        )
      );
    } catch (error) {
      setErrorArmado(error.message || "No se pudo iniciar el armado.");
    } finally {
      setIniciandoArmado(false);
    }
  }

  function obtenerEstado(insumo) {
    if (!pedidoSeleccionado) return estadoInicial(insumo);
    return lineas[getItemKey(pedidoSeleccionado.id, insumo.id)] || estadoInicial(insumo);
  }

  const pedidoCompleto = useMemo(() => {
    if (!pedidoSeleccionado) return false;
    return pedidoSeleccionado.insumos.every((insumo) => obtenerEstado(insumo).confirmado === true);
  }, [pedidoSeleccionado, lineas]);

  const pedidoEsParcial = useMemo(() => {
    if (!pedidoSeleccionado) return false;
    return pedidoSeleccionado.insumos.some((insumo) => obtenerEstado(insumo).parcial === true);
  }, [pedidoSeleccionado, lineas]);

  function seleccionarPedido(pedidoId) {
    setPedidoSeleccionadoId(pedidoId);
    setMenuAbierto(false);
    setErrorArmado("");
    setMensaje("");
  }

  function cambiarCantidad(insumo, direccion) {
    if (!pedidoSeleccionado || insumo.variable) return;
    const key = getItemKey(pedidoSeleccionado.id, insumo.id);

    setLineas((actuales) => {
      const actual = actuales[key] || estadoInicial(insumo);
      const lote = Number(insumo.lote || 1);
      let nueva = Number(actual.entregado || 0) + direccion * lote;
      nueva = Math.max(0, Math.min(insumo.cantidad, nueva));
      nueva = Math.round((nueva + Number.EPSILON) * 10000) / 10000;

      return {
        ...actuales,
        [key]: {
          ...actual,
          entregado: nueva,
          parcial: esCantidadParcial(insumo, nueva),
          confirmado: nueva === 0 ? true : actual.confirmado,
        },
      };
    });
  }

  function cambiarRollo(insumo, indice, valor) {
    if (!pedidoSeleccionado || !insumo.variable) return;
    const texto = String(valor);
    if (!/^\d*(?:[.,]\d*)?$/.test(texto)) return;
    const key = getItemKey(pedidoSeleccionado.id, insumo.id);

    setLineas((actuales) => {
      const actual = actuales[key] || estadoInicial(insumo);
      const rollos = [...actual.rollos];
      rollos[indice] = texto;

      const valoresCargados = rollos
        .filter((item) => item !== "" && item !== "." && item !== ",")
        .map((item) => numeroSeguro(item, 0));
      const entregado = valoresCargados.reduce((suma, item) => suma + item, 0);
      const tieneEntregado = entregado > 0;
      const tieneRolloCero = rollos.some((item) => item !== "" && numeroSeguro(item, 0) === 0);

      return {
        ...actuales,
        [key]: {
          ...actual,
          rollos,
          entregado: Number(entregado.toFixed(8)),
          parcial: tieneEntregado && tieneRolloCero,
          confirmado: false,
        },
      };
    });
  }

  function rollosCompletos(insumo, estado) {
    if (!insumo.variable) return true;
    return estado.rollos.length === cantidadRollos(insumo) && estado.rollos.every((valor) => {
      if (valor === "" || valor === "." || valor === ",") return false;
      return numeroSeguro(valor, -1) >= 0;
    });
  }

  function confirmarLinea(insumo) {
    if (!pedidoSeleccionado) return;
    const key = getItemKey(pedidoSeleccionado.id, insumo.id);

    setLineas((actuales) => {
      const actual = actuales[key] || estadoInicial(insumo);
      if (!rollosCompletos(insumo, actual)) return actuales;

      const parcial = insumo.variable
        ? actual.entregado > 0 && actual.rollos.some((valor) => numeroSeguro(valor, 0) === 0)
        : esCantidadParcial(insumo, actual.entregado);

      return {
        ...actuales,
        [key]: { ...actual, parcial, confirmado: true },
      };
    });
  }

  function editarLinea(insumo) {
    if (!pedidoSeleccionado) return;
    const key = getItemKey(pedidoSeleccionado.id, insumo.id);
    setLineas((actuales) => ({
      ...actuales,
      [key]: { ...(actuales[key] || estadoInicial(insumo)), confirmado: false },
    }));
  }

  async function completarPedido() {
    if (!pedidoSeleccionado || !pedidoCompleto) return;

    try {
      setGuardandoArmado(true);
      setErrorArmado("");
      setMensaje("");

      const insumos = pedidoSeleccionado.insumos.map((insumo) => {
        const estado = obtenerEstado(insumo);
        return {
          insumoId: insumo.id,
          cantidadEntregada: Number(estado.entregado || 0),
          esParcial: Boolean(estado.parcial),
          rollos: insumo.variable
            ? estado.rollos.map((valor, indice) => ({
                numero: indice + 1,
                cantidad: numeroSeguro(valor, 0),
              }))
            : null,
        };
      });

      await guardarArmadoPedidoRequest({ pedidoId: pedidoSeleccionado.id, insumos });

      const restantes = pedidos.filter((pedido) => pedido.id !== pedidoSeleccionado.id);
      setPedidos(restantes);
      setPedidoSeleccionadoId(restantes[0]?.id ?? null);
      setLineas({});
      setMensaje("Armado completado correctamente.");
    } catch (error) {
      setErrorArmado(error.message || "No se pudo completar el pedido.");
    } finally {
      setGuardandoArmado(false);
    }
  }

  if (loadingPedidos) {
    return <section className="armar-page"><h1>Armar pedidos</h1><p>Cargando pedidos pendientes...</p></section>;
  }

  if (errorPedidos) {
    return <section className="armar-page"><h1>Armar pedidos</h1><p className="armar-error">{errorPedidos}</p></section>;
  }

  if (!pedidoSeleccionado) {
    return (
      <section className="armar-page">
        <header className="armar-header"><div><p className="armar-header__eyebrow">Producción</p><h1 className="armar-header__title">Armar pedidos</h1></div></header>
        {mensaje && <div className="armar-success">{mensaje}</div>}
        <div className="armar-empty"><h2>No hay pedidos pendientes</h2><p>Cuando se cree un pedido nuevo, aparecerá acá para ser armado.</p></div>
      </section>
    );
  }

  return (
    <section className="armar-page">
      <header className="armar-header">
        <div><p className="armar-header__eyebrow">Producción</p><h1 className="armar-header__title">Armar pedidos</h1></div>
        <button type="button" className="armar-header__menu-button" onClick={() => setMenuAbierto(true)}>Pedidos</button>
      </header>

      {mensaje && <div className="armar-success">{mensaje}</div>}
      {errorArmado && <p className="armar-error">{errorArmado}</p>}

      <div className="armar-layout">
        <aside className={`armar-sidebar ${menuAbierto ? "is-open" : ""}`}>
          <div className="armar-sidebar__header"><h2>Pedidos</h2><button type="button" className="armar-sidebar__close" onClick={() => setMenuAbierto(false)}>×</button></div>
          <div className="armar-sidebar__list">
            {pedidos.map((pedido) => (
              <button key={pedido.id} type="button" className={pedido.id === pedidoSeleccionadoId ? "armar-sidebar__item is-active" : "armar-sidebar__item"} onClick={() => seleccionarPedido(pedido.id)}>
                <strong>{pedido.codigo}</strong>
                <span>{pedido.linea || "Sin línea"} - {formatearFecha(pedido.fecha)}</span>
              </button>
            ))}
          </div>
        </aside>

        {menuAbierto && <button type="button" className="armar-overlay" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú de pedidos" />}

        <main className="armar-content">
          <div className="armar-content__top">
            <div>
              <p className="armar-content__label">{pedidoSeleccionado.linea || "Sin línea"}</p>
              <h2>{pedidoSeleccionado.codigo}</h2>
              <p className="armar-content__time">Solicitud: {formatearFechaHora(pedidoSeleccionado.fecha)}</p>
            </div>
            <span className="armar-status">Pendiente</span>
          </div>

          <div className={!pedidoSeleccionado.fechaInicioArmado ? "armar-locked" : ""}>
            <div className={!pedidoSeleccionado.fechaInicioArmado ? "armar-locked__blur" : ""}>
              <section className="armar-insumos">
                {pedidoSeleccionado.insumos.map((insumo) => {
                  const estado = obtenerEstado(insumo);
                  const ubicacion = formatearUbicacion(insumo);

                  return (
                    <article key={insumo.id} className={estado.confirmado ? "armar-insumo-card is-confirmed" : "armar-insumo-card is-open"}>
                      <div className="armar-insumo-card__info">
                        <p>{insumo.sku}{insumo.codigoProveedor ? ` | ${insumo.codigoProveedor}` : ""}</p>
                        <h3>{insumo.nombre}</h3>
                        <span>{insumo.variable ? `Solicitado: ${insumo.cantidad} rollos` : `Solicitado: ${insumo.cantidad} ${insumo.unidad}`}</span>
                        {!insumo.variable && <span>Lote: {insumo.lote}</span>}
                        {ubicacion && <span className="armar-ubicacion">Ubicación: {ubicacion}</span>}
                      </div>

                      <div className="armar-insumo-card__status">
                        {estado.confirmado && <b>OK</b>}
                        {estado.parcial && <em>Parcial ✓</em>}
                      </div>

                      {!estado.confirmado && insumo.variable && (
                        <div className="armar-rollos">
                          {estado.rollos.map((valor, indice) => (
                            <label key={`${insumo.id}-rollo-${indice}`} className="armar-rollo">
                              <span>Rollo {indice + 1}</span>
                              <div>
                                <input type="text" inputMode="decimal" value={valor} onChange={(event) => cambiarRollo(insumo, indice, event.target.value)} />
                                <strong>{insumo.unidad}</strong>
                              </div>
                            </label>
                          ))}
                          <div className="armar-rollos__total">Total entregado: <strong>{estado.entregado} {insumo.unidad}</strong></div>
                          <button type="button" className="armar-ok" disabled={!rollosCompletos(insumo, estado)} onClick={() => confirmarLinea(insumo)}>OK</button>
                        </div>
                      )}

                      {!estado.confirmado && !insumo.variable && (
                        <div className="armar-edit-area">
                          <div className="armar-qty">
                            <span>Entregado</span>
                            <div>
                              <button type="button" onClick={() => cambiarCantidad(insumo, -1)} disabled={estado.entregado <= 0}>−</button>
                              <strong>{estado.entregado}</strong>
                              <button type="button" onClick={() => cambiarCantidad(insumo, 1)} disabled={estado.entregado >= insumo.cantidad}>＋</button>
                            </div>
                          </div>
                          <div className="armar-line-actions"><button type="button" className="armar-ok" onClick={() => confirmarLinea(insumo)}>OK</button></div>
                        </div>
                      )}

                      {estado.confirmado && (
                        <>
                          <span className="armar-entregado-resumen">Entregado: {estado.entregado} {insumo.unidad}</span>
                          <button type="button" className="armar-edit" onClick={() => editarLinea(insumo)}>Editar</button>
                        </>
                      )}
                    </article>
                  );
                })}
              </section>

              <div className="armar-actions">
                {pedidoEsParcial && <span className="armar-status is-partial">Pedido parcial</span>}
                <button type="button" className="armar-actions__primary" disabled={!pedidoCompleto || guardandoArmado} onClick={completarPedido}>{guardandoArmado ? "Guardando..." : "Completado"}</button>
              </div>
            </div>

            {!pedidoSeleccionado.fechaInicioArmado && (
              <div className="armar-locked__panel">
                <h3>Pedido pendiente de inicio</h3>
                <p>Iniciá el armado para ver los insumos y comenzar a registrar cantidades.</p>
                <button type="button" onClick={iniciarPedidoSeleccionado} disabled={iniciandoArmado}>
                  {iniciandoArmado ? "Iniciando..." : "Iniciar armado"}
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
}
