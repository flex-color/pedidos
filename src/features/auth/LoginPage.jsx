import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequest } from "../../api/authApi";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    usuario: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.usuario.trim() || !form.password.trim()) {
      setError("Ingresá usuario y contraseña.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await loginRequest({
        username: form.usuario.trim(),
        password: form.password,
      });

      navigate("/", { replace: true });
    } catch (error) {  
      setError(error.message || "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-card__brand">
          <div className="login-card__logo">F</div>
          <div>
            <h1 className="login-card__title">FlexColor</h1>
            <p className="login-card__subtitle">Sistema de pedidos</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-form__field">
            <span>Usuario</span>
            <input
              type="text"
              name="usuario"
              value={form.usuario}
              onChange={handleChange}
              placeholder="Ingresar usuario"
              autoComplete="username"
              disabled={loading}
            />
          </label>

          <label className="login-form__field">
            <span>Contraseña</span>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Ingresar contraseña"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          {error && <p className="login-form__error">{error}</p>}

          <button type="submit" className="login-form__button" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
