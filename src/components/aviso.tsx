export function Aviso({ error, ok }: { error?: string | string[]; ok?: string | string[] }) {
  const e = Array.isArray(error) ? error[0] : error;
  const o = Array.isArray(ok) ? ok[0] : ok;
  if (e)
    return <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{e}</p>;
  if (o)
    return <p role="status" className="mb-4 rounded-lg border border-marca-100 bg-marca-50 px-4 py-3 text-sm text-marca-800">{o}</p>;
  return null;
}

export function EstadoCita({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    confirmada: "bg-marca-50 text-marca-800",
    cancelada: "bg-slate-100 text-slate-500 line-through",
    completada: "bg-blue-50 text-blue-800",
    no_asistio: "bg-amber-50 text-amber-800",
  };
  const nombres: Record<string, string> = {
    confirmada: "Confirmada",
    cancelada: "Cancelada",
    completada: "Atendida",
    no_asistio: "No asistió",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${estilos[estado] ?? ""}`}>{nombres[estado] ?? estado}</span>;
}
