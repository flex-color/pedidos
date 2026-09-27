export default function LineaForm({ formLinea, cambiarCampoLinea }) {
  return (
    <>
      <label className="admin-search">
        <span>Nombre</span>
        <input
          type="text"
          value={formLinea.nombre}
          onChange={(event) => cambiarCampoLinea("nombre", event.target.value)}
          placeholder="Ej: Roller"
        />
      </label>

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={formLinea.activo}
          onChange={(event) =>
            cambiarCampoLinea("activo", event.target.checked)
          }
        />
        <span>Activo</span>
      </label>
    </>
  );
}
