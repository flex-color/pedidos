// Fechas operativas: la API devuelve instantes UTC (ISO-8601).
// Se muestran siempre en horario de Argentina, sin depender del navegador.
const ZONA_ARGENTINA = "America/Argentina/Buenos_Aires";

function analizarFecha(fecha) {
  if (fecha === null || fecha === undefined || fecha === "") return null;
  const valor = String(fecha).trim();
  if (!valor) return null;

  // Los valores YYYY-MM-DD son fechas de calendario, no instantes horarios.
  const soloDia = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (soloDia) return { soloDia: `${soloDia[3]}/${soloDia[2]}/${soloDia[1]}` };

  // Los timestamps sin zona de la API representan UTC.
  // Cuando la cadena ya tiene Z o un offset, se respeta para evitar doble conversión.
  const iso = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(valor)
    ? valor
    : `${valor.replace(" ", "T")}Z`;
  const instante = new Date(iso);
  if (Number.isNaN(instante.getTime())) return { original: valor };
  return { instante };
}

function formatear(fecha, conHora, vacio) {
  const dato = analizarFecha(fecha);
  if (!dato) return vacio;
  if (dato.soloDia) return dato.soloDia;
  if (dato.original) return dato.original;
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_ARGENTINA,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" } : {}),
  }).format(dato.instante).replace(",", "");
}

export function formatearFechaArgentina(fecha, vacio = "") {
  return formatear(fecha, false, vacio);
}

export function formatearFechaHoraArgentina(fecha, vacio = "") {
  return formatear(fecha, true, vacio);
}
