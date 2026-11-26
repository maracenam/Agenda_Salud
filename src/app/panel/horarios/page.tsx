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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo">Horarios de atención</h1>
        <p className="text-sm text-slate-600">Las pacientes solo pueden reservar dentro de estos bloques. Puedes tener varios bloques por día, por ejemplo mañana y tarde.</p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="tarjeta">
          <h2 className="mb-3 text-xl font-bold">Semana tipo</h2>
          <ul className="divide-y divide-slate-100">
            {ORDEN.map((d) => {
              const delDia = (horarios ?? []).filter((h) => h.dia_semana === d);
              return (
                <li key={d} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                  <span className="w-24 font-medium">{DIAS[d]}</span>
                  {delDia.length === 0 ? (
                    <span className="text-slate-400">No atiende</span>
                  ) : (
                    delDia.map((h) => (
                      <form key={h.id} action={eliminarHorario} className="inline-flex items-center gap-1 rounded-full bg-marca-50 px-3 py-1 text-marca-800">
                        <input type="hidden" name="id" value={h.id} />
                        {h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}
                        <button aria-label="Eliminar bloque" className="ml-1 cursor-pointer rounded-full p-0.5 text-marca-700 hover:bg-white hover:text-red-700"><svg viewBox="0 0 16 16" className="size-3.5" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg></button>
                      </form>
                    ))
                  )}
                </li>
              );
            })}
          </ul>
        </section>
        <section className="tarjeta">
          <h2 className="mb-3 text-xl font-bold">Agregar bloque</h2>
          <form action={agregarHorario} className="space-y-4">
            <fieldset>
              <legend className="etiqueta">Días</legend>
              <div className="flex flex-wrap gap-2">
                {ORDEN.map((d) => (
                  <label key={d} className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-sm has-checked:border-marca-600 has-checked:bg-marca-50">
                    <input type="checkbox" name="dia" value={d} className="sr-only" defaultChecked={d >= 1 && d <= 5} />
                    {DIAS[d].slice(0, 3)}
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
            <button className="btn">Agregar</button>
          </form>
        </section>
      </div>
      <section className="tarjeta">
        <h2 className="mb-1 text-xl font-bold">Vacaciones y días bloqueados</h2>
        <p className="mb-4 text-sm text-slate-600">Esos días no se podrá reservar.</p>
        {(bloqueos ?? []).length > 0 && (
          <ul className="mb-4 space-y-2 text-sm">
            {bloqueos!.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span>
                  {formatoFechaCorta(b.inicio)} al {formatoFechaCorta(new Date(new Date(b.fin).getTime() - 1))}
                  {b.motivo ? ` · ${b.motivo}` : ""}
                </span>
                <form action={eliminarBloqueo}>
                  <input type="hidden" name="id" value={b.id} />
                  <button className="btn-peligro">Quitar</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={agregarBloqueo} className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
          <div>
            <label className="etiqueta" htmlFor="desde">Desde</label>
            <input className="campo" id="desde" name="desde" type="date" required min={hoyChile()} />
          </div>
          <div>
            <label className="etiqueta" htmlFor="hasta">Hasta</label>
            <input className="campo" id="hasta" name="hasta" type="date" min={hoyChile()} />
          </div>
          <div>
            <label className="etiqueta" htmlFor="motivo">Motivo (solo lo ves tú)</label>
            <input className="campo" id="motivo" name="motivo" placeholder="Vacaciones, congreso..." />
          </div>
          <button className="btn">Bloquear</button>
        </form>
      </section>
    </div>
  );
}
