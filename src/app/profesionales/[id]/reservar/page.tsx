import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { SelectorBloques } from "@/components/selector-bloques";
import { cargarProfesional } from "@/lib/consultas";
import { esFechaValida, formatoPrecio, hoyChile } from "@/lib/fechas";
import { obtenerSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { reservar } from "./acciones";
import { Calendario, FlechaAtras } from "@/components/marca";

export const metadata = { title: "Reservar hora" };

export default async function Reservar({ params, searchParams }: PageProps<"/profesionales/[id]/reservar">) {
  const { id } = await params;
  const sp = await searchParams;
  const pro = await cargarProfesional(id);
  const servicio = pro?.servicios.find((s) => s.id === sp.servicio && s.activo);
  if (!pro || !servicio) notFound();
  const fecha = esFechaValida(sp.fecha as string) ? (sp.fecha as string) : hoyChile();
  const sesion = await obtenerSesion();
  const rutaBase = `/profesionales/${id}/reservar?servicio=${servicio.id}`;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/profesionales/${id}`} className="enlace inline-flex items-center gap-1"><FlechaAtras className="size-4" />Volver</Link>
      <h1 className="titulo mt-3">{servicio.nombre}</h1>
      <p className="mt-2 mb-6 text-lg text-slate-700">
        Con {pro.perfil?.nombre} · {servicio.duracion_min} min{servicio.precio != null ? ` · ${formatoPrecio(servicio.precio)}` : ""}
      </p>
      <Aviso error={sp.error} />
      {!sesion ? (
        <div className="tarjeta space-y-3">
          <p className="text-slate-700">Para reservar necesitas una cuenta. Así podrás cambiar o cancelar tu hora y recibir recordatorios.</p>
          <div className="flex gap-2">
            <Link className="btn" href={`/registro?siguiente=${encodeURIComponent(rutaBase)}`}>Crear cuenta</Link>
            <Link className="btn-sec" href={`/ingresar?siguiente=${encodeURIComponent(rutaBase)}`}>Ya tengo cuenta</Link>
          </div>
        </div>
      ) : sesion.id === pro.id ? (
        <p className="tarjeta text-sm text-slate-600">Esta es tu propia página de reservas. Así la ven tus pacientes.</p>
      ) : null}
      <div className="tarjeta mt-4 overflow-hidden p-0">
        <p className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5 font-semibold sm:px-7"><Calendario className="size-5 text-marca-700" />Horas disponibles</p>
        <div className="p-5 sm:p-7">
        <SelectorBloques
          supabase={await crearClienteServidor()}
          servicioId={servicio.id}
          fecha={fecha}
          diasConHorario={pro.horarios.map((h) => h.dia_semana)}
          rutaBase={rutaBase}
          accion={reservar}
          ocultos={{ servicio: servicio.id, profesional: pro.id, fecha }}
          conMotivo
        />
        </div>
      </div>
    </div>
  );
}
