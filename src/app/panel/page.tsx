import Link from "next/link";
import { Aviso, EstadoCita } from "@/components/aviso";
import { cancelarCita } from "@/lib/acciones-citas";
import { esFechaValida, fechaISO, formatoDia, formatoHora, hoyChile, inicioDiaChile, inicioSemana, sumarDias } from "@/lib/fechas";
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

export default async function Agenda({ searchParams }: PageProps<"/panel">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const hoy = hoyChile();
  const fecha = esFechaValida(sp.fecha as string) ? (sp.fecha as string) : hoy;
  const semana = sp.vista === "semana";
  const desde = semana ? inicioSemana(fecha) : fecha;
  const hasta = sumarDias(desde, semana ? 7 : 1);
  const paso = semana ? 7 : 1;
  const ruta = (f: string, v = semana ? "semana" : "dia") => `/panel?fecha=${f}&vista=${v}`;
  const aquí = ruta(fecha);

  const { data } = await supabase
    .from("citas")
    .select("id, inicio, fin, estado, motivo, paciente:perfiles!citas_paciente_id_fkey(id, nombre, telefono), servicio:servicios(nombre)")
    .eq("profesional_id", id)
    .gte("inicio", inicioDiaChile(desde).toISOString())
    .lt("inicio", inicioDiaChile(hasta).toISOString())
    .order("inicio");
  const citas = (data ?? []) as unknown as Cita[];
  const activas = citas.filter((c) => c.estado !== "cancelada");

  // La próxima cita confirmada de hoy se marca en amarillo, como la próxima salida.
  const ahora = Date.now();
  const proxima = activas.find((c) => c.estado === "confirmada" && new Date(c.fin).getTime() > ahora)?.id;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo mayus">
            {semana ? `Semana del ${formatoDia(desde, { weekday: undefined })}` : fecha === hoy ? "Hoy" : formatoDia(fecha)}
          </h1>
          <p className="mt-1.5 text-slate-700">
            <span className="cifra text-lg text-tinta">{activas.length}</span> {activas.length === 1 ? "cita" : "citas"}
            {!semana && fecha === hoy ? <> · <span className="mayus">{formatoDia(fecha)}</span></> : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex">
            <Link className="btn-sec rounded-r-none px-3" href={ruta(sumarDias(fecha, -paso))} aria-label={semana ? "Semana anterior" : "Día anterior"}><FlechaAtras /></Link>
            <Link className="btn-sec -ml-px rounded-none" href={ruta(hoy)}>Hoy</Link>
            <Link className="btn-sec -ml-px rounded-l-none px-3" href={ruta(sumarDias(fecha, paso))} aria-label={semana ? "Semana siguiente" : "Día siguiente"}><Flecha /></Link>
          </div>
          <div className="flex rounded-lg border border-slate-300 bg-white p-1 text-[15px] font-semibold">
            <Link href={ruta(fecha, "dia")} aria-current={!semana ? "page" : undefined} className={`rounded-md px-3 py-1.5 ${!semana ? "bg-marca-50 text-marca-700" : "text-slate-600 hover:text-tinta"}`}>Día</Link>
            <Link href={ruta(fecha, "semana")} aria-current={semana ? "page" : undefined} className={`rounded-md px-3 py-1.5 ${semana ? "bg-marca-50 text-marca-700" : "text-slate-600 hover:text-tinta"}`}>Semana</Link>
          </div>
        </div>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      {semana ? (
        <div className="grid gap-2 md:grid-cols-7 md:items-start">
          {Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => {
            const delDia = citas.filter((c) => fechaISO(c.inicio) === d && c.estado !== "cancelada");
            const esHoy = d === hoy;
            return (
              <div key={d} className={`overflow-hidden rounded-xl border ${esHoy ? "border-marca-600 bg-white ring-2 ring-marca-100" : delDia.length ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-transparent"}`}>
                <Link
                  href={ruta(d, "dia")}
                  className={`block px-2 py-1.5 text-center text-sm font-semibold mayus ${esHoy ? "bg-marca-700 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {formatoDia(d, { month: undefined })}
                </Link>
                <ul className="space-y-1 p-1.5">
                  {delDia.map((c) => (
                    <li key={c.id}>
                      <Link href={c.paciente ? `/panel/pacientes/${c.paciente.id}?cita=${c.id}` : ruta(d, "dia")} className="block rounded-lg bg-marca-50 px-2 py-1.5 text-sm hover:bg-marca-100">
                        <span className="cifra text-base">{formatoHora(c.inicio)}</span> {c.paciente?.nombre.split(" ")[0]}
                        <span className="block truncate text-[13px] text-slate-600">{c.servicio?.nombre}</span>
                      </Link>
                    </li>
                  ))}
                  {delDia.length === 0 && <li className="py-1 text-center text-sm text-slate-500">Libre</li>}
                </ul>
              </div>
            );
          })}
        </div>
      ) : citas.length === 0 ? (
        <div className="tarjeta text-center">
          <p className="text-xl font-bold">Día libre</p>
          <p className="mt-1 text-slate-600">No hay citas agendadas. Cuando una paciente reserve, aparecerá aquí.</p>
        </div>
      ) : (
        <ol className="tarjeta divide-y divide-slate-200 overflow-hidden p-0">
          {citas.map((c, i) => {
            const pasada = new Date(c.inicio).getTime() < ahora;
            const esProxima = c.id === proxima;
            return (
              <li
                key={c.id}
                className={`grid gap-x-5 gap-y-3 px-4 py-4 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center sm:px-5 ${c.estado === "cancelada" ? "bg-slate-50 text-slate-500" : ""} ${esProxima ? "bg-acento-claro/60" : ""}`}
              >
                <div className="flex items-baseline gap-2 overflow-hidden sm:block">
                  <p style={{ "--i": i } as React.CSSProperties} className={`cifra tablero-cifra text-[28px] leading-none ${c.estado === "cancelada" ? "text-slate-400 line-through" : "text-tinta"}`}>{formatoHora(c.inicio)}</p>
                  <p className="text-sm text-slate-600 sm:mt-1">hasta {formatoHora(c.fin)}</p>
                </div>
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-[17px] font-semibold">
                    {esProxima && <span className="rounded-full bg-acento px-2.5 py-0.5 text-[13px] font-semibold text-white">Siguiente</span>}
                    {c.paciente ? <Link className="hover:text-marca-700 hover:underline" href={`/panel/pacientes/${c.paciente.id}`}>{c.paciente.nombre}</Link> : "Paciente"}
                    <EstadoCita estado={c.estado} />
                  </p>
                  <p className="mt-0.5 text-slate-600">{c.servicio?.nombre}{c.paciente?.telefono ? ` · ${c.paciente.telefono}` : ""}</p>
                  {c.motivo && <p className="mt-1 text-slate-600 italic">“{c.motivo}”</p>}
                </div>
                {c.estado !== "cancelada" && (
                  <div className="flex flex-wrap gap-2 sm:justify-end">
                    {c.paciente && (
                      <Link className="btn" href={`/panel/pacientes/${c.paciente.id}?cita=${c.id}`}>Ficha</Link>
                    )}
                    {c.estado === "confirmada" && pasada && (
                      <>
                        <form action={marcarCita}>
                          <input type="hidden" name="cita" value={c.id} />
                          <input type="hidden" name="estado" value="completada" />
                          <input type="hidden" name="volver" value={aquí} />
                          <button className="btn-sec">Atendida</button>
                        </form>
                        <form action={marcarCita}>
                          <input type="hidden" name="cita" value={c.id} />
                          <input type="hidden" name="estado" value="no_asistio" />
                          <input type="hidden" name="volver" value={aquí} />
                          <button className="btn-sec">No asistió</button>
                        </form>
                      </>
                    )}
                    {c.estado === "confirmada" && !pasada && (
                      <>
                        <Link className="btn-sec" href={`/mis-citas/${c.id}/reprogramar?volver=/panel`}>Cambiar hora</Link>
                        <form action={cancelarCita}>
                          <input type="hidden" name="cita" value={c.id} />
                          <input type="hidden" name="volver" value={aquí} />
                          <button className="btn-peligro">Cancelar</button>
                        </form>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
