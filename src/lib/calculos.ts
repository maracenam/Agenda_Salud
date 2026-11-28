/** Cálculos clínicos puros, sin zona horaria: las fechas son YYYY-MM-DD. */

const DIA = 86_400_000;

function aUTC(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUTC(hasta) - aUTC(desde)) / DIA);
}

/** Edad gestacional y fecha probable de parto según FUR (regla de Naegele, 280 días). */
export function edadGestacional(fur: string | null | undefined, hoy: string) {
  if (!fur || !/^\d{4}-\d{2}-\d{2}$/.test(fur)) return null;
  const dias = diasEntre(fur, hoy);
  if (dias < 0 || dias > 300) return null;
  const fpp = new Date(aUTC(fur) + 280 * DIA).toISOString().slice(0, 10);
  return { semanas: Math.floor(dias / 7), dias: dias % 7, fpp };
}

/** Índice de masa corporal con peso en kg y talla en cm. */
export function imc(pesoKg: number | null | undefined, tallaCm: number | null | undefined) {
  if (!pesoKg || !tallaCm || pesoKg <= 0 || tallaCm <= 0) return null;
  const valor = pesoKg / (tallaCm / 100) ** 2;
  const redondeado = Math.round(valor * 10) / 10;
  const categoria =
    valor < 18.5 ? "Bajo peso" : valor < 25 ? "Normal" : valor < 30 ? "Sobrepeso" : "Obesidad";
  return { valor: redondeado, categoria, alerta: valor < 18.5 || valor >= 30 };
}

/** Meses completos entre una fecha y hoy (30,44 días por mes). */
export function mesesDesde(fecha: string | null | undefined, hoy: string): number | null {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
  const d = diasEntre(fecha, hoy);
  if (d < 0) return null;
  return Math.floor(d / 30.44);
}

/** Edad en años cumplidos. */
export function edadAnios(nacimiento: string | null | undefined, hoy: string): number | null {
  if (!nacimiento || !/^\d{4}-\d{2}-\d{2}$/.test(nacimiento)) return null;
  const [a, m, d] = nacimiento.split("-").map(Number);
  const [ha, hm, hd] = hoy.split("-").map(Number);
  const e = ha - a - (hm < m || (hm === m && hd < d) ? 1 : 0);
  return e >= 0 ? e : null;
}

/** Presión arterial "120/80": ¿está elevada (≥140/90)? */
export function presionElevada(pa: string | null | undefined): boolean | null {
  const m = typeof pa === "string" ? pa.match(/^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/) : null;
  if (!m) return null;
  return Number(m[1]) >= 140 || Number(m[2]) >= 90;
}
