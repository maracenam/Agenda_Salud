import Link from "next/link";
import { Aviso, EstadoCita } from "@/components/aviso";
import { cancelarCita } from "@/lib/acciones-citas";
import { esFechaValida, fechaISO, formatoDia, formatoHora, hoyChile, inicioDiaChile, inicioSemana, minutosChile, sumarDias } from "@/lib/fechas";
import { requerirProfesional } from "@/lib/sesion";
import { marcarCita } from "./acciones";
import { Flecha, FlechaAtras } from "@/components/marca";

export const metadata = { title: "Mi agenda" };

type Cita = {
  id: string;
  inicio: string;
  fin: string;
  estado: string;
  motivo: string | null;
  paciente: { id: string; nombre: string; telefono: string | null } | null;
  servicio: { nombre: string } | null;
};

const HORA_PX = 72;

/** Color de cada bloque según su estado. "Siguiente" es salvia sólida. */
function claseBloque(c: Cita, siguiente: boolean, elegida: boolean) {
  const base =
    c.estado === "cancelada"
      ? "border-slate-200 bg-slate-100 text-slate-500 line-through decoration-slate-400"
      : c.estado === "completada"
        ? "border-marca-100 bg-marca-50 text-marca-800"
        : c.estado === "no_asistio"
          ? "border-[#f3d6b4] bg-alerta-claro text-alerta"
          : siguiente
            ? "border-acento bg-acento text-white"
            : "border-acento-suave bg-acento-claro text-tinta";
  return `${base} ${elegida ? "ring-2 ring-marca-700 ring-offset-2" : ""}`;
}

