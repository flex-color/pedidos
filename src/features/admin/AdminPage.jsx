import { useState } from "react";
import {
  actualizarInsumoRequest,
  borrarInsumoRequest,
  borrarTodosInsumosRequest,
  buscarInsumosRequest,
  crearInsumoRequest,
  importarInsumosRequest,
  descargarInsumosRequest,
} from "../../api/insumosApi";
import {
  actualizarLineaRequest,
  borrarLineaRequest,
  borrarTodosLineasRequest,
  buscarLineasRequest,
  crearLineaRequest,
  importarLineasRequest,
  descargarLineasRequest,
} from "../../api/lineasAdminApi";
import {
  actualizarUsuarioRequest,
  borrarUsuarioRequest,
  buscarUsuariosRequest,
  crearUsuarioRequest,
} from "../../api/usuariosAdminApi";
import {
  agregarInsumoABomRequest,
  actualizarBomRequest,
  borrarBomRequest,
  borrarTodosBomRequest,
  buscarBomPorLineaRequest,
  importarBomRequest,
  descargarBomRequest,
} from "../../api/bomAdminApi";

import AdminTabs from "./components/AdminTabs";
import AdminSearch from "./components/AdminSearch";
import AdminCard from "./components/AdminCard";
import AdminModal from "./components/AdminModal";
import InsumoForm from "./components/InsumoForm";
import LineaForm from "./components/LineaForm";
import UsuarioForm from "./components/UsuarioForm";
import BomForm from "./components/BomForm";
import BomPanel from "./components/BomPanel";

import "./AdminPage.css";

const TABS = [
  { id: "insumos", label: "Insumos" },
  { id: "lineas", label: "Líneas" },
  { id: "usuarios", label: "Usuarios" },
  { id: "bom", label: "BOM" },
];

const TAB_COPY = {
  insumos: {
    title: "Administrar insumos",
    search: "Buscar insumo por nombre o SKU",
    create: "Crear insumo",
    update: "Cargar actualización",
    empty: "Buscá un insumo por nombre o SKU para verlo.",
    notFound: "No encontramos insumos con esa búsqueda.",
  },
  lineas: {
    title: "Administrar líneas",
    search: "Buscar línea por nombre",
    create: "Crear línea",
    update: "Cargar actualización",
    empty: "Buscá una línea por nombre para verla.",
    notFound: "No encontramos líneas con esa búsqueda.",
  },
  usuarios: {
    title: "Administrar usuarios",
    search: "Buscar usuario",
    create: "Crear usuario",
    update: "Cargar actualización",
    empty: "Buscá un usuario para verlo.",
    notFound: "No encontramos usuarios con esa búsqueda.",
  },
  bom: {
    title: "Administrar BOM",
    search: "Buscar línea por nombre para administrar sus insumos",
    create: "Agregar insumo a línea",
    update: "Cargar actualización",
    empty: "Buscá una línea para ver o modificar sus insumos.",
    notFound: "No encontramos líneas con esa búsqueda.",
  },
  pedidos: {
    title: "Ajustar pedidos",
    search: "Buscar pedido por código",
    create: "Nuevo ajuste",
    update: "Cargar actualización",
    empty: "Todavía no conectamos pedidos desde Admin.",
    notFound: "No encontramos pedidos con esa búsqueda.",
  },
};

const FORM_INSUMO_INICIAL = {
  id: null,
  sku: "",
  nombre: "",
  descripcion: "",
  unidad: "",
  variable: false,
  lote: 1,
  unidadTrilay: "",
  factorConversionTrilay: 1,
  almacen: "",
  pasillo: "",
  rack: "",
  nivelRack: "",
  activo: true,
};

const FORM_LINEA_INICIAL = {
  id: null,
  nombre: "",
  activo: true,
};

const FORM_USUARIO_INICIAL = {
  id: null,
  username: "",
  password: "",
  rol: "USER",
  sector: "TODO",
  celular: "",
  activo: true,
};

const FORM_BOM_INICIAL = {
  id: null,
  idInsumo: "",
  cantidadBase: "",
};

