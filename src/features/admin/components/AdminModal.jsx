export default function AdminModal({
  eyebrow,
  title,
  children,
  onClose,
  actions,
  danger = false,
}) {
  return (
    <div className="admin-modal">
      <button
        type="button"
        className="admin-modal__backdrop"
        onClick={onClose}
        aria-label="Cerrar modal"
      />

      <section
        className={
          danger
            ? "admin-modal__card admin-modal__card--danger"
            : "admin-modal__card"
        }
      >
        <div className="admin-modal__header">
          <div>
            <p>{eyebrow}</p>
            <h2>{title}</h2>
          </div>

          <button type="button" onClick={onClose}>
            ×
          </button>
        </div>

        {children}

        {actions && <div className="admin-modal__actions">{actions}</div>}
      </section>
    </div>
  );
}
