import { useState } from "react";
import { buscarInsumosRequest } from "../../../api/insumosApi";

export default function BomForm({ formBom, cambiarCampoBom, modalAccion }) {
  const [busquedaInsumo, setBusquedaInsumo] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");

  async function buscarInsumos() {
    const texto = busquedaInsumo.trim();

    if (!texto) {
      setErrorBusqueda("Escribí un SKU o nombre de insumo.");
      setResultados([]);
      return;
    }

    try {
      setBuscando(true);
      setErrorBusqueda("");

      const data = await buscarInsumosRequest(texto);
      setResultados(data || []);
    } catch (error) {
      setErrorBusqueda(error.message || "No se pudo buscar el insumo.");
    } finally {
      setBuscando(false);
    }
  }

  function seleccionarInsumo(insumo) {
    const id = insumo.idInsumo ?? insumo.id_insumo ?? insumo.id;
    const sku = insumo.sku || "";
    const nombre = insumo.nombre || "";

    cambiarCampoBom("idInsumo", id);
    cambiarCampoBom("insumoTexto", `${sku} - ${nombre}`);

    setBusquedaInsumo(`${sku} - ${nombre}`);
    setResultados([]);
  }

  return (
    <>
      {modalAccion === "crear" && (
        <div className="admin-bom-search-box">
          <label className="admin-search">
            <span>Buscar insumo</span>
            <input
              type="text"
              value={busquedaInsumo}
              onChange={(event) => {
                setBusquedaInsumo(event.target.value);
                cambiarCampoBom("idInsumo", "");
                cambiarCampoBom("insumoTexto", "");
              }}
              placeholder="Buscar por SKU o nombre"
            />
          </label>

          <button
            type="button"
            className="admin-search-row__primary"
            onClick={buscarInsumos}
            disabled={buscando}
          >
            {buscando ? "Buscando..." : "Buscar insumo"}
          </button>

          {errorBusqueda && (
            <div className="admin-error">{errorBusqueda}</div>
          )}

          {resultados.length > 0 && (
            <div className="admin-bom-results">
              {resultados.map((insumo) => {
                const id = insumo.idInsumo ?? insumo.id_insumo ?? insumo.id;

                return (
                  <button
                    key={id}
                    type="button"
                    className="admin-bom-result"
                    onClick={() => seleccionarInsumo(insumo)}
                  >
                    <strong>{insumo.nombre}</strong>
                    <span>
                      ID: {id}
                      {insumo.sku ? ` · SKU: ${insumo.sku}` : ""}
                      {insumo.unidad ? ` · Unidad: ${insumo.unidad}` : ""}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {formBom.idInsumo && (
            <div className="admin-selected-box">
              <span>Insumo seleccionado</span>
              <strong>
                {formBom.insumoTexto || `ID insumo: ${formBom.idInsumo}`}
              </strong>
            </div>
          )}
        </div>
      )}

      {modalAccion === "editar" && (
        <label className="admin-search">
          <span>ID insumo</span>
          <input
            type="number"
            value={formBom.idInsumo}
            disabled
          />
        </label>
      )}

      <label className="admin-search">
        <span>Cantidad base</span>
        <input
          type="number"
          step="0.01"
          value={formBom.cantidadBase}
          onChange={(event) =>
            cambiarCampoBom("cantidadBase", event.target.value)
          }
          placeholder="Ej: 2"
        />
      </label>
    </>
  );
}