import Link from "next/link";
import { formatoFechaCorta } from "@/lib/fechas";
import { requerirProfesional } from "@/lib/sesion";

export const metadata = { title: "Pacientes" };

type Fila = { inicio: string; estado: string; paciente: { id: string; nombre: string; rut: string | null; telefono: string | null } | null };

export default async function Pacientes({ searchParams }: PageProps<"/panel/pacientes">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const { id, supabase } = await requerirProfesional();
  const { data } = await supabase
    .from("citas")
    .select("inicio, estado, paciente:perfiles!citas_paciente_id_fkey(id, nombre, rut, telefono)")
    .eq("profesional_id", id)
    .order("inicio", { ascending: false })
    .limit(2000);
  const filas = (data ?? []) as unknown as Fila[];
  const ahora = Date.now();
  const mapa = new Map<string, { p: NonNullable<Fila["paciente"]>; ultima?: string; proxima?: string; total: number }>();
  for (const f of filas) {
    if (!f.paciente) continue;
    const e = mapa.get(f.paciente.id) ?? { p: f.paciente, total: 0 };
    if (f.estado !== "cancelada") {
      e.total++;
      const t = new Date(f.inicio).getTime();
      if (t < ahora && !e.ultima) e.ultima = f.inicio;
      if (t >= ahora) e.proxima = f.inicio;
    }
    mapa.set(f.paciente.id, e);
  }
  let pacientes = [...mapa.values()].sort((a, b) => a.p.nombre.localeCompare(b.p.nombre, "es"));
  if (q) pacientes = pacientes.filter((x) => x.p.nombre.toLowerCase().includes(q) || (x.p.rut ?? "").toLowerCase().includes(q));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="titulo">Pacientes</h1>
        <p className="text-sm text-slate-600">Quienes han reservado contigo. Entra para ver y completar su ficha clínica.</p>
      </div>
      <form className="flex gap-2">
        <input className="campo max-w-xs" name="q" defaultValue={q} placeholder="Buscar por nombre o RUT" />
        <button className="btn-sec">Buscar</button>
      </form>
      {pacientes.length === 0 ? (
        <p className="tarjeta text-sm text-slate-600">{q ? "Sin resultados." : "Aún no tienes pacientes. Aparecerán aquí cuando reserven contigo."}</p>
      ) : (
        <div className="tarjeta overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-tinta font-senal text-[15px] tracking-wide text-white uppercase">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Nombre</th>
                <th className="px-4 py-2.5 font-semibold">RUT</th>
                <th className="px-4 py-2.5 font-semibold">Teléfono</th>
                <th className="px-4 py-2.5 font-semibold">Última atención</th>
                <th className="px-4 py-2.5 font-semibold">Próxima cita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tinta/10 text-[15px]">
              {pacientes.map(({ p, ultima, proxima }) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><Link className="font-medium text-marca-700 hover:underline" href={`/panel/pacientes/${p.id}`}>{p.nombre}</Link></td>
                  <td className="px-4 py-3 text-slate-600">{p.rut ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{p.telefono ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{ultima ? formatoFechaCorta(ultima) : "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{proxima ? formatoFechaCorta(proxima) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
