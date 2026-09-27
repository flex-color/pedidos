export default function InsumoForm({
  formInsumo,
  cambiarCampoInsumo,
}) {
  return (
    <>
      <label className="admin-search">
        <span>SKU</span>
        <input
          type="text"
          value={formInsumo.sku ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo("sku", event.target.value)
          }
          placeholder="Ej: ROL-001"
        />
      </label>

      <label className="admin-search">
        <span>Nombre</span>
        <input
          type="text"
          value={formInsumo.nombre ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo("nombre", event.target.value)
          }
          placeholder="Ej: Tela sunscreen 5%"
        />
      </label>

      <label className="admin-search">
        <span>Descripción</span>
        <input
          type="text"
          value={formInsumo.descripcion ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo("descripcion", event.target.value)
          }
          placeholder="Descripción opcional"
        />
      </label>

      <label className="admin-search">
        <span>Unidad interna</span>
        <input
          type="text"
          value={formInsumo.unidad ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo("unidad", event.target.value)
          }
          placeholder="Ej: m / unidad / kg"
        />
      </label>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={Boolean(formInsumo.variable)}
          onChange={(event) =>
            cambiarCampoInsumo(
              "variable",
              event.target.checked
            )
          }
        />

        <span>Cantidad variable</span>
      </label>

      <label className="admin-search">
        <span>Lote</span>
        <input
          type="number"
          min="0.0001"
          step="any"
          value={formInsumo.lote ?? 1}
          onChange={(event) =>
            cambiarCampoInsumo("lote", event.target.value)
          }
          placeholder="Ej: 1 / 100 / 0.5"
        />
      </label>

      <label className="admin-search">
        <span>Unidad Trilay</span>
        <input
          type="text"
          value={formInsumo.unidadTrilay ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo(
              "unidadTrilay",
              event.target.value
            )
          }
          placeholder="Ej: ft / unidad / kg"
        />
      </label>

      <label className="admin-search">
        <span>Factor conversión Trilay</span>
        <input
          type="number"
          min="0"
          step="any"
          value={formInsumo.factorConversionTrilay ?? 1}
          onChange={(event) =>
            cambiarCampoInsumo(
              "factorConversionTrilay",
              event.target.value
            )
          }
          placeholder="Ej: 1 / 3.2808399"
        />
      </label>

      <label className="admin-search">
        <span>Almacén</span>
        <input
          type="text"
          value={formInsumo.almacen ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo(
              "almacen",
              event.target.value
            )
          }
          placeholder="Ej: 1"
        />
      </label>

      <label className="admin-search">
        <span>Pasillo</span>
        <input
          type="text"
          value={formInsumo.pasillo ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo(
              "pasillo",
              event.target.value
            )
          }
          placeholder="Ej: 3"
        />
      </label>

      <label className="admin-search">
        <span>Rack</span>
        <input
          type="text"
          value={formInsumo.rack ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo(
              "rack",
              event.target.value
            )
          }
          placeholder="Ej: 35"
        />
      </label>

      <label className="admin-search">
        <span>Nivel rack</span>
        <input
          type="text"
          value={formInsumo.nivelRack ?? ""}
          onChange={(event) =>
            cambiarCampoInsumo(
              "nivelRack",
              event.target.value
            )
          }
          placeholder="Ej: 3"
        />
      </label>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={formInsumo.activo !== false}
          onChange={(event) =>
            cambiarCampoInsumo(
              "activo",
              event.target.checked
            )
          }
        />

        <span>Activo</span>
      </label>
    </>
  );
}