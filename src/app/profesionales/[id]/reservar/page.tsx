import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/aviso";
import { SelectorBloques } from "@/components/selector-bloques";
import { cargarProfesional } from "@/lib/consultas";
import { esFechaValida, formatoPrecio, hoyChile } from "@/lib/fechas";
import { iniciales } from "@/lib/iniciales";
import { obtenerSesion } from "@/lib/sesion";
import { crearClienteServidor } from "@/lib/supabase/server";
import { reservar } from "./acciones";
import { FlechaAtras } from "@/components/marca";
import { moduloDe } from "@/lib/especialidades";
import { CampoPrevision } from "@/components/campo-prevision";

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
    <div className="contenedor py-8 sm:py-10">
      <Link href={`/profesionales/${id}`} className="enlace inline-flex items-center gap-1 text-[15px]"><FlechaAtras className="size-4" />{pro.nombre}</Link>
      <h1 className="titulo mt-3">Reserva tu hora</h1>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white lg:sticky lg:top-24">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5">
            <span className="insignia size-11 text-base">{iniciales(pro.nombre)}</span>
            <div className="min-w-0">
              <p className="truncate font-bold">{pro.nombre}</p>
              <p className="truncate text-sm text-slate-600">{pro.titulo || pro.especialidad?.profesion}</p>
            </div>
          </div>
          <dl className="space-y-3 p-5 text-[15px]">
            <div>
              <dt className="text-sm font-semibold text-slate-600">Prestación</dt>
              <dd className="font-semibold">{servicio.nombre}</dd>
            </div>
            <div className="flex gap-8">
              <div>
                <dt className="text-sm font-semibold text-slate-600">Duración</dt>
                <dd className="cifra">{servicio.duracion_min} min</dd>
              </div>
              {servicio.precio != null && (
                <div>
                  <dt className="text-sm font-semibold text-slate-600">Valor</dt>
                  <dd className="cifra">{formatoPrecio(servicio.precio)}</dd>
                </div>
              )}
            </div>
            {(pro.direccion || pro.comuna) && (
              <div>
                <dt className="text-sm font-semibold text-slate-600">Dónde</dt>
                <dd>{[pro.direccion, pro.comuna].filter(Boolean).join(", ")}</dd>
              </div>
            )}
          </dl>
        </aside>

        <div className="min-w-0 space-y-4">
          <Aviso error={sp.error} />
          {!sesion ? (
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-marca-200 bg-marca-50 px-5 py-4">
              <p className="max-w-[48ch] text-[15px] text-marca-800">Para confirmar necesitas una cuenta. Con ella cambias o cancelas tu hora y te llega el recordatorio.</p>
              <div className="flex gap-2">
                <Link className="btn" href={`/registro?siguiente=${encodeURIComponent(rutaBase)}`}>Crear cuenta</Link>
                <Link className="btn-sec" href={`/ingresar?siguiente=${encodeURIComponent(rutaBase)}`}>Ingresar</Link>
              </div>
            </div>
          ) : sesion.id === pro.id ? (
            <p className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-[15px] text-slate-600">Es tu propia página de reservas, tal como la ven tus pacientes.</p>
          ) : null}
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
            <SelectorBloques
              supabase={await crearClienteServidor()}
              servicioId={servicio.id}
              fecha={fecha}
              diasConHorario={pro.horarios.map((h) => h.dia_semana)}
              rutaBase={rutaBase}
              accion={reservar}
              ocultos={{ servicio: servicio.id, profesional: pro.id, fecha }}
              conMotivo
              ejemploMotivo={moduloDe(pro.especialidad?.slug).ejemplos.motivo}
              extra={sesion && sesion.id !== pro.id ? <CampoPrevision valor={sesion.perfil.prevision} /> : null}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
