import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { SelectorBloques } from "@/components/selector-bloques";
import { reprogramarCita } from "@/lib/acciones-citas";
import { esFechaValida, fechaISO, formatoFechaHora, hoyChile } from "@/lib/fechas";
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={volverA} className="enlace text-sm">← Volver</Link>
      <h1 className="titulo mt-2">Cambiar hora</h1>
      <p className="mb-6 text-sm text-slate-600">
        {cita.servicio?.nombre} · {volverA === "/panel" ? cita.paciente?.nombre : cita.profesional?.perfil?.nombre}
        <br />Hora actual: <span className="capitalize">{formatoFechaHora(cita.inicio)}</span>
      </p>
      <Aviso error={sp.error} />
      <div className="tarjeta">
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
  );
}
