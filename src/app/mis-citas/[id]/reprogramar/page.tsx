import Link from "next/link";
import { FlechaAtras } from "@/components/marca";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { SelectorBloques } from "@/components/selector-bloques";
import { reprogramarCita } from "@/lib/acciones-citas";
import { esFechaValida, fechaISO, formatoFecha, formatoHora, hoyChile } from "@/lib/fechas";
import { requerirSesion } from "@/lib/sesion";

export const metadata = { title: "Cambiar hora" };

type Cita = {
  id: string;
  inicio: string;
  estado: string;
  servicio_id: string | null;
  paciente_id: string;
  profesional_id: string;
  servicio: { nombre: string } | null;
  paciente: { nombre: string } | null;
  profesional: { perfil: { nombre: string } | null; horarios: { dia_semana: number }[] } | null;
};

/** Página para cambiar la hora de una cita. La usa la paciente y también la profesional (?volver=/panel). */
export default async function Reprogramar({ params, searchParams }: PageProps<"/mis-citas/[id]/reprogramar">) {
  const { id } = await params;
  const sp = await searchParams;
  const { supabase } = await requerirSesion();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data } = await supabase
    .from("citas")
    .select("id, inicio, estado, servicio_id, paciente_id, profesional_id, servicio:servicios(nombre), paciente:perfiles!citas_paciente_id_fkey(nombre), profesional:profesionales(perfil:perfiles!profesionales_id_fkey(nombre), horarios(dia_semana))")
    .eq("id", id)
    .maybeSingle();
  const cita = data as unknown as Cita | null;
  if (!cita || cita.estado !== "confirmada" || !cita.servicio_id) notFound();

  const volverA = sp.volver === "/panel" ? "/panel" : "/mis-citas";
  const fechaDefecto = fechaISO(cita.inicio) >= hoyChile() ? fechaISO(cita.inicio) : hoyChile();
  const fecha = esFechaValida(sp.fecha as string) ? (sp.fecha as string) : fechaDefecto;
  const rutaBase = `/mis-citas/${id}/reprogramar${volverA === "/panel" ? "?volver=/panel" : ""}`;

  const conQuien = volverA === "/panel" ? cita.paciente?.nombre : cita.profesional?.perfil?.nombre;

  return (
    <div className="contenedor py-8 sm:py-10">
      <Link href={volverA} className="enlace inline-flex items-center gap-1 text-[15px]"><FlechaAtras className="size-4" />{volverA === "/panel" ? "Mi agenda" : "Mis citas"}</Link>
      <h1 className="titulo mt-3">Cambiar hora</h1>
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-600">Hora actual</p>
          <p className="mayus mt-1 font-semibold">{formatoFecha(cita.inicio)}</p>
          <p className="cifra text-[32px] leading-tight text-slate-400 line-through decoration-2">{formatoHora(cita.inicio)}</p>
          <dl className="mt-4 space-y-3 border-t border-slate-200 pt-4 text-[15px]">
            <div>
              <dt className="text-sm font-semibold text-slate-600">Prestación</dt>
              <dd>{cita.servicio?.nombre}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-600">{volverA === "/panel" ? "Paciente" : "Profesional"}</dt>
              <dd>{conQuien}</dd>
            </div>
          </dl>
        </aside>
        <div className="min-w-0 space-y-4">
          <Aviso error={sp.error} />
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
            <SelectorBloques
              supabase={supabase}
              servicioId={cita.servicio_id}
              fecha={fecha}
              diasConHorario={cita.profesional?.horarios.map((h) => h.dia_semana) ?? []}
              rutaBase={rutaBase}
              accion={reprogramarCita}
              ocultos={{ cita: id, volver: volverA, desde: `${rutaBase}${rutaBase.includes("?") ? "&" : "?"}fecha=${fecha}` }}
              textoBoton="Cambiar a esta hora"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
