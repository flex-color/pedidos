export default function UsuarioForm({
  formUsuario,
  cambiarCampoUsuario,
  modalAccion,
}) {
  return (
    <>
      <label className="admin-search">
        <span>Usuario</span>
        <input
          type="text"
          value={formUsuario.username}
          onChange={(event) =>
            cambiarCampoUsuario(
              "username",
              event.target.value
            )
          }
          placeholder="Ej: operario"
        />
      </label>

      <label className="admin-search">
        <span>
          {modalAccion === "crear"
            ? "Contraseña"
            : "Nueva contraseña opcional"}
        </span>

        <input
          type="password"
          value={formUsuario.password}
          onChange={(event) =>
            cambiarCampoUsuario(
              "password",
              event.target.value
            )
          }
          placeholder={
            modalAccion === "crear"
              ? "Contraseña"
              : "Dejar vacío para no cambiar"
          }
        />
      </label>

      <label className="admin-search">
        <span>Rol</span>

        <select
          value={formUsuario.rol}
          onChange={(event) =>
            cambiarCampoUsuario(
              "rol",
              event.target.value
            )
          }
        >
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      </label>

      <label className="admin-search">
        <span>Sector</span>

        <select
          value={formUsuario.sector}
          onChange={(event) =>
            cambiarCampoUsuario(
              "sector",
              event.target.value
            )
          }
        >
          <option value="ARMADOR">
            ARMADOR
          </option>

          <option value="VALIDADOR">
            VALIDADOR
          </option>

          <option value="EXPORTADOR">
            EXPORTADOR
          </option>

          <option value="TODO">
            TODO
          </option>
        </select>
      </label>

      {modalAccion !== "crear" && (
        <label className="admin-search">
          <span>Celular</span>
          <input
            type="text"
            value={formUsuario.celular || ""}
            onChange={(event) => cambiarCampoUsuario("celular", event.target.value)}
            placeholder="Ej: 2615551234"
          />
        </label>
      )}

      <label className="admin-checkbox">
        <input
          type="checkbox"
          checked={formUsuario.activo}
          onChange={(event) =>
            cambiarCampoUsuario(
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