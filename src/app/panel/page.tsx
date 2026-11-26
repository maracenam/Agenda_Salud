import Link from "next/link";
import { Aviso, EstadoCita } from "@/components/aviso";
import { cancelarCita } from "@/lib/acciones-citas";
import { esFechaValida, fechaISO, formatoDia, formatoHora, hoyChile, inicioDiaChile, inicioSemana, sumarDias } from "@/lib/fechas";
import { requerirProfesional } from "@/lib/sesion";
import { marcarCita } from "./acciones";

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="titulo capitalize">
            {semana ? `Semana del ${formatoDia(desde, { weekday: undefined })}` : fecha === hoy ? "Hoy" : formatoDia(fecha)}
          </h1>
          <p className="text-sm text-slate-600">
            {activas.length} {activas.length === 1 ? "cita" : "citas"}
            {!semana && fecha === hoy ? ` · ${formatoDia(fecha)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="btn-sec" href={ruta(sumarDias(fecha, -paso))} aria-label="Anterior">←</Link>
          <Link className="btn-sec" href={ruta(hoy)}>Hoy</Link>
          <Link className="btn-sec" href={ruta(sumarDias(fecha, paso))} aria-label="Siguiente">→</Link>
          <div className="flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm">
            <Link href={ruta(fecha, "dia")} className={`rounded-md px-3 py-1 ${!semana ? "bg-marca-700 text-white" : ""}`}>Día</Link>
            <Link href={ruta(fecha, "semana")} className={`rounded-md px-3 py-1 ${semana ? "bg-marca-700 text-white" : ""}`}>Semana</Link>
          </div>
        </div>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      {semana ? (
        <div className="grid gap-3 md:grid-cols-7">
          {Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((d) => {
            const delDia = citas.filter((c) => fechaISO(c.inicio) === d && c.estado !== "cancelada");
            return (
              <div key={d} className={`rounded-xl border bg-white p-2 ${d === hoy ? "border-marca-600" : "border-slate-200"}`}>
                <Link href={ruta(d, "dia")} className="mb-2 block text-center text-xs font-medium capitalize text-slate-600 hover:text-marca-700">
                  {formatoDia(d, { month: undefined })}
                </Link>
                <ul className="space-y-1">
                  {delDia.map((c) => (
                    <li key={c.id} className="rounded-md bg-marca-50 px-2 py-1 text-xs">
                      <span className="font-semibold">{formatoHora(c.inicio)}</span> {c.paciente?.nombre.split(" ")[0]}
                      <span className="block truncate text-slate-500">{c.servicio?.nombre}</span>
                    </li>
                  ))}
                  {delDia.length === 0 && <li className="text-center text-xs text-slate-300">—</li>}
                </ul>
              </div>
            );
          })}
        </div>
      ) : citas.length === 0 ? (
        <p className="tarjeta text-sm text-slate-600">No hay citas este día.</p>
      ) : (
        <ul className="space-y-3">
          {citas.map((c) => {
            const pasada = new Date(c.inicio).getTime() < Date.now();
            return (
              <li key={c.id} className={`tarjeta flex flex-wrap items-start gap-4 ${c.estado === "cancelada" ? "opacity-50" : ""}`}>
                <div className="w-20 shrink-0">
                  <p className="text-lg font-semibold">{formatoHora(c.inicio)}</p>
                  <p className="text-xs text-slate-500">a {formatoHora(c.fin)}</p>
                </div>
                <div className="min-w-48 flex-1">
                  <p className="font-medium">
                    {c.paciente ? <Link className="hover:text-marca-700" href={`/panel/pacientes/${c.paciente.id}`}>{c.paciente.nombre}</Link> : "Paciente"}{" "}
                    <EstadoCita estado={c.estado} />
                  </p>
                  <p className="text-sm text-slate-600">{c.servicio?.nombre}{c.paciente?.telefono ? ` · ${c.paciente.telefono}` : ""}</p>
                  {c.motivo && <p className="mt-1 text-sm text-slate-500">“{c.motivo}”</p>}
                </div>
                {c.estado !== "cancelada" && (
                  <div className="flex flex-wrap gap-2">
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
        </ul>
      )}
    </div>
  );
}
