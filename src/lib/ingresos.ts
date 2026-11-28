/**
 * CU-12 y CU-13: registro de pagos y "Mis ingresos".
 * Todo aquí es puro (sin red ni base de datos) para poder probarlo.
 */

export type Prevision = "fonasa" | "isapre" | "particular";
export type MedioPago = "efectivo" | "transferencia" | "tarjeta" | "bono_fonasa" | "bono_isapre";

export const PREVISIONES: { valor: Prevision; t: string }[] = [
  { valor: "fonasa", t: "Fonasa" },
  { valor: "isapre", t: "Isapre" },
  { valor: "particular", t: "Particular" },
];

export const MEDIOS: { valor: MedioPago; t: string; bono?: boolean }[] = [
  { valor: "transferencia", t: "Transferencia" },
  { valor: "efectivo", t: "Efectivo" },
  { valor: "tarjeta", t: "Tarjeta" },
  { valor: "bono_fonasa", t: "Bono Fonasa", bono: true },
  { valor: "bono_isapre", t: "Bono Isapre", bono: true },
];

export const esPrevision = (v: unknown): v is Prevision => PREVISIONES.some((p) => p.valor === v);
export const esMedio = (v: unknown): v is MedioPago => MEDIOS.some((m) => m.valor === v);
export const nombreMedio = (m: string) => MEDIOS.find((x) => x.valor === m)?.t ?? m;
export const nombrePrevision = (p: string | null | undefined, isapre?: string | null) =>
  p === "isapre" && isapre ? `Isapre ${isapre}` : (PREVISIONES.find((x) => x.valor === p)?.t ?? "Sin informar");

/**
 * Medio de pago que se propone al marcar "atendida", para que baste un toque.
 * Se propone bono solo si la paciente tiene esa previsión y la profesional recibe ese bono.
 * Si no, se repite el último medio que no fue bono (la costumbre de la consulta).
 */
export function medioSugerido(o: {
  prevision: Prevision | null | undefined;
  recibeBonoFonasa: boolean;
  recibeBonoIsapre: boolean;
  ultimoMedio?: MedioPago | null;
}): MedioPago {
  if (o.prevision === "fonasa" && o.recibeBonoFonasa) return "bono_fonasa";
  if (o.prevision === "isapre" && o.recibeBonoIsapre) return "bono_isapre";
  if (o.ultimoMedio && !MEDIOS.find((m) => m.valor === o.ultimoMedio)?.bono) return o.ultimoMedio;
  return "transferencia";
}

/** Lee un monto escrito a mano: "25.000", "$25000", "25 000". Devuelve null si no es válido. */
export function leerMonto(v: unknown): number | null {
  const s = String(v ?? "").replace(/[$\s.]/g, "").replace(/,00?$/, "");
  if (!/^\d{1,8}$/.test(s)) return null;
  const n = Number(s);
  return n <= 10_000_000 ? n : null;
}

/**
 * Tasa de retención de la boleta de honorarios (Ley 21.133), en %.
 * Sube 0,75 puntos por año hasta llegar a 17% en 2028.
 */
export function tasaRetencion(anio: number): number {
  const tabla: Record<number, number> = { 2021: 11.5, 2022: 12.25, 2023: 13, 2024: 13.75, 2025: 14.5, 2026: 15.25, 2027: 16 };
  if (anio >= 2028) return 17;
  return tabla[anio] ?? 10.75;
}

/** Si se emite boleta por "bruto": cuánto va al SII como retención y cuánto queda. */
export function estimarRetencion(bruto: number, anio: number) {
  const tasa = tasaRetencion(anio);
  const retencion = Math.round((bruto * tasa) / 100);
  return { tasa, retencion, liquido: bruto - retencion };
}

/** "2026-11" válido, o null. */
export function mesValido(v: unknown): string | null {
  const s = String(v ?? "");
  const m = /^(\d{4})-(\d{2})$/.exec(s);
  if (!m) return null;
  const mes = Number(m[2]);
  return mes >= 1 && mes <= 12 && Number(m[1]) >= 2020 && Number(m[1]) <= 2100 ? s : null;
}

/** Primer día del mes y primer día del mes siguiente (YYYY-MM-DD), para filtrar [desde, hasta). */
export function rangoMes(mes: string) {
  const [a, m] = mes.split("-").map(Number);
  const f = (anio: number, mm: number) => `${anio}-${String(mm).padStart(2, "0")}-01`;
  return { desde: f(a, m), hasta: m === 12 ? f(a + 1, 1) : f(a, m + 1), anio: a };
}

export function mesVecino(mes: string, paso: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + paso, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type Cobro = { id: string; medio: MedioPago; monto: number; boleta_emitida: boolean };

export function resumenIngresos(cobros: Cobro[], anio: number) {
  const total = cobros.reduce((s, c) => s + c.monto, 0);
  const porMedio = MEDIOS.map((m) => {
    const de = cobros.filter((c) => c.medio === m.valor);
    return { medio: m.valor, t: m.t, cantidad: de.length, monto: de.reduce((s, c) => s + c.monto, 0) };
  }).filter((m) => m.cantidad > 0);
  const sinBoleta = cobros.filter((c) => !c.boleta_emitida && c.monto > 0);
  const montoSinBoleta = sinBoleta.reduce((s, c) => s + c.monto, 0);
  return {
    total,
    cantidad: cobros.length,
    porMedio,
    sinBoleta: sinBoleta.length,
    montoSinBoleta,
    ...estimarRetencion(total, anio),
  };
}

// Exportar a Excel ----------------------------------------------------------------
export type FilaExport = {
  fecha: string;
  hora: string;
  paciente: string;
  rut: string | null;
  prestacion: string | null;
  prevision: string;
  medio: string;
  folio_bono: string | null;
  monto: number;
  boleta: boolean;
  boleta_numero: string | null;
};

/** Celda CSV segura: comillas escapadas y sin fórmulas (evita inyección de fórmulas en Excel). */
export function celda(v: string | number | null | undefined): string {
  if (v == null) return "";
  if (typeof v === "number") return String(v);
  let s = v.replace(/[\r\n]+/g, " ");
  if (/^[=+\-@\t]/.test(s)) s = `'${s}`;
  return /[";]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * CSV con punto y coma y BOM UTF-8: Excel en español (Chile) lo abre con columnas y tildes bien.
 */
export function csvIngresos(filas: FilaExport[]): string {
  const cabecera = ["Fecha", "Hora", "Paciente", "RUT", "Prestación", "Previsión", "Medio de pago", "Folio bono", "Monto", "Boleta emitida", "N° boleta"];
  const lineas = filas.map((f) =>
    [f.fecha, f.hora, f.paciente, f.rut, f.prestacion, f.prevision, f.medio, f.folio_bono, f.monto, f.boleta ? "Sí" : "No", f.boleta_numero].map(celda).join(";"),
  );
  return "﻿" + [cabecera.map(celda).join(";"), ...lineas].join("\r\n") + "\r\n";
}

/** Portal de boletas de honorarios electrónicas del SII. */
export const URL_SII_BOLETAS = "https://www.sii.cl/servicios_online/1040-.html";
