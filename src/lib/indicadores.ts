/** RF-09: indicadores a partir de los conteos que entrega indicadores_profesional(). */
export type Conteos = {
  agendadas: number;
  confirmadas: number;
  completadas: number;
  canceladas: number;
  no_asistio: number;
  pacientes_atendidos: number;
  fichas_completas: number;
};

const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : null);

export function calcularIndicadores(c: Conteos) {
  // Las citas aún confirmadas no han ocurrido: no cuentan para las tasas.
  const cerradas = c.completadas + c.canceladas + c.no_asistio;
  return {
    ...c,
    tasaRealizadas: pct(c.completadas, cerradas),
    tasaCanceladas: pct(c.canceladas, cerradas),
    tasaInasistencia: pct(c.no_asistio, c.completadas + c.no_asistio),
    completitudFichas: pct(c.fichas_completas, c.pacientes_atendidos),
  };
}

/** Rango de fechas (YYYY-MM-DD, inclusive) de un periodo, contado desde hoy. */
export function rangoPeriodo(periodo: string | undefined, hoy: string): { desde: string; hasta: string; nombre: string; clave: string } {
  const [a, m] = hoy.split("-").map(Number);
  const ultimoDia = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const f = (anio: number, mes: number, dia: number) => `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
  if (periodo === "mes-anterior") {
    const am = m === 1 ? a - 1 : a;
    const mm = m === 1 ? 12 : m - 1;
    return { desde: f(am, mm, 1), hasta: f(am, mm, ultimoDia(am, mm)), nombre: "Mes anterior", clave: "mes-anterior" };
  }
  if (periodo === "90") {
    const d = new Date(Date.UTC(a, m - 1, Number(hoy.slice(8, 10)) - 89)).toISOString().slice(0, 10);
    return { desde: d, hasta: hoy, nombre: "Últimos 90 días", clave: "90" };
  }
  return { desde: f(a, m, 1), hasta: f(a, m, ultimoDia(a, m)), nombre: "Este mes", clave: "mes" };
}
