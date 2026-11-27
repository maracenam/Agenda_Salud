import { Aviso } from "@/components/aviso";
import { formatoPrecio } from "@/lib/fechas";
import { requerirProfesional } from "@/lib/sesion";
import { alternarServicio, guardarServicio } from "../acciones";

export const metadata = { title: "Prestaciones" };

const SUGERENCIAS = [
  { nombre: "Control prenatal", duracion: 45 },
  { nombre: "Control ginecológico", duracion: 30 },
  { nombre: "Toma de PAP", duracion: 30 },
  { nombre: "Consejería en anticoncepción", duracion: 30 },
  { nombre: "Asesoría de lactancia", duracion: 60 },
  { nombre: "Control de puerperio", duracion: 45 },
];

type Servicio = { id: string; nombre: string; descripcion: string | null; duracion_min: number; precio: number | null; activo: boolean };

function FormServicio({ s }: { s?: Servicio }) {
  const k = s?.id ?? "nueva";
  return (
    <form action={guardarServicio} className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_8rem_9rem] sm:items-end">
      {s && <input type="hidden" name="id" value={s.id} />}
      {s && <input type="hidden" name="activo" value={s.activo ? "on" : "off"} />}
      <div>
        <label className="etiqueta" htmlFor={`nombre-${k}`}>Nombre</label>
        <input className="campo" id={`nombre-${k}`} name="nombre" required defaultValue={s?.nombre} placeholder="Control prenatal" />
      </div>
      <div>
        <label className="etiqueta" htmlFor={`duracion-${k}`}>Minutos</label>
        <input className="campo" id={`duracion-${k}`} name="duracion_min" type="number" min={10} max={240} step={5} required defaultValue={s?.duracion_min ?? 30} />
      </div>
      <div>
        <label className="etiqueta" htmlFor={`precio-${k}`}>Precio en pesos</label>
        <input className="campo" id={`precio-${k}`} name="precio" type="number" min={0} step={500} defaultValue={s?.precio ?? ""} placeholder="Opcional" />
      </div>
      <div className="sm:col-span-3">
        <label className="etiqueta" htmlFor={`descripcion-${k}`}>Descripción para la paciente</label>
        <input className="campo" id={`descripcion-${k}`} name="descripcion" defaultValue={s?.descripcion ?? ""} placeholder="Qué incluye y qué traer, en una línea" />
      </div>
      <div className="sm:col-span-3">
        <button className="btn">{s ? "Guardar cambios" : "Agregar prestación"}</button>
      </div>
    </form>
  );
}

export default async function Servicios({ searchParams }: PageProps<"/panel/servicios">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const { data } = await supabase.from("servicios").select("*").eq("profesional_id", id).order("creado_en");
  const servicios = (data ?? []) as Servicio[];
  const nombres = new Set(servicios.map((s) => s.nombre.toLowerCase()));
  const sugerencias = SUGERENCIAS.filter((s) => !nombres.has(s.nombre.toLowerCase()));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo">Prestaciones</h1>
        <p className="mt-1 max-w-[62ch] text-[15px] text-slate-600">Lo que se puede reservar contigo. La duración fija el largo de cada hora en tu agenda.</p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      {servicios.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {servicios.map((s) => (
            <li key={s.id}>
              <details className="group">
                <summary className="grid cursor-pointer list-none grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-1 px-5 py-4 transition-colors hover:bg-slate-50 sm:grid-cols-[minmax(0,1fr)_6rem_7rem_6rem] [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0">
                    <span className={`block font-semibold ${s.activo ? "" : "text-slate-500"}`}>{s.nombre}</span>
                    {s.descripcion && <span className="block truncate text-sm text-slate-600">{s.descripcion}</span>}
                  </span>
                  <span className="cifra text-[15px] text-slate-700 max-sm:hidden">{s.duracion_min} min</span>
                  <span className="cifra text-right text-[15px] max-sm:hidden">{s.precio != null ? formatoPrecio(s.precio) : <span className="font-normal text-slate-400">Sin precio</span>}</span>
                  <span className="text-right text-sm font-semibold">
                    {s.activo ? <span className="text-marca-700 group-open:hidden">Editar</span> : <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600 group-open:hidden">Oculta</span>}
                    <span className="hidden text-slate-600 group-open:inline">Cerrar</span>
                  </span>
                  <span className="cifra text-sm text-slate-600 sm:hidden">{s.duracion_min} min{s.precio != null ? `, ${formatoPrecio(s.precio)}` : ""}</span>
                </summary>
                <div className="space-y-4 border-t border-slate-200 bg-slate-50 px-5 py-5">
                  <FormServicio s={s} />
                  <form action={alternarServicio} className="border-t border-slate-200 pt-4">
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="activo" value={String(!s.activo)} />
                    <button className="btn-sec">{s.activo ? "Ocultar a las pacientes" : "Volver a mostrar"}</button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <section className="rounded-xl border border-slate-200 bg-white">
        <h2 className="subtitulo border-b border-slate-200 px-5 py-4">Nueva prestación</h2>
        <div className="space-y-5 p-5">
          {sugerencias.length > 0 && (
            <div>
              <p className="etiqueta">Las más comunes, con su duración habitual</p>
              <div className="flex flex-wrap gap-2">
                {sugerencias.map((s) => (
                  <form key={s.nombre} action={guardarServicio}>
                    <input type="hidden" name="nombre" value={s.nombre} />
                    <input type="hidden" name="duracion_min" value={s.duracion} />
                    <button className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold transition-colors hover:border-marca-600 hover:bg-marca-50">
                      {s.nombre}
                      <span className="cifra font-medium text-slate-500">{s.duracion} min</span>
                    </button>
                  </form>
                ))}
              </div>
            </div>
          )}
          <div className={sugerencias.length > 0 ? "border-t border-slate-200 pt-5" : ""}>
            <FormServicio />
          </div>
        </div>
      </section>
    </div>
  );
}
