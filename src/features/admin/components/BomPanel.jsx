export default function BomPanel({
  lineaBomSeleccionada,
  bomItems,
  loadingBom,
  onAgregar,
  onEditar,
  onBorrar,
}) {
  if (!lineaBomSeleccionada) {
    return null;
  }

  return (
    <section className="admin-bom-panel">
      <div className="admin-panel__top">
        <div>
          <p className="admin-panel__label">BOM seleccionado</p>
          <h2>{lineaBomSeleccionada.nombre}</h2>
        </div>

        <button
          type="button"
          className="admin-panel__create"
          onClick={onAgregar}
        >
          + Agregar insumo
        </button>
      </div>

      {loadingBom && <div className="admin-empty">Cargando BOM...</div>}

      {!loadingBom && bomItems.length === 0 && (
        <div className="admin-empty">
          Esta línea todavía no tiene insumos cargados.
        </div>
      )}

      {!loadingBom && bomItems.length > 0 && (
        <div className="admin-bom-list">
          {bomItems.map((item) => (
            <article key={item.id} className="admin-card admin-bom-card">
              <div className="admin-card__info">
                <p className="admin-bom-card__eyebrow">
                  Insumo #{item.idInsumo}
                </p>

                <h3>{item.nombre || `Insumo ${item.idInsumo}`}</h3>

                <div className="admin-bom-meta">
                  {item.sku && <span>SKU: {item.sku}</span>}
                  {item.unidad && <span>Unidad: {item.unidad}</span>}
                  <span>Cantidad base: {item.cantidadBase}</span>
                </div>
              </div>

              <div className="admin-card__actions">
                <button type="button" onClick={() => onEditar(item)}>
                  Editar cantidad
                </button>

                <button type="button" onClick={() => onBorrar(item)}>
                  Quitar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}