export default function AdminCard({
  item,
  tabActiva,
  onEditar,
  onBorrar,
  onAdministrarBom,
}) {
  return (
    <article className="admin-card">
      <div className="admin-card__info">
        {tabActiva === "usuarios" ? (
          <>
            <h3>{item.username}</h3>
            <p>Rol: {item.rol}</p>
          </>
        ) : (
          <>
            <h3>{item.nombre}</h3>

            {tabActiva === "insumos" && (
              <p>
                SKU: {item.sku}
                {item.unidad ? ` · Unidad: ${item.unidad}` : ""}
              </p>
            )}

            {(tabActiva === "lineas" || tabActiva === "bom") && (
              <p>Línea de producto</p>
            )}
          </>
        )}
      </div>

      <span
        className={
          item.activo ? "admin-card__status is-ok" : "admin-card__status"
        }
      >
        {item.activo ? "Activo" : "Inactivo"}
      </span>

      <div className="admin-card__actions">
        {tabActiva === "bom" ? (
          <button type="button" onClick={() => onAdministrarBom(item)}>
            Administrar BOM
          </button>
        ) : (
          <>
            <button type="button" onClick={() => onEditar(item)}>
              Editar
            </button>

            <button type="button" onClick={() => onBorrar(item)}>
              Borrar
            </button>
          </>
        )}
      </div>
    </article>
  );
}
