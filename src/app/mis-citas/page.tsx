import Link from "next/link";
import { Aviso, EstadoCita } from "@/components/aviso";
import { cancelarCita } from "@/lib/acciones-citas";
import { fechaISO, formatoDia, formatoFecha, formatoFechaCorta, formatoHora, instanteActual } from "@/lib/fechas";
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

function Acciones({ c, ahora }: { c: Cita; ahora: number }) {
  const horas = c.profesional?.horas_min_cambio ?? 2;
  const puedeCambiar = new Date(c.inicio).getTime() - ahora > horas * 3600_000;
  return puedeCambiar ? (
    <div className="flex flex-wrap gap-2">
      <Link href={`/mis-citas/${c.id}/reprogramar`} className="btn-sec">Cambiar hora</Link>
      <form action={cancelarCita}>
        <input type="hidden" name="cita" value={c.id} />
        <input type="hidden" name="volver" value="/mis-citas" />
        <button className="btn-peligro">Cancelar</button>
      </form>
    </div>
  ) : (
    <p className="max-w-64 text-sm text-slate-600">
      Faltan menos de {horas} horas. Para moverla, llama a tu profesional{c.profesional?.perfil?.telefono ? ` al ${c.profesional.perfil.telefono}` : ""}.
    </p>
  );
}

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
  const ahora = instanteActual();
  const proximas = citas.filter((c) => new Date(c.inicio).getTime() >= ahora && c.estado === "confirmada").reverse();
  const pasadas = citas.filter((c) => !proximas.includes(c));
  const [primera, ...resto] = proximas;

  return (
    <div className="contenedor space-y-10 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Mis citas</h1>
          {perfil.rol === "profesional" && (
            <p className="mt-1 text-[15px] text-slate-600">Las que reservaste como paciente. Tu agenda de trabajo está en <Link className="enlace" href="/panel">Mi agenda</Link>.</p>
          )}
        </div>
        <Link href="/profesionales" className="btn-sec">Reservar otra hora</Link>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      {primera ? (
        <section aria-labelledby="proxima" className="grid overflow-hidden rounded-[20px] bg-marca-700 text-white md:grid-cols-[13rem_minmax(0,1fr)]">
          <div className="flex flex-row items-baseline gap-4 bg-noche px-6 py-5 md:flex-col md:items-start md:justify-center md:gap-1 md:py-8">
            <p className="mayus text-lg font-semibold text-marca-100">{formatoDia(fechaISO(primera.inicio), { weekday: "long", day: undefined, month: undefined })}</p>
            <p className="cifra text-[56px] leading-none tracking-[-0.04em]">{Number(fechaISO(primera.inicio).slice(8))}</p>
            <p className="mayus text-lg font-semibold text-marca-100">{formatoDia(fechaISO(primera.inicio), { month: "long", weekday: undefined, day: undefined })}</p>
          </div>
          <div className="flex flex-col gap-5 px-6 py-6 sm:px-8 md:py-8">
            <div>
              <h2 id="proxima" className="text-[15px] font-semibold text-marca-200">Tu próxima hora</h2>
              <p className="cifra mt-1 text-[40px] leading-none tracking-[-0.03em]">{formatoHora(primera.inicio)}</p>
              <p className="mt-3 text-lg font-semibold">{primera.servicio?.nombre} con {primera.profesional?.perfil?.nombre}</p>
              {(primera.profesional?.direccion || primera.profesional?.comuna) && (
                <p className="text-[15px] text-marca-100">{[primera.profesional?.direccion, primera.profesional?.comuna].filter(Boolean).join(", ")}</p>
              )}
            </div>
            <div className="[&_.btn-peligro]:text-[#ffb4a8] [&_.btn-peligro]:hover:bg-white/10 [&_.btn-sec]:border-white/30 [&_.btn-sec]:bg-transparent [&_.btn-sec]:text-white [&_.btn-sec]:hover:bg-white/10 [&_p]:text-marca-100">
              <Acciones c={primera} ahora={ahora} />
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <p className="text-xl font-bold">No tienes horas por delante</p>
          <p className="mt-1 text-slate-600">Cuando reserves, la verás aquí con su dirección y la opción de cambiarla.</p>
          <Link href="/profesionales" className="btn mt-5">Buscar profesional</Link>
        </section>
      )}

      {resto.length > 0 && (
        <section>
          <h2 className="subtitulo text-xl">Después</h2>
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {resto.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold"><span className="mayus">{formatoFecha(c.inicio)}</span>, <span className="cifra">{formatoHora(c.inicio)}</span></p>
                  <p className="text-[15px] text-slate-600">{c.servicio?.nombre} con {c.profesional?.perfil?.nombre}</p>
                </div>
                <Acciones c={c} ahora={ahora} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {pasadas.length > 0 && (
        <section>
          <h2 className="subtitulo text-xl">Historial</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-[15px]">
              <thead className="border-b border-slate-200 text-sm text-slate-600">
                <tr>
                  <th className="py-3 pr-4 pl-5 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Prestación</th>
                  <th className="px-4 py-3 font-semibold">Profesional</th>
                  <th className="py-3 pr-5 pl-4 text-right font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pasadas.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 pr-4 pl-5 whitespace-nowrap"><span className="mayus">{formatoFechaCorta(c.inicio)}</span></td>
                    <td className="px-4 py-3">{c.servicio?.nombre}</td>
                    <td className="px-4 py-3 text-slate-700">{c.profesional?.perfil?.nombre}</td>
                    <td className="py-3 pr-5 pl-4 text-right"><EstadoCita estado={c.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