export default async function Agenda({ searchParams }: PageProps<"/panel">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const hoy = hoyChile();
  const fecha = esFechaValida(sp.fecha as string) ? (sp.fecha as string) : hoy;
  const semana = sp.vista === "semana";
  const desde = semana ? inicioSemana(fecha) : fecha;
  const hasta = sumarDias(desde, semana ? 7 : 1);
  const paso = semana ? 7 : 1;
  const ruta = (f: string, v = semana ? "semana" : "dia", cita?: string) => `/panel?fecha=${f}&vista=${v}${cita ? `&cita=${cita}` : ""}`;
  const aquí = ruta(fecha);

  const [{ data }, { data: horarios }] = await Promise.all([
    supabase
      .from("citas")
      .select("id, inicio, fin, estado, motivo, paciente:perfiles!citas_paciente_id_fkey(id, nombre, telefono), servicio:servicios(nombre)")
      .eq("profesional_id", id)
      .gte("inicio", inicioDiaChile(desde).toISOString())
      .lt("inicio", inicioDiaChile(hasta).toISOString())
      .order("inicio"),
    supabase.from("horarios").select("hora_inicio, hora_fin").eq("profesional_id", id),
  ]);
  const citas = (data ?? []) as unknown as Cita[];
  const activas = citas.filter((c) => c.estado !== "cancelada");

  const ahora = Date.now();
  const siguiente = activas.find((c) => c.estado === "confirmada" && new Date(c.fin).getTime() > ahora)?.id;
  const porCerrar = activas.filter((c) => c.estado === "confirmada" && new Date(c.fin).getTime() <= ahora);
  const elegidaId = typeof sp.cita === "string" ? sp.cita : siguiente ?? activas[0]?.id;
  const elegida = citas.find((c) => c.id === elegidaId);

  // Rango visible: de la primera hora de atención (o cita) a la última.
  const minutos = [
    ...(horarios ?? []).flatMap((h) => [Number(h.hora_inicio.slice(0, 2)) * 60, Number(h.hora_fin.slice(0, 2)) * 60 + Number(h.hora_fin.slice(3, 5))]),
    ...citas.flatMap((c) => [minutosChile(c.inicio), minutosChile(c.fin)]),
  ];
  const desdeMin = Math.floor(Math.min(8 * 60 + 60, ...minutos) / 60) * 60;
  const hastaMin = Math.ceil(Math.max(18 * 60, ...minutos) / 60) * 60;
  const horas = Array.from({ length: (hastaMin - desdeMin) / 60 }, (_, i) => desdeMin / 60 + i);
  const alto = ((hastaMin - desdeMin) / 60) * HORA_PX;
  const y = (iso: string) => ((minutosChile(iso) - desdeMin) / 60) * HORA_PX;
  const ahoraY = ((minutosChile(new Date(ahora)) - desdeMin) / 60) * HORA_PX;
  const mostrarAhora = (d: string) => d === hoy && ahoraY > 0 && ahoraY < alto;

  const cuenta = {
    atendidas: activas.filter((c) => c.estado === "completada").length,
    porAtender: activas.filter((c) => c.estado === "confirmada" && new Date(c.fin).getTime() > ahora).length,
    noAsistio: activas.filter((c) => c.estado === "no_asistio").length,
  };

  const titulo = semana
    ? `Semana del ${formatoDia(desde, { weekday: undefined, month: undefined })} al ${formatoDia(sumarDias(desde, 6), { weekday: undefined })}`
    : formatoDia(fecha);

  const regla = (
    <ol aria-hidden="true" className="relative text-right text-xs font-medium text-slate-500" style={{ height: alto }}>
      {horas.map((h, i) => (
        <li key={h} className="cifra absolute right-3 -translate-y-1/2" style={{ top: i * HORA_PX }}>
          {String(h).padStart(2, "0")}:00
        </li>
      ))}
    </ol>
  );

  const lineaAhora = (
    <div className="pointer-events-none absolute inset-x-0 z-20 flex items-center" style={{ top: ahoraY }} aria-hidden="true">
      <span className="-ml-1.5 size-3 rounded-full border-2 border-white bg-marca-700" />
      <span className="h-0.5 flex-1 bg-marca-700" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold text-marca-700">{!semana && fecha === hoy ? "Hoy" : semana ? "Vista semanal" : "Agenda"}</p>
          <h1 className="titulo mayus">{titulo}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 bg-white">
            <Link className="flex min-h-11 items-center rounded-l-lg px-3 hover:bg-slate-50" href={ruta(sumarDias(fecha, -paso))} aria-label={semana ? "Semana anterior" : "Día anterior"}><FlechaAtras /></Link>
            <Link className="flex min-h-11 items-center border-x border-slate-300 px-4 text-[15px] font-semibold hover:bg-slate-50" href={ruta(hoy)}>Hoy</Link>
            <Link className="flex min-h-11 items-center rounded-r-lg px-3 hover:bg-slate-50" href={ruta(sumarDias(fecha, paso))} aria-label={semana ? "Semana siguiente" : "Día siguiente"}><Flecha /></Link>
          </div>
          <div className="flex rounded-lg bg-slate-200/70 p-1 text-[15px] font-semibold">
            <Link href={ruta(fecha, "dia")} aria-current={!semana ? "page" : undefined} className={`flex min-h-9 items-center rounded-md px-3.5 ${!semana ? "bg-white shadow-sm" : "text-slate-600 hover:text-tinta"}`}>Día</Link>
            <Link href={ruta(fecha, "semana")} aria-current={semana ? "page" : undefined} className={`flex min-h-9 items-center rounded-md px-3.5 ${semana ? "bg-white shadow-sm" : "text-slate-600 hover:text-tinta"}`}>Semana</Link>
          </div>
        </div>
      </div>

      <Aviso error={sp.error} ok={sp.ok} />

      {semana ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] border-b border-slate-200">
              <span />
              {Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => {
                const esHoy = d === hoy;
                const n = activas.filter((c) => fechaISO(c.inicio) === d).length;
                return (
                  <Link key={d} href={ruta(d, "dia")} className="border-l border-slate-200 px-2 py-2.5 text-center hover:bg-slate-50">
                    <span className="block text-xs font-semibold text-slate-500 mayus">{formatoDia(d, { weekday: "short", day: undefined, month: undefined })}</span>
                    <span className={`cifra mx-auto mt-0.5 flex size-9 items-center justify-center rounded-full text-lg ${esHoy ? "bg-marca-700 text-white" : ""}`}>{Number(d.slice(8))}</span>
                    <span className="block text-xs text-slate-500">{n === 0 ? "Libre" : `${n} ${n === 1 ? "cita" : "citas"}`}</span>
                  </Link>
                );
              })}
            </div>
            <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] py-4">
              {regla}
              {Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => (
                <div key={d} className={`grilla-tiempo relative border-l border-slate-200 ${d === hoy ? "bg-marca-50/40" : ""}`} style={{ height: alto, ["--hora" as string]: `${HORA_PX}px` }}>
                  {mostrarAhora(d) && lineaAhora}
                  {citas
                    .filter((c) => fechaISO(c.inicio) === d)
                    .map((c) => (
                      <Link
                        key={c.id}
                        href={ruta(d, "dia", c.id)}
                        className={`bloque-cita absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-xs leading-tight ${claseBloque(c, c.id === siguiente, false)}`}
                        style={{ top: y(c.inicio) + 1, height: Math.max(y(c.fin) - y(c.inicio) - 2, 22) }}
                      >
                        <span className="cifra block">{formatoHora(c.inicio)}</span>
                        <span className="block truncate font-semibold">{c.paciente?.nombre.split(" ")[0]}</span>
                      </Link>
                    ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem] xl:items-start">
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-b border-slate-200 px-5 py-3 text-[15px]">
              <span><span className="cifra">{activas.length}</span> {activas.length === 1 ? "cita" : "citas"}</span>
              <span className="text-slate-600"><span className="cifra text-tinta">{cuenta.atendidas}</span> atendidas</span>
              <span className="text-slate-600"><span className="cifra text-tinta">{cuenta.porAtender}</span> por atender</span>
              {cuenta.noAsistio > 0 && <span className="text-slate-600"><span className="cifra text-tinta">{cuenta.noAsistio}</span> no asistió</span>}
            </div>
            <div className="grid grid-cols-[4rem_1fr] py-5 pr-4 sm:pr-5">
              {regla}
              <div className="grilla-tiempo relative border-l border-slate-200" style={{ height: alto, ["--hora" as string]: `${HORA_PX}px` }}>
                {mostrarAhora(fecha) && lineaAhora}
                {citas.length === 0 && (
                  <div className="absolute inset-x-6 top-10 rounded-xl border border-dashed border-slate-300 bg-white/80 p-6 text-center">
                    <p className="text-lg font-bold">Día libre</p>
                    <p className="mt-1 text-slate-600">Cuando una paciente reserve, su cita aparece aquí en su hora.</p>
                  </div>
                )}
                {citas.map((c) => {
                  const h = y(c.fin) - y(c.inicio);
                  return (
                    <Link
                      key={c.id}
                      href={ruta(fecha, "dia", c.id)}
                      scroll={false}
                      aria-current={c.id === elegidaId ? "true" : undefined}
                      className={`bloque-cita absolute right-0 left-2 flex gap-3 overflow-hidden rounded-lg border px-3 py-1.5 ${claseBloque(c, c.id === siguiente, c.id === elegidaId)}`}
                      style={{ top: y(c.inicio) + 2, height: Math.max(h - 4, 26) }}
                    >
                      <span className="cifra shrink-0 text-[15px]">{formatoHora(c.inicio)}</span>
                      <span className="min-w-0 text-[15px] leading-tight">
                        <span className="block truncate font-semibold">{c.paciente?.nombre ?? "Paciente"}</span>
                        {h >= 50 && <span className="block truncate text-sm opacity-80">{c.servicio?.nombre}</span>}
                      </span>
                      {c.id === siguiente && <span className="ml-auto shrink-0 self-start rounded-md bg-white/20 px-1.5 py-0.5 text-xs font-semibold">Siguiente</span>}
                      {c.estado === "no_asistio" && <span className="ml-auto shrink-0 self-start text-xs font-semibold">No asistió</span>}
                      {c.estado === "completada" && <span className="ml-auto shrink-0 self-start text-xs font-medium opacity-70">Atendida</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-4 xl:sticky xl:top-6">
            {elegida ? (
              <section aria-label="Cita elegida" className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-600">{elegida.id === siguiente ? "Siguiente" : "Cita"}</p>
                  <EstadoCita estado={elegida.estado} />
                </div>
                <p className="cifra mt-1 text-[44px] leading-none tracking-[-0.035em]">{formatoHora(elegida.inicio)}</p>
                <p className="text-[15px] text-slate-600">hasta las {formatoHora(elegida.fin)}</p>
                <p className="mt-4 text-xl leading-tight font-bold">{elegida.paciente?.nombre ?? "Paciente"}</p>
                <p className="text-slate-700">{elegida.servicio?.nombre}</p>
                {elegida.paciente?.telefono && (
                  <a href={`tel:${elegida.paciente.telefono.replace(/\s/g, "")}`} className="mt-1 inline-block text-[15px] text-slate-600 hover:text-tinta hover:underline">{elegida.paciente.telefono}</a>
                )}
                {elegida.motivo && <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2.5 text-[15px] text-slate-700">“{elegida.motivo}”</p>}
                <div className="mt-5 grid gap-2">
                  {elegida.paciente && (
                    <Link className="btn" href={`/panel/pacientes/${elegida.paciente.id}?cita=${elegida.id}`}>Abrir ficha</Link>
                  )}
                  {elegida.estado === "confirmada" && new Date(elegida.inicio).getTime() < ahora && (
                    <div className="grid grid-cols-2 gap-2">
                      <form action={marcarCita}>
                        <input type="hidden" name="cita" value={elegida.id} />
                        <input type="hidden" name="estado" value="completada" />
                        <input type="hidden" name="volver" value={aquí} />
                        <button className="btn-sec w-full">Atendida</button>
                      </form>
                      <form action={marcarCita}>
                        <input type="hidden" name="cita" value={elegida.id} />
                        <input type="hidden" name="estado" value="no_asistio" />
                        <input type="hidden" name="volver" value={aquí} />
                        <button className="btn-sec w-full">No asistió</button>
                      </form>
                    </div>
                  )}
                  {elegida.estado === "confirmada" && new Date(elegida.inicio).getTime() >= ahora && (
                    <div className="grid grid-cols-2 gap-2">
                      <Link className="btn-sec" href={`/mis-citas/${elegida.id}/reprogramar?volver=/panel`}>Cambiar hora</Link>
                      <form action={cancelarCita}>
                        <input type="hidden" name="cita" value={elegida.id} />
                        <input type="hidden" name="volver" value={aquí} />
                        <button className="btn-peligro w-full border border-red-200">Cancelar</button>
                      </form>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <p className="rounded-xl border border-slate-200 bg-white p-5 text-slate-600">Elige una cita en la agenda para ver su detalle.</p>
            )}

            {porCerrar.length > 0 && (
              <section aria-labelledby="por-cerrar" className="rounded-xl border border-[#f3d6b4] bg-alerta-claro p-5">
                <h2 id="por-cerrar" className="font-bold text-[#5c2d07]">Por cerrar</h2>
                <p className="mt-1 text-[15px] text-[#5c2d07]">Ya pasaron y siguen confirmadas. Marca si se atendieron.</p>
                <ul className="mt-3 space-y-1">
                  {porCerrar.map((c) => (
                    <li key={c.id}>
                      <Link href={ruta(fecha, "dia", c.id)} scroll={false} className="flex justify-between gap-3 rounded-md px-2 py-1.5 text-[15px] hover:bg-white/60">
                        <span className="truncate font-semibold">{c.paciente?.nombre}</span>
                        <span className="cifra">{formatoHora(c.inicio)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
