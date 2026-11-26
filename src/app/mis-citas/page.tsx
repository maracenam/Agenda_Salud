import Link from "next/link";
import { Aviso, EstadoCita } from "@/components/aviso";
import { cancelarCita } from "@/lib/acciones-citas";
import { formatoFechaHora } from "@/lib/fechas";
import { requerirSesion } from "@/lib/sesion";

export const metadata = { title: "Mis citas" };

type Cita = {
  id: string;
  inicio: string;
  estado: string;
  motivo: string | null;
  servicio: { nombre: string } | null;
  profesional: { id: string; direccion: string | null; comuna: string | null; horas_min_cambio: number; perfil: { nombre: string; telefono: string | null } | null } | null;
};

export default async function MisCitas({ searchParams }: PageProps<"/mis-citas">) {
  const sp = await searchParams;
  const { id, supabase, perfil } = await requerirSesion();
  const { data } = await supabase
    .from("citas")
    .select("id, inicio, estado, motivo, servicio:servicios(nombre), profesional:profesionales(id, direccion, comuna, horas_min_cambio, perfil:perfiles!profesionales_id_fkey(nombre, telefono))")
    .eq("paciente_id", id)
    .order("inicio", { ascending: false })
    .limit(100);
  const citas = (data ?? []) as unknown as Cita[];
  const ahora = Date.now();
  const proximas = citas.filter((c) => new Date(c.inicio).getTime() >= ahora && c.estado === "confirmada").reverse();
  const pasadas = citas.filter((c) => !proximas.includes(c));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="titulo">Mis citas</h1>
        <Link href="/profesionales" className="btn-senal">Reservar nueva hora</Link>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />
      {perfil.rol === "profesional" && (
        <p className="text-sm text-slate-600">Estas son las citas que reservaste como paciente. Tu agenda profesional está en <Link className="enlace" href="/panel">Mi agenda</Link>.</p>
      )}
      <section>
        <h2 className="mb-3 font-senal text-2xl font-bold">Próximas</h2>
        {proximas.length === 0 ? (
          <p className="tarjeta text-sm text-slate-600">No tienes citas próximas.</p>
        ) : (
          <ul className="space-y-3">
            {proximas.map((c) => {
              const horas = c.profesional?.horas_min_cambio ?? 2;
              const puedeCambiar = new Date(c.inicio).getTime() - ahora > horas * 3600_000;
              return (
                <li key={c.id} className="tarjeta flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-senal text-2xl leading-tight font-bold mayus">{formatoFechaHora(c.inicio)}</p>
                    <p className="mt-0.5 text-slate-700">{c.servicio?.nombre} con {c.profesional?.perfil?.nombre}</p>
                    {(c.profesional?.direccion || c.profesional?.comuna) && (
                      <p className="text-sm text-slate-500">{[c.profesional?.direccion, c.profesional?.comuna].filter(Boolean).join(", ")}</p>
                    )}
                  </div>
                  {puedeCambiar ? (
                    <div className="flex gap-2">
                      <Link href={`/mis-citas/${c.id}/reprogramar`} className="btn-sec">Cambiar hora</Link>
                      <form action={cancelarCita}>
                        <input type="hidden" name="cita" value={c.id} />
                        <input type="hidden" name="volver" value="/mis-citas" />
                        <button className="btn-peligro">Cancelar</button>
                      </form>
                    </div>
                  ) : (
                    <p className="max-w-56 text-xs text-slate-500">
                      Faltan menos de {horas} horas. Para cambiarla, contacta a tu matrona{c.profesional?.perfil?.telefono ? ` al ${c.profesional.perfil.telefono}` : ""}.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
      {pasadas.length > 0 && (
        <section>
          <h2 className="mb-3 font-senal text-2xl font-bold">Historial</h2>
          <ul className="tarjeta divide-y divide-tinta/10 p-0">
            {pasadas.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
                <span className="mayus">{formatoFechaHora(c.inicio)} · {c.servicio?.nombre} · {c.profesional?.perfil?.nombre}</span>
                <EstadoCita estado={c.estado} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
