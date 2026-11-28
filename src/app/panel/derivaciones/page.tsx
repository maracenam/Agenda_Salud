import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { formatoFechaCorta } from "@/lib/fechas";
import { iniciales } from "@/lib/iniciales";
import { requerirProfesional } from "@/lib/sesion";
import { responderDerivacion } from "../acciones";

export const metadata = { title: "Derivaciones" };

type Derivacion = {
  id: string;
  motivo: string;
  resumen: string | null;
  estado: "pendiente" | "aceptada" | "rechazada";
  creado_en: string;
  de_profesional: string;
  a_profesional: string;
  paciente: { id: string; nombre: string; email: string | null; telefono: string | null } | null;
  de: { nombre: string; especialidad: { nombre: string } | null } | null;
  a: { nombre: string; especialidad: { nombre: string } | null } | null;
};

const ESTADO: Record<Derivacion["estado"], { t: string; c: string }> = {
  pendiente: { t: "Pendiente", c: "bg-alerta-claro text-alerta" },
  aceptada: { t: "Aceptada", c: "bg-acento-claro text-acento" },
  rechazada: { t: "Rechazada", c: "bg-slate-100 text-slate-600" },
};

export default async function Derivaciones({ searchParams }: PageProps<"/panel/derivaciones">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const { data } = await supabase
    .from("derivaciones")
    .select(
      "id, motivo, resumen, estado, creado_en, de_profesional, a_profesional, paciente:perfiles!derivaciones_paciente_id_fkey(id, nombre, email, telefono), de:profesionales!derivaciones_de_profesional_fkey(nombre, especialidad:especialidades(nombre)), a:profesionales!derivaciones_a_profesional_fkey(nombre, especialidad:especialidades(nombre))",
    )
    .order("creado_en", { ascending: false })
    .limit(200);
  const todas = (data ?? []) as unknown as Derivacion[];
  const recibidas = todas.filter((d) => d.a_profesional === id);
  const enviadas = todas.filter((d) => d.de_profesional === id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="titulo">Derivaciones</h1>
        <p className="mt-1 max-w-[62ch] text-[15px] text-slate-600">
          Deriva pacientes a colegas de otras especialidades desde su ficha. Quien recibe ve el motivo y, si lo compartiste, un resumen clínico.
        </p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      <section>
        <h2 className="subtitulo">Recibidas</h2>
        {recibidas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-[15px] text-slate-600">Aún no te han derivado pacientes.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {recibidas.map((d) => (
              <li key={d.id} className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="flex items-start gap-4">
                  <span className="insignia size-12 text-base">{iniciales(d.paciente?.nombre)}</span>
                  <div className="min-w-0 space-y-1.5">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-bold">{d.paciente?.nombre}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${ESTADO[d.estado].c}`}>{ESTADO[d.estado].t}</span>
                    </p>
                    <p className="text-[15px] text-slate-600">
                      De {d.de?.nombre}{d.de?.especialidad ? ` (${d.de.especialidad.nombre})` : ""}, el {formatoFechaCorta(d.creado_en)}
                    </p>
                    <p className="text-[15px]"><span className="font-semibold">Motivo:</span> {d.motivo}</p>
                    {d.resumen && <p className="rounded-lg bg-slate-50 px-3 py-2 text-[15px] whitespace-pre-line text-slate-700">{d.resumen}</p>}
                    <p className="flex flex-wrap gap-x-4 text-[15px] text-slate-600">
                      {d.paciente?.telefono && <a className="enlace" href={`tel:${d.paciente.telefono.replace(/\s/g, "")}`}>{d.paciente.telefono}</a>}
                      {d.paciente?.email && <a className="enlace" href={`mailto:${d.paciente.email}`}>{d.paciente.email}</a>}
                    </p>
                  </div>
                </div>
                {d.estado === "pendiente" && (
                  <form action={responderDerivacion} className="flex items-start gap-2">
                    <input type="hidden" name="derivacion" value={d.id} />
                    <button name="respuesta" value="aceptar" className="btn">Aceptar</button>
                    <button name="respuesta" value="rechazar" className="btn-sec">Rechazar</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="subtitulo">Enviadas</h2>
        {enviadas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-[15px] text-slate-600">
            Para derivar, abre la ficha de una paciente en <Link className="enlace" href="/panel/pacientes">Pacientes</Link>.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {enviadas.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-semibold">
                    <Link className="hover:underline" href={`/panel/pacientes/${d.paciente?.id}`}>{d.paciente?.nombre}</Link> a {d.a?.nombre}
                    {d.a?.especialidad ? <span className="font-normal text-slate-600"> ({d.a.especialidad.nombre})</span> : null}
                  </p>
                  <p className="truncate text-sm text-slate-600">{formatoFechaCorta(d.creado_en)}: {d.motivo}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${ESTADO[d.estado].c}`}>{ESTADO[d.estado].t}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
