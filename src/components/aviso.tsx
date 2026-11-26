export function Aviso({ error, ok }: { error?: string | string[]; ok?: string | string[] }) {
  const e = Array.isArray(error) ? error[0] : error;
  const o = Array.isArray(ok) ? ok[0] : ok;
  if (e)
    return (
      <p role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[15px] font-medium text-red-900">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-5 shrink-0"><circle cx="10" cy="10" r="10" fill="#b42318" /><path d="M10 5.5v5.5M10 14.2v.3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
        {e}
      </p>
    );
  if (o)
    return (
      <p role="status" className="mb-4 flex items-start gap-3 rounded-lg border border-acento-suave bg-acento-claro px-4 py-3 text-[15px] font-medium text-tinta">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="mt-0.5 size-5 shrink-0"><circle cx="10" cy="10" r="10" fill="#3f6b55" /><path d="m5.8 10.4 2.8 2.8 5.6-6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {o}
      </p>
    );
  return null;
}

const ESTADOS: Record<string, { t: string; c: string; p: string }> = {
  confirmada: { t: "Confirmada", c: "bg-acento-claro text-acento", p: "bg-acento" },
  cancelada: { t: "Cancelada", c: "bg-slate-100 text-slate-600", p: "bg-slate-400" },
  completada: { t: "Atendida", c: "bg-marca-50 text-marca-700", p: "bg-marca-700" },
  no_asistio: { t: "No asistió", c: "bg-amber-50 text-amber-800", p: "bg-amber-500" },
};

export function EstadoCita({ estado }: { estado: string }) {
  const e = ESTADOS[estado];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 align-middle text-[13px] font-semibold ${e?.c ?? ""}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${e?.p ?? ""}`} />
      {e?.t ?? estado}
    </span>
  );
}
