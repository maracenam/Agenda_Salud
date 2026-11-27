export const ZONA = "America/Santiago";
const LOCALE = "es-CL";

/** Fecha de hoy (YYYY-MM-DD) en Chile. */
export function hoyChile(): string {
  return fechaISO(new Date());
}

/** Convierte un instante a YYYY-MM-DD en hora de Chile. */
export function fechaISO(d: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(d));
}

/** Suma días a una fecha YYYY-MM-DD (sin zonas horarias). */
export function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/** 0 = domingo ... 6 = sábado, para una fecha YYYY-MM-DD. */
export function diaSemana(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d)).getUTCDay();
}

/** Lunes de la semana de la fecha. */
export function inicioSemana(fecha: string): string {
  const dow = diaSemana(fecha);
  return sumarDias(fecha, dow === 0 ? -6 : 1 - dow);
}

export function esFechaValida(f: string | undefined): f is string {
  return !!f && /^\d{4}-\d{2}-\d{2}$/.test(f) && !Number.isNaN(Date.parse(f));
}

/** Instante UTC que corresponde a las 00:00 de una fecha en Chile. */
export function inicioDiaChile(fecha: string): Date {
  const [a, m, d] = fecha.split("-").map(Number);
  // Probar con el offset de ese día (Chile usa -03 o -04).
  const aprox = new Date(Date.UTC(a, m - 1, d, 12));
  const offset = offsetMinutos(aprox);
  return new Date(Date.UTC(a, m - 1, d) - offset * 60_000);
}

function offsetMinutos(d: Date): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA,
    timeZoneName: "longOffset",
  }).formatToParts(d);
  const nombre = partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = nombre.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!m) return 0;
  const signo = m[1] === "-" ? -1 : 1;
  return signo * (Number(m[2]) * 60 + Number(m[3] ?? 0));
}

export function formatoHora(d: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(d));
}

export function formatoFecha(d: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(d));
}

export function formatoFechaCorta(d: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: ZONA,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

/** Formatea una fecha YYYY-MM-DD (sin hora) como "lunes 3 de marzo". */
export function formatoDia(fecha: string, opciones?: Intl.DateTimeFormatOptions): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    ...opciones,
  }).format(new Date(Date.UTC(a, m - 1, d)));
}

export function formatoFechaHora(d: Date | string): string {
  return `${formatoFecha(d)}, ${formatoHora(d)} hrs`;
}

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function formatoPrecio(n: number | null | undefined): string {
  if (n == null) return "";
  return new Intl.NumberFormat(LOCALE, { style: "currency", currency: "CLP" }).format(n);
}

/** Minutos desde la medianoche, en hora de Chile, de un instante. */
export function minutosChile(d: Date | string): number {
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(d));
  const h = Number(partes.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(partes.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}
