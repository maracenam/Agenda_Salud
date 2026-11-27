import Link from "next/link";
import { Lupa } from "@/components/marca";
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

  const iniciales = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Pacientes</h1>
          <p className="mt-1 text-[15px] text-slate-600">
            {mapa.size === 1 ? "1 persona ha reservado contigo." : `${mapa.size} personas han reservado contigo.`} Entra a una para ver su ficha.
          </p>
        </div>
        <form role="search" className="relative w-full sm:w-80">
          <label htmlFor="q" className="sr-only">Buscar por nombre o RUT</label>
          <Lupa className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500" />
          <input id="q" className="campo pl-10" name="q" type="search" defaultValue={q} placeholder="Buscar por nombre o RUT" />
        </form>
      </div>

      {pacientes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-semibold">{q ? `Nadie coincide con “${q}”.` : "Aún no tienes pacientes."}</p>
          <p className="mt-1 text-[15px] text-slate-600">
            {q ? "Prueba con el apellido o con el RUT sin puntos." : "Aparecerán aquí cuando alguien reserve en tu página."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-slate-200 text-sm text-slate-600">
              <tr>
                <th className="py-3 pr-4 pl-5 font-semibold">Paciente</th>
                <th className="px-4 py-3 font-semibold">Teléfono</th>
                <th className="px-4 py-3 font-semibold">Última atención</th>
                <th className="px-4 py-3 font-semibold">Próxima cita</th>
                <th className="py-3 pr-5 pl-4 text-right font-semibold">Citas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-[15px]">
              {pacientes.map(({ p, ultima, proxima, total }) => (
                <tr key={p.id} className="group relative transition-colors hover:bg-marca-50/60">
                  <td className="py-3 pr-4 pl-5">
                    <div className="flex items-center gap-3">
                      <span className="insignia size-9">{iniciales(p.nombre)}</span>
                      <div className="min-w-0">
                        <Link className="font-semibold text-tinta after:absolute after:inset-0 group-hover:text-marca-700" href={`/panel/pacientes/${p.id}`}>
                          {p.nombre}
                        </Link>
                        <p className="text-sm text-slate-600">{p.rut ?? "Sin RUT"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.telefono ?? <span className="text-slate-400">Sin teléfono</span>}</td>
                  <td className="px-4 py-3 text-slate-700">{ultima ? <span className="mayus">{formatoFechaCorta(ultima)}</span> : <span className="text-slate-400">Primera vez</span>}</td>
                  <td className="px-4 py-3">
                    {proxima ? (
                      <span className="mayus rounded-md bg-acento-claro px-2 py-1 text-sm font-semibold text-acento">{formatoFechaCorta(proxima)}</span>
                    ) : (
                      <span className="text-slate-400">Sin hora</span>
                    )}
                  </td>
                  <td className="cifra py-3 pr-5 pl-4 text-right">{total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