function normalizarInsumo(insumo) {
  return {
    id: insumo.idInsumo ?? insumo.id_insumo ?? insumo.id,
    tipo: "insumo",
    sku: insumo.sku || "",
    nombre: insumo.nombre || "",
    descripcion: insumo.descripcion || "",
    unidad: insumo.unidad || "",
    variable: Boolean(insumo.variable),
    lote: insumo.lote ?? 1,
    unidadTrilay: insumo.unidadTrilay ?? insumo.unidad_trilay ?? "",
    factorConversionTrilay:
      insumo.factorConversionTrilay ??
      insumo.factor_conversion_trilay ??
      1,
    almacen: insumo.almacen ?? "",
    pasillo: insumo.pasillo ?? "",
    rack: insumo.rack ?? "",
    nivelRack: insumo.nivelRack ?? insumo.nivel_rack ?? "",
    activo: insumo.activo !== false,
  };
}

function normalizarLinea(linea) {
  return {
    id: linea.idLinea ?? linea.id_linea ?? linea.id,
    tipo: "linea",
    nombre: linea.nombre || "",
    activo: linea.activo !== false,
  };
}

function normalizarUsuario(usuario) {
  return {
    id: usuario.idUsuario ?? usuario.id_usuario ?? usuario.id,
    tipo: "usuario",
    username: usuario.username || "",
    rol: usuario.rol || "USER",
    sector: usuario.sector || "TODO",
    celular: usuario.celular || "",
    activo: usuario.activo !== false,
  };
}

function normalizarBom(item) {
  return {
    id: item.idBom ?? item.id_bom ?? item.id,
    idLinea: item.idLinea ?? item.id_linea,
    idInsumo: item.idInsumo ?? item.id_insumo,
    sku: item.sku || "",
    nombre: item.nombre || item.insumoNombre || "",
    unidad: item.unidad || "",
    cantidadBase: item.cantidadBase ?? item.cantidad_base ?? "",
  };
}

