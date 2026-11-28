import { Aviso } from "@/components/aviso";
import { DIAS, formatoFechaCorta, hoyChile } from "@/lib/fechas";
import { requerirProfesional } from "@/lib/sesion";
import { agregarBloqueo, agregarHorario, eliminarBloqueo, eliminarHorario } from "../acciones";

export const metadata = { title: "Horarios" };

const ORDEN = [1, 2, 3, 4, 5, 6, 0];

export default async function Horarios({ searchParams }: PageProps<"/panel/horarios">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const [{ data: horarios }, { data: bloqueos }] = await Promise.all([
    supabase.from("horarios").select("*").eq("profesional_id", id).order("hora_inicio"),
    supabase.from("bloqueos").select("*").eq("profesional_id", id).gte("fin", new Date().toISOString()).order("inicio"),
  ]);

  const lista = horarios ?? [];
  const aMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  // La regla va de la primera a la última hora con atención, con un margen.
  const desde = Math.min(8 * 60, ...lista.map((h) => Math.floor(aMin(h.hora_inicio) / 60) * 60));
  const hasta = Math.max(19 * 60, ...lista.map((h) => Math.ceil(aMin(h.hora_fin) / 60) * 60));
  const pct = (m: number) => ((m - desde) / (hasta - desde)) * 100;
  const marcas = Array.from({ length: (hasta - desde) / 60 + 1 }, (_, i) => desde + i * 60);
  const horasSemana = lista.reduce((t, h) => t + (aMin(h.hora_fin) - aMin(h.hora_inicio)), 0) / 60;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo">Horarios de atención</h1>
        <p className="mt-1 max-w-[62ch] text-[15px] text-slate-600">
          Solo se puede reservar dentro de estas franjas. Un día puede tener varias, por ejemplo mañana y tarde.
        </p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-5 py-4">
            <h2 className="subtitulo">Semana tipo</h2>
            <p className="text-sm text-slate-600"><span className="cifra text-tinta">{Number.isInteger(horasSemana) ? horasSemana : horasSemana.toFixed(1)}</span> horas de atención por semana</p>
          </div>
          <div className="overflow-x-auto px-5 pt-3 pb-5">
            <div className="min-w-[560px]">
              <div className="relative ml-24 h-6 text-xs text-slate-500" aria-hidden="true">
                {marcas.map((m, i) => (
                  <span key={m} className={`cifra absolute top-0 font-medium ${i === 0 ? "" : i === marcas.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`} style={{ left: `${pct(m)}%` }}>
                    {String(m / 60).padStart(2, "0")}
                  </span>
                ))}
              </div>
              <ul>
                {ORDEN.map((d) => {
                  const delDia = lista.filter((h) => h.dia_semana === d);
                  return (
                    <li key={d} className="flex items-center border-t border-slate-200 first:border-t-0">
                      <span className={`w-24 shrink-0 py-3 text-[15px] font-semibold ${delDia.length ? "" : "text-slate-500"}`}>{DIAS[d]}</span>
                      <div
                        className="relative h-12 flex-1"
                        style={{ backgroundImage: `repeating-linear-gradient(to right, var(--color-slate-200) 0 1px, transparent 1px ${100 / (marcas.length - 1)}%)` }}
                      >
                        {delDia.length === 0 && <span className="absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">No atiende</span>}
                        {delDia.map((h) => (
                          <form
                            key={h.id}
                            action={eliminarHorario}
                            className="group absolute inset-y-2 flex items-center justify-between gap-1 overflow-hidden rounded-md border border-acento-suave bg-acento-claro pr-1 pl-2.5 text-acento"
                            style={{ left: `${pct(aMin(h.hora_inicio))}%`, width: `${pct(aMin(h.hora_fin)) - pct(aMin(h.hora_inicio))}%` }}
                          >
                            <input type="hidden" name="id" value={h.id} />
                            <span className="cifra truncate text-sm">{h.hora_inicio.slice(0, 5)} a {h.hora_fin.slice(0, 5)}</span>
                            <button
                              aria-label={`Quitar ${DIAS[d]} de ${h.hora_inicio.slice(0, 5)} a ${h.hora_fin.slice(0, 5)}`}
                              className="shrink-0 cursor-pointer rounded p-1 opacity-60 transition hover:bg-white hover:text-red-800 hover:opacity-100 focus-visible:opacity-100"
                            >
                              <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                            </button>
                          </form>
                        ))}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-slate-200 bg-white">
          <h2 className="subtitulo border-b border-slate-200 px-5 py-4">Agregar franja</h2>
          <form action={agregarHorario} className="space-y-5 p-5">
            <fieldset>
              <legend className="etiqueta">Días</legend>
              <div className="grid grid-cols-7 gap-1">
                {ORDEN.map((d) => (
                  <label
                    key={d}
                    className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-sm font-semibold transition-colors has-checked:border-marca-700 has-checked:bg-marca-700 has-checked:text-white has-focus-visible:ring-3 has-focus-visible:ring-marca-100"
                  >
                    <input type="checkbox" name="dia" value={d} className="sr-only" defaultChecked={d >= 1 && d <= 5} />
                    <span aria-hidden="true">{DIAS[d].slice(0, 2)}</span>
                    <span className="sr-only">{DIAS[d]}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta" htmlFor="hora_inicio">Desde</label>
                <input className="campo" id="hora_inicio" name="hora_inicio" type="time" required defaultValue="09:00" step={300} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="hora_fin">Hasta</label>
                <input className="campo" id="hora_fin" name="hora_fin" type="time" required defaultValue="13:00" step={300} />
              </div>
            </div>
            <button className="btn w-full">Agregar franja</button>
          </form>
        </section>
      </div>

      <section>
        <h2 className="subtitulo">Vacaciones y días bloqueados</h2>
        <p className="mt-1 text-[15px] text-slate-600">En esos días nadie podrá reservar. Las citas que ya existan no se tocan.</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {(bloqueos ?? []).length > 0 && (
            <ul className="divide-y divide-slate-200 border-b border-slate-200">
              {bloqueos!.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="font-semibold">
                      <span className="mayus">{formatoFechaCorta(b.inicio)}</span> al {formatoFechaCorta(new Date(new Date(b.fin).getTime() - 1))}
                    </p>
                    {b.motivo && <p className="text-sm text-slate-600">{b.motivo}</p>}
                  </div>
                  <form action={eliminarBloqueo}>
                    <input type="hidden" name="id" value={b.id} />
                    <button className="btn-peligro">Quitar</button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          <form action={agregarBloqueo} className="grid gap-3 bg-slate-50 p-5 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
            <div>
              <label className="etiqueta" htmlFor="desde">Desde</label>
              <input className="campo" id="desde" name="desde" type="date" required min={hoyChile()} />
            </div>
            <div>
              <label className="etiqueta" htmlFor="hasta">Hasta</label>
              <input className="campo" id="hasta" name="hasta" type="date" min={hoyChile()} />
            </div>
            <div>
              <label className="etiqueta" htmlFor="motivo">Motivo, solo lo ves tú</label>
              <input className="campo" id="motivo" name="motivo" placeholder="Vacaciones, congreso" />
            </div>
            <button className="btn">Bloquear días</button>
          </form>
        </div>
      </section>
    </div>
  );
}
