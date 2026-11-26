export function Aviso({ error, ok }: { error?: string | string[]; ok?: string | string[] }) {
  const e = Array.isArray(error) ? error[0] : error;
  const o = Array.isArray(ok) ? ok[0] : ok;
  if (e)
    return (
      <p role="alert" className="mb-4 flex items-start gap-3 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-900">
        <span aria-hidden="true" className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-red-700 font-senal text-sm font-bold text-white">!</span>
        {e}
      </p>
    );
  if (o)
    return (
      <p role="status" className="mb-4 flex items-start gap-3 rounded-lg border-2 border-senal bg-senal-claro px-4 py-3 text-[15px] font-medium text-tinta">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-5 shrink-0"><circle cx="10" cy="10" r="10" fill="#0e1a2b" /><path d="m5.5 10.5 3 3 6-6.5" fill="none" stroke="#f5b700" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {o}
      </p>
    );
  return null;
}

const ESTADOS: Record<string, { t: string; c: string }> = {
  confirmada: { t: "Confirmada", c: "border-(--linea) bg-(--linea-clara) text-(--linea-oscura)" },
  cancelada: { t: "Cancelada", c: "border-slate-300 bg-slate-100 text-slate-600 line-through" },
  completada: { t: "Atendida", c: "border-tinta bg-tinta text-white" },
  no_asistio: { t: "No asistió", c: "border-amber-500 bg-amber-50 text-amber-900" },
};

export function EstadoCita({ estado }: { estado: string }) {
  const e = ESTADOS[estado];
  return (
    <span className={`inline-block rounded-[4px] border px-1.5 py-px align-middle font-senal text-[13px] font-semibold tracking-wide uppercase ${e?.c ?? ""}`}>
      {e?.t ?? estado}
    </span>
  );
}
