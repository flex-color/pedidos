export default function AdminSearch({
  busqueda,
  setBusqueda,
  placeholder,
  loading,
  onSubmit,
  onLimpiar,
}) {
  return (
    <form className="admin-search-row" onSubmit={onSubmit}>
      <label className="admin-search">
        <span>{placeholder}</span>
        <input
          type="text"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder={placeholder}
        />
      </label>

      <div className="admin-search-row__actions">
        <button type="submit" className="admin-search-row__primary">
          {loading ? "Buscando..." : "Buscar"}
        </button>

        <button
          type="button"
          className="admin-search-row__secondary"
          onClick={onLimpiar}
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
