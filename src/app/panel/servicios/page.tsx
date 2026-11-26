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

function FormServicio({ s, sugerencia }: { s?: Servicio; sugerencia?: { nombre: string; duracion: number } }) {
  return (
    <form action={guardarServicio} className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
      {s && <input type="hidden" name="id" value={s.id} />}
      {s && <input type="hidden" name="activo" value={s.activo ? "on" : "off"} />}
      <div>
        <label className="etiqueta">Nombre</label>
        <input className="campo" name="nombre" required defaultValue={s?.nombre ?? sugerencia?.nombre} />
      </div>
      <div>
        <label className="etiqueta">Duración (min)</label>
        <input className="campo" name="duracion_min" type="number" min={10} max={240} step={5} required defaultValue={s?.duracion_min ?? sugerencia?.duracion ?? 30} />
      </div>
      <div>
        <label className="etiqueta">Precio (CLP)</label>
        <input className="campo" name="precio" type="number" min={0} step={500} defaultValue={s?.precio ?? ""} placeholder="Opcional" />
      </div>
      <button className="btn">{s ? "Guardar" : "Agregar"}</button>
      <div className="sm:col-span-4">
        <input className="campo" name="descripcion" defaultValue={s?.descripcion ?? ""} placeholder="Descripción breve (opcional)" />
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
    <div className="space-y-6">
      <div>
        <h1 className="titulo">Prestaciones</h1>
        <p className="text-sm text-slate-600">Lo que tus pacientes pueden reservar. La duración define el largo de cada bloque en tu agenda.</p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />
      {servicios.length > 0 && (
        <ul className="space-y-3">
          {servicios.map((s) => (
            <li key={s.id} className={`tarjeta ${s.activo ? "" : "opacity-60"}`}>
              <details>
                <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="font-medium">{s.nombre}</span>
                    <span className="text-sm text-slate-500"> · {s.duracion_min} min{s.precio != null ? ` · ${formatoPrecio(s.precio)}` : ""}{s.activo ? "" : " · Oculta"}</span>
                  </span>
                  <span className="text-sm text-marca-700">Editar</span>
                </summary>
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  <FormServicio s={s} />
                  <form action={alternarServicio}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="activo" value={String(!s.activo)} />
                    <button className="btn-sec">{s.activo ? "Ocultar a pacientes" : "Volver a mostrar"}</button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}
      <section className="tarjeta space-y-4">
        <h2 className="font-senal text-2xl font-bold">Agregar prestación</h2>
        <FormServicio />
        {sugerencias.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <p className="mb-2 text-sm text-slate-600">O agrega una de las más comunes con un clic:</p>
            <div className="flex flex-wrap gap-2">
              {sugerencias.map((s) => (
                <form key={s.nombre} action={guardarServicio}>
                  <input type="hidden" name="nombre" value={s.nombre} />
                  <input type="hidden" name="duracion_min" value={s.duracion} />
                  <button className="btn-sec text-xs">+ {s.nombre} ({s.duracion} min)</button>
                </form>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
