import { useEffect, useMemo, useState } from "react";
import {
  getPedidosPendientesSalidaDepositoRequest,
  guardarSalidaDepositoRequest,
} from "../../api/pedidosApi";
import "../validacion/ValidacionPage.css";

function keyItem(pedidoId, insumoId) {
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

function aNumero(valor, fallback = 0) {
  const n = Number(String(valor ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function numeroValido(valor) {
  if (valor === "" || valor === null || valor === undefined) return false;
  return aNumero(valor, -1) >= 0;
}

function redondear(valor) {
  return Number((valor + Number.EPSILON).toFixed(8));
}

function estadoInicial(insumo) {
  if (insumo.variable) {
    return {
      rollos: (insumo.rollosArmado || []).map((rollo, indice) => ({
        numero: rollo.numero ?? indice + 1,
        cantidad: String(rollo.cantidad ?? 0),
        decision: null,
        observacion: "",
      })),
    };
  }

  return {
    cantidadSelector: Math.min(
      Number(insumo.cantidadArmada ?? 0),
      Number(insumo.cantidadSolicitada ?? 0)
    ),
    cantidadManual: "",
    decision: null,
    observacion: "",
  };
}

export default function RevisionSalidaDepositoPage() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState(null);
  const [estados, setEstados] = useState({});
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let activo = true;
    async function cargar() {
      try {
        setLoading(true);
        setError("");
        const data = await getPedidosPendientesSalidaDepositoRequest();
        const normalizados = (data || []).map((pedido) => ({
          id: pedido.id,
          codigo: pedido.codigo || `PEDIDO ${pedido.id}`,
          lineaNombre: pedido.lineaNombre || "",
          fechaSolicitud: pedido.fechaSolicitud || "",
          fechaArmado: pedido.fechaArmado || "",
          tieneParciales: Boolean(pedido.tieneParciales) || (pedido.insumos || []).some((insumo) =>
            !Boolean(insumo.variable) &&
            Number(insumo.cantidadSolicitada ?? 0) > 0 &&
            Number(insumo.cantidadArmada ?? 0) < Number(insumo.cantidadSolicitada ?? 0)
          ),
          insumos: (pedido.insumos || []).map((insumo) => ({
            id: insumo.id,
            sku: insumo.sku || "",
            codigoProveedor: insumo.codigoProveedor || "",
            nombre: insumo.nombre || "Insumo",
            cantidadSolicitada: Number(insumo.cantidadSolicitada ?? 0),
            cantidadArmada: Number(insumo.cantidadArmada ?? 0),
            esParcial: Boolean(insumo.esParcial) || (
              !Boolean(insumo.variable) &&
              Number(insumo.cantidadSolicitada ?? 0) > 0 &&
              Number(insumo.cantidadArmada ?? 0) < Number(insumo.cantidadSolicitada ?? 0)
            ),
            variable: Boolean(insumo.variable),
            unidad: insumo.unidad || "unidad",
            lote: Number(insumo.lote || 1),
            rollosArmado: Array.isArray(insumo.rollosArmado) && insumo.rollosArmado.length > 0
              ? insumo.rollosArmado
              : Array.from({ length: Math.max(0, Math.trunc(Number(insumo.cantidadSolicitada ?? 0))) }, (_, indice) => ({ numero: indice + 1, cantidad: 0 })),
          })),
        }));
        if (!activo) return;
        setPedidos(normalizados);
        setPedidoSeleccionadoId(normalizados[0]?.id ?? null);
      } catch (e) {
        if (activo) setError(e.message || "No se pudieron cargar los pedidos pendientes.");
      } finally {
        if (activo) setLoading(false);
      }
    }
    cargar();
    return () => { activo = false; };
  }, []);

  const pedido = useMemo(
    () => pedidos.find((item) => item.id === pedidoSeleccionadoId) || null,
    [pedidos, pedidoSeleccionadoId]
  );

  function estadoDe(insumo) {
    if (!pedido) return estadoInicial(insumo);
    return estados[keyItem(pedido.id, insumo.id)] || estadoInicial(insumo);
  }

  function actualizarEstado(insumo, cambios) {
    if (!pedido) return;
    const key = keyItem(pedido.id, insumo.id);
    const actual = estados[key] || estadoInicial(insumo);
    setEstados((prev) => ({ ...prev, [key]: { ...actual, ...cambios } }));
    setError("");
    setMensaje("");
  }

  function cambiarCantidadPorLote(insumo, direccion) {
    const actual = estadoDe(insumo);
    const lote = insumo.lote > 0 ? insumo.lote : 1;
    const maximo = Math.max(0, Number(insumo.cantidadSolicitada || 0));
    const siguiente = Number(actual.cantidadSelector || 0) + direccion * lote;

    actualizarEstado(insumo, {
      cantidadSelector: redondear(Math.max(0, Math.min(maximo, siguiente))),
    });
  }

  function actualizarRollo(insumo, indice, cambios) {
    const actual = estadoDe(insumo);
    const rollos = actual.rollos.map((rollo, i) => i === indice ? { ...rollo, ...cambios } : rollo);
    actualizarEstado(insumo, { rollos });
  }

  function cantidadFinalNoVariable(estado) {
    if (estado.decision === "NO_OK" && String(estado.cantidadManual ?? "").trim() !== "") {
      return aNumero(estado.cantidadManual);
    }
    return Number(estado.cantidadSelector || 0);
  }

  const puedeCompletar = useMemo(() => {
    if (!pedido || pedido.insumos.length === 0) return false;
    return pedido.insumos.every((insumo) => {
      const e = estadoDe(insumo);
      if (insumo.variable) {
        return e.rollos.length === Math.trunc(insumo.cantidadSolicitada) && e.rollos.every((rollo) => {
          if (!numeroValido(rollo.cantidad) || !rollo.decision) return false;
          return rollo.decision !== "NO_OK" || Boolean(rollo.observacion.trim());
        });
      }
      if (!e.decision || !numeroValido(e.cantidadSelector)) return false;
      if (e.decision === "NO_OK" && e.cantidadManual !== "" && !numeroValido(e.cantidadManual)) return false;
      if (e.decision === "NO_OK" && !e.observacion.trim()) return false;
      return true;
    });
  }, [pedido, estados]);

  async function completar() {
    if (!pedido || !puedeCompletar) {
      setError("Completá las cantidades y marcá OK o NO OK en todos los insumos.");
      return;
    }

    const insumos = pedido.insumos.map((insumo) => {
      const e = estadoDe(insumo);
      if (insumo.variable) {
        const rollos = e.rollos.map((rollo) => ({
          numero: rollo.numero,
          cantidad: aNumero(rollo.cantidad),
          noConforme: rollo.decision === "NO_OK",
          observacionNoConforme: rollo.decision === "NO_OK" ? rollo.observacion.trim() : null,
        }));
        return {
          insumoId: insumo.id,
          cantidadSalidaDeposito: rollos.reduce((suma, r) => suma + r.cantidad, 0),
          noConforme: rollos.some((r) => r.noConforme),
          observacionNoConforme: null,
          rollos,
        };
      }

      const noConforme = e.decision === "NO_OK";
      return {
        insumoId: insumo.id,
        cantidadSalidaDeposito: cantidadFinalNoVariable(e),
        noConforme,
        observacionNoConforme: noConforme ? e.observacion.trim() : null,
        rollos: null,
      };
    });

    try {
      setGuardando(true);
      setError("");
      await guardarSalidaDepositoRequest({ pedidoId: pedido.id, insumos });
      const restantes = pedidos.filter((item) => item.id !== pedido.id);
      setPedidos(restantes);
      setPedidoSeleccionadoId(restantes[0]?.id ?? null);
      setEstados({});
      setMensaje("Revisión de salida de depósito completada.");
    } catch (e) {
      setError(e.message || "No se pudo completar la revisión de salida.");
    } finally {
      setGuardando(false);
    }
  }

  if (loading) return <section className="revisar-page"><h1>Revisión salida de depósito</h1><p>Cargando pedidos...</p></section>;

  if (!pedido) {
    return (
      <section className="revisar-page">
        <header className="revisar-header"><div><p className="revisar-header__eyebrow">Validación</p><h1 className="revisar-header__title">Revisión salida de depósito</h1></div></header>
        {mensaje && <div className="revisar-success">{mensaje}</div>}
        {error && <div className="revisar-code__error">{error}</div>}
        <div className="revisar-empty"><h2>No hay pedidos pendientes</h2><p>Los pedidos aparecen acá después de finalizar el armado.</p></div>
      </section>
    );
  }

  return (
    <section className="revisar-page">
      <header className="revisar-header">
        <div><p className="revisar-header__eyebrow">Validación</p><h1 className="revisar-header__title">Revisión salida de depósito</h1></div>
        <button type="button" className="revisar-header__menu-button" onClick={() => setMenuAbierto(true)}>Pedidos</button>
      </header>
      {mensaje && <div className="revisar-success">{mensaje}</div>}
      {error && <div className="revisar-code__error">{error}</div>}

      <div className="revisar-layout">
        <aside className={`revisar-sidebar ${menuAbierto ? "is-open" : ""}`}>
          <div className="revisar-sidebar__header"><h2>Pedidos</h2><button type="button" className="revisar-sidebar__close" onClick={() => setMenuAbierto(false)}>×</button></div>
          <div className="revisar-sidebar__list">
            {pedidos.map((item) => (
              <button key={item.id} type="button" className={item.id === pedidoSeleccionadoId ? "revisar-sidebar__item is-active" : "revisar-sidebar__item"} onClick={() => { setPedidoSeleccionadoId(item.id); setMenuAbierto(false); setError(""); }}>
                <span className="revisar-sidebar__main">{item.tieneParciales && <i />}<strong>{item.codigo}</strong></span>
                <span className="revisar-sidebar__meta">{item.lineaNombre || "Sin línea"} - {formatearFecha(item.fechaArmado)}</span>
              </button>
            ))}
          </div>
        </aside>
        {menuAbierto && <button type="button" className="revisar-overlay" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú" />}

        <main className="revisar-content">
          <div className="revisar-content__top">
            <div>
              <p className="revisar-content__label">{pedido.lineaNombre || "Sin línea"}</p>
              <h2>{pedido.codigo}</h2>
              <p className="revisar-content__time">Armado: {formatearFechaHora(pedido.fechaArmado)}</p>
            </div>
            {pedido.tieneParciales && <span className="revisar-status is-partial">Parcial</span>}
          </div>

          <section className="revisar-insumos">
            {pedido.insumos.map((insumo) => {
              const e = estadoDe(insumo);
              return (
                <article key={insumo.id} className="revisar-insumo-card">
                  <div className="revisar-insumo-card__info">
                    <p>{insumo.sku}{insumo.codigoProveedor ? ` | ${insumo.codigoProveedor}` : ""}</p>
                    <h3>{insumo.nombre}</h3>
                    <div className="revisar-insumo-card__numbers">
                      <span>Solicitado: {insumo.variable ? `${insumo.cantidadSolicitada} rollos` : `${insumo.cantidadSolicitada} ${insumo.unidad}`}</span>
                      <span>Entregado por armado: {insumo.cantidadArmada} {insumo.unidad}</span>
                    </div>
                  </div>
                  {insumo.esParcial && <span className="revisar-insumo-card__partial">Parcial</span>}

                  {insumo.variable ? (
                    <div className="revisar-rollos">
                      {e.rollos.map((rollo, indice) => (
                        <div className="revisar-rollo-card" key={`${insumo.id}-rollo-${rollo.numero}`}>
                          <div className="revisar-rollo-card__top"><strong>Rollo {rollo.numero}</strong><span>Armado: {insumo.rollosArmado[indice]?.cantidad ?? 0} {insumo.unidad}</span></div>
                          <label className="revisar-cantidad"><span>Cantidad en salida</span><input type="text" inputMode="decimal" value={rollo.cantidad} onChange={(event) => actualizarRollo(insumo, indice, { cantidad: event.target.value })} /></label>
                          <div className="revisar-decision">
                            <button type="button" className={`revisar-decision__ok ${rollo.decision === "OK" ? "is-active" : ""}`} onClick={() => actualizarRollo(insumo, indice, { decision: "OK", observacion: "" })}>OK</button>
                            <button type="button" className={`revisar-decision__no ${rollo.decision === "NO_OK" ? "is-active" : ""}`} onClick={() => actualizarRollo(insumo, indice, { decision: "NO_OK" })}>NO OK</button>
                          </div>
                          {rollo.decision === "NO_OK" && <label className="revisar-observacion"><span>Observación obligatoria</span><textarea value={rollo.observacion} onChange={(event) => actualizarRollo(insumo, indice, { observacion: event.target.value })} /></label>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="revisar-insumo-card__control">
                      <div className="revisar-cantidad">
                        <span>Cantidad en salida · lote {insumo.lote}</span>
                        <div className="revisar-stepper"><button type="button" onClick={() => cambiarCantidadPorLote(insumo, -1)}>−</button><strong>{e.cantidadSelector}</strong><button type="button" onClick={() => cambiarCantidadPorLote(insumo, 1)}>＋</button></div>
                      </div>
                      <div className="revisar-decision">
                        <button type="button" className={`revisar-decision__ok ${e.decision === "OK" ? "is-active" : ""}`} onClick={() => actualizarEstado(insumo, { decision: "OK", cantidadManual: "", observacion: "" })}>OK</button>
                        <button type="button" className={`revisar-decision__no ${e.decision === "NO_OK" ? "is-active" : ""}`} onClick={() => actualizarEstado(insumo, { decision: "NO_OK" })}>NO OK</button>
                      </div>
                      {e.decision === "NO_OK" && <>
                        <label className="revisar-cantidad"><span>Cantidad manual opcional</span><input type="text" inputMode="decimal" value={e.cantidadManual} onChange={(event) => actualizarEstado(insumo, { cantidadManual: event.target.value })} placeholder={`Si lo completás, reemplaza ${e.cantidadSelector}`} /></label>
                        <label className="revisar-observacion"><span>Observación obligatoria</span><textarea value={e.observacion} onChange={(event) => actualizarEstado(insumo, { observacion: event.target.value })} /></label>
                      </>}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          <div className="revisar-actions revisar-actions--full">
            <button type="button" className="revisar-actions__primary" disabled={!puedeCompletar || guardando} onClick={completar}>{guardando ? "Guardando..." : "Completar revisión de salida"}</button>
          </div>
        </main>
      </div>
    </section>
  );
}
