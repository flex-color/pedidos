export default function AdminTabs({ tabs, tabActiva, onChange }) {
  return (
    <nav className="admin-tabs" aria-label="Secciones de administración">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={
            tabActiva === tab.id
              ? "admin-tabs__item is-active"
              : "admin-tabs__item"
          }
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