export default function AdminPage() {
  const [tabActiva, setTabActiva] = useState("insumos");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaEjecutada, setBusquedaEjecutada] = useState(false);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [modalAccion, setModalAccion] = useState(null);
  const [itemABorrar, setItemABorrar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [archivoImportacion, setArchivoImportacion] = useState(null);
  const [importando, setImportando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  const [formInsumo, setFormInsumo] = useState(FORM_INSUMO_INICIAL);
  const [formLinea, setFormLinea] = useState(FORM_LINEA_INICIAL);
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL);
  const [formBom, setFormBom] = useState(FORM_BOM_INICIAL);

  const [lineaBomSeleccionada, setLineaBomSeleccionada] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [loadingBom, setLoadingBom] = useState(false);

  function cambiarTab(tabId) {
    setTabActiva(tabId);
    setBusqueda("");
    setBusquedaEjecutada(false);
    setItems([]);
    setMensaje("");
    setError("");
    setModalAccion(null);
    setItemABorrar(null);
    setArchivoImportacion(null);
    setImportando(false);
    setDescargando(false);
    setFormInsumo(FORM_INSUMO_INICIAL);
    setFormLinea(FORM_LINEA_INICIAL);
    setFormUsuario(FORM_USUARIO_INICIAL);
    setFormBom(FORM_BOM_INICIAL);
    setLineaBomSeleccionada(null);
    setBomItems([]);
  }

  async function buscar(event) {
    event.preventDefault();

    setMensaje("");
    setError("");
    setBusquedaEjecutada(true);

    const texto = busqueda.trim();

    if (!texto || tabActiva === "pedidos") {
      setItems([]);
      return;
    }

    try {
      setLoading(true);

      if (tabActiva === "insumos") {
        const data = await buscarInsumosRequest(texto);
        setItems((data || []).map(normalizarInsumo));
      }

      if (tabActiva === "lineas") {
        const data = await buscarLineasRequest(texto);
        setItems((data || []).map(normalizarLinea));
      }

      if (tabActiva === "usuarios") {
        const data = await buscarUsuariosRequest(texto);
        setItems((data || []).map(normalizarUsuario));
      }

      if (tabActiva === "bom") {
        const data = await buscarLineasRequest(texto);
        setItems((data || []).map(normalizarLinea));
      }
    } catch (error) {
      setError(error.message || "No se pudo realizar la búsqueda.");
    } finally {
      setLoading(false);
    }
  }

  async function refrescarBusquedaActual() {
    if (!busquedaEjecutada || !busqueda.trim()) return;

    const texto = busqueda.trim();

    if (tabActiva === "insumos") {
      const data = await buscarInsumosRequest(texto);
      setItems((data || []).map(normalizarInsumo));
    }

    if (tabActiva === "lineas") {
      const data = await buscarLineasRequest(texto);
      setItems((data || []).map(normalizarLinea));
    }

    if (tabActiva === "usuarios") {
      const data = await buscarUsuariosRequest(texto);
      setItems((data || []).map(normalizarUsuario));
    }

    if (tabActiva === "bom") {
      const data = await buscarLineasRequest(texto);
      setItems((data || []).map(normalizarLinea));
    }
  }

  function limpiarBusqueda() {
    setBusqueda("");
    setBusquedaEjecutada(false);
    setItems([]);
    setMensaje("");
    setError("");
    setLineaBomSeleccionada(null);
    setBomItems([]);
  }

  function abrirCrear() {
    setMensaje("");
    setError("");

    if (tabActiva === "insumos") {
      setFormInsumo(FORM_INSUMO_INICIAL);
      setModalAccion("crear");
      return;
    }

    if (tabActiva === "lineas") {
      setFormLinea(FORM_LINEA_INICIAL);
      setModalAccion("crear");
      return;
    }

    if (tabActiva === "usuarios") {
      setFormUsuario(FORM_USUARIO_INICIAL);
      setModalAccion("crear");
      return;
    }

    if (tabActiva === "bom") {
      if (!lineaBomSeleccionada) {
        setMensaje("Primero seleccioná una línea para administrar su BOM.");
        return;
      }

      setFormBom(FORM_BOM_INICIAL);
      setModalAccion("crear");
      return;
    }

    setMensaje("Esta sección todavía no está conectada.");
  }

  async function descargarListadoActual() {
    try {
      setDescargando(true);
      setMensaje("");
      setError("");

      if (tabActiva === "insumos") {
        await descargarInsumosRequest();
        setMensaje("Listado de insumos descargado correctamente.");
        return;
      }

      if (tabActiva === "lineas") {
        await descargarLineasRequest();
        setMensaje("Listado de líneas descargado correctamente.");
        return;
      }

      if (tabActiva === "bom") {
        await descargarBomRequest();
        setMensaje("Listado de BOM descargado correctamente.");
        return;
      }

      setError(
        "La descarga no está disponible para esta sección."
      );
    } catch (error) {
      setError(
        error.message ||
        "No se pudo descargar el listado."
      );
    } finally {
      setDescargando(false);
    }
  }

  function abrirActualizacion() {
    setMensaje("");
    setError("");
    setArchivoImportacion(null);

    if (!["insumos", "lineas", "bom"].includes(tabActiva)) {
      setMensaje(
        "La carga masiva no está disponible para esta sección."
      );
      return;
    }

    setModalAccion("actualizar");
  }

  async function importarArchivoActual() {
    if (!archivoImportacion) {
      setError("Debés seleccionar un archivo Excel.");
      return;
    }

    try {
      setImportando(true);
      setMensaje("");
      setError("");

      let resultado;

      if (tabActiva === "insumos") {
        resultado = await importarInsumosRequest(
          archivoImportacion
        );
      }

      if (tabActiva === "lineas") {
        resultado = await importarLineasRequest(
          archivoImportacion
        );
      }

      if (tabActiva === "bom") {
        resultado = await importarBomRequest(
          archivoImportacion
        );
      }

      setModalAccion(null);
      setArchivoImportacion(null);

      setMensaje(
        `Importación completada. Procesados: ${resultado?.procesados ?? 0}. ` +
        `Creados: ${resultado?.creados ?? 0}. ` +
        `Actualizados: ${resultado?.actualizados ?? 0}.`
      );

      await refrescarBusquedaActual();

      if (tabActiva === "bom" && lineaBomSeleccionada) {
        await refrescarBom();
      }
    } catch (error) {
      setError(
        error.message ||
        "No se pudo importar el archivo."
      );
    } finally {
      setImportando(false);
      setModalAccion(null);
      setArchivoImportacion(null);
    }
  }

  function abrirEditar(item) {
    setMensaje("");
    setError("");

    if (tabActiva === "insumos") {
      setFormInsumo({
        id: item.id,
        sku: item.sku || "",
        nombre: item.nombre || "",
        descripcion: item.descripcion || "",
        unidad: item.unidad || "",
        variable: Boolean(item.variable),
        lote: item.lote ?? 1,
        unidadTrilay: item.unidadTrilay ?? "",
        factorConversionTrilay: item.factorConversionTrilay ?? 1,
        almacen: item.almacen ?? "",
        pasillo: item.pasillo ?? "",
        rack: item.rack ?? "",
        nivelRack: item.nivelRack ?? "",
        activo: item.activo !== false,
      });
      setModalAccion("editar");
      return;
    }

    if (tabActiva === "lineas") {
      setFormLinea({
        id: item.id,
        nombre: item.nombre || "",
        activo: item.activo !== false,
      });
      setModalAccion("editar");
      return;
    }

    if (tabActiva === "usuarios") {
      setFormUsuario({
        id: item.id,
        username: item.username || "",
        password: "",
        rol: item.rol || "USER",
        sector: item.sector || "TODO",
        celular: item.celular || "",
        activo: item.activo !== false,
      });
      setModalAccion("editar");
      return;
    }

    if (tabActiva === "bom") {
      setFormBom({
        id: item.id,
        idInsumo: item.idInsumo || "",
        cantidadBase: item.cantidadBase || "",
      });
      setModalAccion("editar");
    }
  }

  function abrirBorrar(item) {
    setItemABorrar(item);
    setModalAccion("borrar");
    setMensaje("");
    setError("");
  }

  function cambiarCampoInsumo(campo, valor) {
    setFormInsumo((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarCampoLinea(campo, valor) {
    setFormLinea((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarCampoUsuario(campo, valor) {
    setFormUsuario((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarCampoBom(campo, valor) {
    setFormBom((actual) => ({ ...actual, [campo]: valor }));
  }

  async function administrarBom(linea) {
    try {
      setLoadingBom(true);
      setMensaje("");
      setError("");
      setLineaBomSeleccionada(linea);

      const data = await buscarBomPorLineaRequest(linea.id);
      setBomItems((data || []).map(normalizarBom));
    } catch (error) {
      setError(error.message || "No se pudo cargar el BOM de la línea.");
    } finally {
      setLoadingBom(false);
    }
  }

  async function refrescarBom() {
    if (!lineaBomSeleccionada) return;

    const data = await buscarBomPorLineaRequest(lineaBomSeleccionada.id);
    setBomItems((data || []).map(normalizarBom));
  }

  function validarFormulario() {
    if (tabActiva === "insumos") {
      if (!formInsumo.sku.trim()) {
        setError("El SKU es obligatorio.");
        return false;
      }

      if (!formInsumo.nombre.trim()) {
        setError("El nombre es obligatorio.");
        return false;
      }

      if (!formInsumo.unidad.trim()) {
        setError("La unidad es obligatoria.");
        return false;
      }

      if (Number(formInsumo.lote) <= 0 || Number.isNaN(Number(formInsumo.lote))) {
        setError("El lote debe ser mayor a cero.");
        return false;
      }

      if (
        Number(formInsumo.factorConversionTrilay) <= 0 ||
        Number.isNaN(Number(formInsumo.factorConversionTrilay))
      ) {
        setError("El factor de conversión Trilay debe ser mayor a cero.");
        return false;
      }

      return true;
    }

    if (tabActiva === "lineas") {
      if (!formLinea.nombre.trim()) {
        setError("El nombre de la línea es obligatorio.");
        return false;
      }

      return true;
    }

    if (tabActiva === "usuarios") {
      if (!formUsuario.username.trim()) {
        setError("El usuario es obligatorio.");
        return false;
      }

      if (modalAccion === "crear" && !formUsuario.password.trim()) {
        setError("La contraseña es obligatoria.");
        return false;
      }

      if (!["ADMIN", "USER"].includes(formUsuario.rol)) {
        setError("El rol debe ser ADMIN o USER.");
        return false;
      }

      if (
        !["ARMADOR", "VALIDADOR", "EXPORTADOR", "TODO"].includes(
          formUsuario.sector
        )
      ) {
        setError(
          "El sector debe ser ARMADOR, VALIDADOR, EXPORTADOR o TODO."
        );
        return false;
      }

      return true;
    }

    if (tabActiva === "bom") {
      if (!lineaBomSeleccionada) {
        setError("Primero seleccioná una línea.");
        return false;
      }

      if (modalAccion === "crear" && !formBom.idInsumo) {
        setError("Seleccioná un insumo.");
        return false;
      }

      if (!formBom.cantidadBase || Number(formBom.cantidadBase) <= 0) {
        setError("La cantidad base debe ser mayor a cero.");
        return false;
      }

      return true;
    }

    return false;
  }

  async function guardar() {
    if (!validarFormulario()) return;

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (tabActiva === "insumos") {
        const payload = {
          sku: formInsumo.sku.trim(),
          nombre: formInsumo.nombre.trim(),
          descripcion: formInsumo.descripcion.trim(),
          unidad: formInsumo.unidad.trim(),
          variable: Boolean(formInsumo.variable),
          lote: Number(formInsumo.lote),
          unidadTrilay: formInsumo.unidadTrilay.trim() || null,
          factorConversionTrilay: Number(formInsumo.factorConversionTrilay),
          almacen: formInsumo.almacen.trim() || null,
          pasillo: formInsumo.pasillo.trim() || null,
          rack: formInsumo.rack.trim() || null,
          nivelRack: formInsumo.nivelRack.trim() || null,
          activo: Boolean(formInsumo.activo),
        };

        if (modalAccion === "crear") {
          await crearInsumoRequest(payload);
          setMensaje("Insumo creado correctamente.");
        }

        if (modalAccion === "editar") {
          await actualizarInsumoRequest(formInsumo.id, payload);
          setMensaje("Insumo actualizado correctamente.");
        }
      }

      if (tabActiva === "lineas") {
        const payload = {
          nombre: formLinea.nombre.trim(),
          activo: Boolean(formLinea.activo),
        };

        if (modalAccion === "crear") {
          await crearLineaRequest(payload);
          setMensaje("Línea creada correctamente.");
        }

        if (modalAccion === "editar") {
          await actualizarLineaRequest(formLinea.id, payload);
          setMensaje("Línea actualizada correctamente.");
        }
      }

      if (tabActiva === "usuarios") {
        const payload = {
          username: formUsuario.username.trim(),
          rol: formUsuario.rol,
          sector: formUsuario.sector,
          activo: Boolean(formUsuario.activo),
        };

        if (modalAccion === "editar") {
          payload.celular = formUsuario.celular.trim() || null;
        }

        if (modalAccion === "crear") {
          payload.password = formUsuario.password.trim();

          await crearUsuarioRequest(payload);

          setMensaje("Usuario creado correctamente.");
        }

        if (modalAccion === "editar") {
          if (formUsuario.password.trim()) {
            payload.password = formUsuario.password.trim();
          }

          await actualizarUsuarioRequest(formUsuario.id, payload);

          setMensaje("Usuario actualizado correctamente.");
        }
      }
      if (tabActiva === "bom") {
        const payload = {
          idLinea: lineaBomSeleccionada.id,
          idInsumo: Number(formBom.idInsumo),
          cantidadBase: Number(formBom.cantidadBase),
        };

        if (modalAccion === "crear") {
          await agregarInsumoABomRequest(payload);
          setMensaje("Insumo agregado al BOM correctamente.");
        }

        if (modalAccion === "editar") {
          await actualizarBomRequest(formBom.id, {
            cantidadBase: Number(formBom.cantidadBase),
          });
          setMensaje("BOM actualizado correctamente.");
        }

        await refrescarBom();
      }

      setModalAccion(null);
      setFormInsumo(FORM_INSUMO_INICIAL);
      setFormLinea(FORM_LINEA_INICIAL);
      setFormUsuario(FORM_USUARIO_INICIAL);
      setFormBom(FORM_BOM_INICIAL);

      await refrescarBusquedaActual();
    } catch (error) {
      setError(error.message || "No se pudo guardar.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrar() {
    if (!itemABorrar) return;

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (tabActiva === "insumos") {
        await borrarInsumoRequest(itemABorrar.id);
        setMensaje("Insumo borrado correctamente.");
      }

      if (tabActiva === "lineas") {
        await borrarLineaRequest(itemABorrar.id);
        setMensaje("Línea borrada correctamente.");
      }

      if (tabActiva === "usuarios") {
        await borrarUsuarioRequest(itemABorrar.id);
        setMensaje("Usuario borrado correctamente.");
      }

      if (tabActiva === "bom") {
        await borrarBomRequest(itemABorrar.id);
        await refrescarBom();
        setMensaje("Insumo quitado del BOM correctamente.");
      }

      setItems((actuales) =>
        actuales.filter((item) => item.id !== itemABorrar.id)
      );

      setModalAccion(null);
      setItemABorrar(null);
    } catch (error) {
      setError(error.message || "No se pudo borrar.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrarTodos() {
    if (!["insumos", "lineas", "bom"].includes(tabActiva)) return;

    try {
      setGuardando(true);
      setError("");
      setMensaje("");

      if (tabActiva === "insumos") {
        await borrarTodosInsumosRequest();
        setItems([]);
        setBusqueda("");
        setBusquedaEjecutada(false);
        setModalAccion(null);
        setMensaje("Todos los insumos fueron borrados correctamente.");
        return;
      }

      if (tabActiva === "lineas") {
        await borrarTodosLineasRequest();
        setItems([]);
        setBusqueda("");
        setBusquedaEjecutada(false);
        setLineaBomSeleccionada(null);
        setBomItems([]);
        setModalAccion(null);
        setMensaje("Todas las líneas fueron borradas correctamente.");
        return;
      }

      if (tabActiva === "bom") {
        await borrarTodosBomRequest();
        setBomItems([]);
        setLineaBomSeleccionada(null);
        setModalAccion(null);
        setMensaje("Todos los registros del BOM fueron borrados correctamente.");
      }
    } catch (error) {
      setError(
        error.message ||
        (tabActiva === "insumos"
          ? "No se pudieron borrar todos los insumos."
          : tabActiva === "lineas"
            ? "No se pudieron borrar todas las líneas."
            : "No se pudo borrar todo el BOM.")
      );
    } finally {
      setGuardando(false);
    }
  }

  const mostrandoFormulario =
    modalAccion === "crear" || modalAccion === "editar";

  const tituloFormulario =
    tabActiva === "insumos"
      ? modalAccion === "crear"
        ? "Crear insumo"
        : "Editar insumo"
      : tabActiva === "lineas"
        ? modalAccion === "crear"
          ? "Crear línea"
          : "Editar línea"
        : tabActiva === "usuarios"
          ? modalAccion === "crear"
            ? "Crear usuario"
            : "Editar usuario"
          : modalAccion === "crear"
            ? "Agregar insumo a línea"
            : "Editar insumo de línea";

  return (
    <section className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-header__eyebrow">Configuración</p>
          <h1 className="admin-header__title">Admin</h1>
        </div>

        <span className="admin-header__badge">Solo ADMIN</span>
      </header>

      {mensaje && <div className="admin-message">{mensaje}</div>}
      {error && <div className="admin-error">{error}</div>}

      <AdminTabs tabs={TABS} tabActiva={tabActiva} onChange={cambiarTab} />

      <section className="admin-panel">
        <div className="admin-panel__top">
          <div>
            <p className="admin-panel__label">Sección</p>
            <h2>{TAB_COPY[tabActiva].title}</h2>
          </div>

          <button
            type="button"
            className="admin-panel__create"
            onClick={abrirCrear}
          >
            + {TAB_COPY[tabActiva].create}
          </button>
        </div>

        <AdminSearch
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          placeholder={TAB_COPY[tabActiva].search}
          loading={loading}
          onSubmit={buscar}
          onLimpiar={limpiarBusqueda}
        />

        <div className="admin-bulk-actions">
          {["insumos", "lineas", "bom"].includes(tabActiva) && (
            <button
              type="button"
              className="admin-bulk-actions__update"
              onClick={descargarListadoActual}
              disabled={descargando}
            >
              {descargando ? "Descargando..." : "Descargar Excel"}
            </button>
          )}

          <button
            type="button"
            className="admin-bulk-actions__update"
            onClick={abrirActualizacion}
          >
            {TAB_COPY[tabActiva].update}
          </button>

          {["insumos", "lineas", "bom"].includes(tabActiva) && (
            <button
              type="button"
              className="admin-bulk-actions__danger"
              onClick={() => {
                setMensaje("");
                setError("");
                setModalAccion("borrar-todos");
              }}
            >
              Borrar todos
            </button>
          )}
        </div>

        <div className="admin-list">
          {!busquedaEjecutada && (
            <div className="admin-empty">{TAB_COPY[tabActiva].empty}</div>
          )}

          {busquedaEjecutada && loading && (
            <div className="admin-empty">Buscando...</div>
          )}

          {busquedaEjecutada && !loading && items.length === 0 && (
            <div className="admin-empty">{TAB_COPY[tabActiva].notFound}</div>
          )}

          {items.map((item) => (
            <AdminCard
              key={item.id}
              item={item}
              tabActiva={tabActiva}
              onEditar={abrirEditar}
              onBorrar={abrirBorrar}
              onAdministrarBom={administrarBom}
            />
          ))}
        </div>

        {tabActiva === "bom" && (
          <BomPanel
            lineaBomSeleccionada={lineaBomSeleccionada}
            bomItems={bomItems}
            loadingBom={loadingBom}
            onAgregar={abrirCrear}
            onEditar={abrirEditar}
            onBorrar={abrirBorrar}
          />
        )}
      </section>

      {mostrandoFormulario && (
        <AdminModal
          eyebrow={TAB_COPY[tabActiva].title}
          title={tituloFormulario}
          onClose={() => setModalAccion(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-modal__secondary"
                onClick={() => setModalAccion(null)}
              >
                Volver
              </button>

              <button
                type="button"
                className="admin-modal__primary"
                onClick={guardar}
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar"}
              </button>
            </>
          }
        >
          <div className="admin-form">
            {tabActiva === "insumos" && (
              <InsumoForm
                formInsumo={formInsumo}
                cambiarCampoInsumo={cambiarCampoInsumo}
              />
            )}

            {tabActiva === "lineas" && (
              <LineaForm
                formLinea={formLinea}
                cambiarCampoLinea={cambiarCampoLinea}
              />
            )}

            {tabActiva === "usuarios" && (
              <UsuarioForm
                formUsuario={formUsuario}
                cambiarCampoUsuario={cambiarCampoUsuario}
                modalAccion={modalAccion}
              />
            )}

            {tabActiva === "bom" && (
              <BomForm
                formBom={formBom}
                cambiarCampoBom={cambiarCampoBom}
                modalAccion={modalAccion}
              />
            )}
          </div>
        </AdminModal>
      )}

      {modalAccion === "borrar" && itemABorrar && (
        <AdminModal
          eyebrow="Confirmación"
          title="Borrar"
          danger
          onClose={() => setModalAccion(null)}
          actions={
            <>
              <button
                type="button"
                className="admin-modal__secondary"
                onClick={() => setModalAccion(null)}
              >
                Volver
              </button>

              <button
                type="button"
                className="admin-modal__danger"
                onClick={confirmarBorrar}
                disabled={guardando}
              >
                {guardando ? "Borrando..." : "Borrar"}
              </button>
            </>
          }
        >
          <p className="admin-modal__text is-danger">
            ¿Seguro que querés borrar o quitar "
            {tabActiva === "usuarios"
              ? itemABorrar.username
              : itemABorrar.nombre || `Insumo ${itemABorrar.idInsumo}`}
            "?
          </p>
        </AdminModal>
      )}

      {modalAccion === "actualizar" &&
        ["insumos", "lineas", "bom"].includes(tabActiva) && (
          <AdminModal
            eyebrow="Carga masiva"
            title={
              tabActiva === "insumos"
                ? "Importar insumos"
                : tabActiva === "lineas"
                  ? "Importar líneas"
                  : "Importar BOM"
            }
            onClose={() => {
              if (importando) return;
              setModalAccion(null);
              setArchivoImportacion(null);
            }}
            actions={
              <>
                <button
                  type="button"
                  className="admin-modal__secondary"
                  onClick={() => {
                    setModalAccion(null);
                    setArchivoImportacion(null);
                  }}
                  disabled={importando}
                >
                  Volver
                </button>

                <button
                  type="button"
                  className="admin-modal__primary"
                  onClick={importarArchivoActual}
                  disabled={!archivoImportacion || importando}
                >
                  {importando
                    ? "Importando..."
                    : tabActiva === "insumos"
                      ? "Importar insumos"
                      : tabActiva === "lineas"
                        ? "Importar líneas"
                        : "Importar BOM"}
                </button>
              </>
            }
          >
            <div className="admin-upload-box">
              {tabActiva === "insumos" && (
                <>
                  <strong>Seleccioná el archivo Excel de insumos.</strong>

                  <p>
                    Si un SKU ya existe, se actualiza. Si no existe, se crea.
                    Los insumos que no estén en el archivo no se modifican.
                  </p>
                </>
              )}

              {tabActiva === "lineas" && (
                <>
                  <strong>Seleccioná el archivo Excel de líneas.</strong>

                  <p>
                    Si una línea con el mismo nombre ya existe, se actualiza.
                    Si no existe, se crea. Las demás líneas no se modifican.
                  </p>
                </>
              )}

              {tabActiva === "bom" && (
                <>
                  <strong>Seleccioná el archivo Excel de BOM.</strong>

                  <p>
                    La carga se identificará por línea + SKU. Si la relación
                    ya existe, se actualizará la cantidad base; si no existe,
                    se creará. Las demás relaciones no se modificarán.
                  </p>

                </>
              )}

              <p>
                Si alguna fila tiene un error, la importación se cancela y
                se mostrará la fila y el motivo.
              </p>

              <input
                type="file"
                accept=".xlsx,.xls"
                disabled={importando}
                onChange={(event) => {
                  setArchivoImportacion(
                    event.target.files?.[0] || null
                  );
                  setError("");
                }}
              />

              {archivoImportacion && (
                <p>
                  Archivo seleccionado:{" "}
                  <strong>{archivoImportacion.name}</strong>
                </p>
              )}
            </div>
          </AdminModal>
        )}

      {modalAccion === "borrar-todos" &&
        ["insumos", "lineas", "bom"].includes(tabActiva) && (
          <AdminModal
            eyebrow="Confirmación"
            title={
              tabActiva === "insumos"
                ? "Borrar todos los insumos"
                : tabActiva === "lineas"
                  ? "Borrar todas las líneas"
                  : "Borrar todo el BOM"
            }
            danger
            onClose={() => {
              if (guardando) return;
              setModalAccion(null);
            }}
            actions={
              <>
                <button
                  type="button"
                  className="admin-modal__secondary"
                  onClick={() => setModalAccion(null)}
                  disabled={guardando}
                >
                  Volver
                </button>

                <button
                  type="button"
                  className="admin-modal__danger"
                  onClick={confirmarBorrarTodos}
                  disabled={guardando}
                >
                  {guardando ? "Borrando..." : "Borrar todo"}
                </button>
              </>
            }
          >
            <div className="admin-warning-box">
              <strong>
                {tabActiva === "insumos"
                  ? "Esta acción intentará borrar todos los insumos."
                  : tabActiva === "lineas"
                    ? "Esta acción intentará borrar todas las líneas."
                    : "Esta acción borrará todas las relaciones del BOM."}
              </strong>

              <p>
                {tabActiva === "insumos"
                  ? "El backend rechazará el borrado si existen referencias que deban conservarse."
                  : tabActiva === "lineas"
                    ? "El backend rechazará el borrado si existen relaciones que deban eliminarse primero."
                    : "Se eliminarán todos los vínculos entre líneas e insumos del BOM. No se borrarán los insumos ni las líneas."}
              </p>

              <p>Esta acción no se puede deshacer.</p>
            </div>

            {error && (
              <div className="admin-error">
                {error}
              </div>
            )}
          </AdminModal>
        )}
    </section>
  );
}