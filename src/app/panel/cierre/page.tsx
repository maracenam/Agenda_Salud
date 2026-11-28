import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { CamposCobro } from "@/components/cobro-cita";
import { FlechaAtras } from "@/components/marca";
import { sugerenciasCobro } from "@/lib/cobros";
import { esFechaValida, formatoDia, formatoHora, hoyChile, inicioDiaChile, instanteActual, sumarDias } from "@/lib/fechas";
import { nombrePrevision, type Prevision } from "@/lib/ingresos";
import { requerirProfesional } from "@/lib/sesion";
import { cerrarDia } from "../acciones";

export const metadata = { title: "Cierre del día" };

type Fila = {
  id: string;
  inicio: string;
  estado: string;
  paciente: { nombre: string; prevision: Prevision | null; isapre: string | null } | null;
  servicio: { nombre: string; precio: number | null } | null;
  pago: { id: string } | null;
};

/** CU-12: confirmar de una vez todas las citas del día, con el cobro ya propuesto. */
export default async function Cierre({ searchParams }: PageProps<"/panel/cierre">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const fecha = esFechaValida(sp.fecha as string) ? (sp.fecha as string) : hoyChile();
  const { data } = await supabase
    .from("citas")
    .select("id, inicio, estado, paciente:perfiles!citas_paciente_id_fkey(nombre, prevision, isapre), servicio:servicios(nombre, precio), pago:pagos(id)")
    .eq("profesional_id", id)
    .in("estado", ["confirmada", "completada"])
    .gte("inicio", inicioDiaChile(fecha).toISOString())
    .lt("inicio", inicioDiaChile(sumarDias(fecha, 1)).toISOString())
    .order("inicio");
  const ahora = instanteActual();
  const filas = ((data ?? []) as unknown as Fila[]).filter(
    (c) => (c.estado === "confirmada" && new Date(c.inicio).getTime() < ahora) || (c.estado === "completada" && !c.pago),
  );
  const sug = await sugerenciasCobro(supabase, id, filas.map((c) => ({ id: c.id, precio: c.servicio?.precio ?? null, prevision: c.paciente?.prevision ?? null })));
  const aquí = `/panel/cierre?fecha=${fecha}`;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/panel?fecha=${fecha}`} className="enlace inline-flex items-center gap-1 text-[15px]"><FlechaAtras className="size-4" />Agenda</Link>
        <h1 className="titulo mt-2">Cierre del día</h1>
        <p className="mayus mt-1 text-[15px] text-slate-600">{formatoDia(fecha)}</p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />
      {filas.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-[15px] text-slate-600">No hay citas por cerrar este día. Todo quedó registrado.</p>
      ) : (
        <form action={cerrarDia} className="rounded-xl border border-slate-200 bg-white">
          <input type="hidden" name="volver" value={aquí} />
          <p className="border-b border-slate-200 px-5 py-3 text-[15px] text-slate-600">Revisa lo propuesto y cambia solo lo que no calce. Al guardar, cada cita queda atendida con su cobro, o como inasistencia.</p>
          <ul className="divide-y divide-slate-200">
            {filas.map((c) => (
              <li key={c.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,14rem)_auto_minmax(0,1fr)] lg:items-center">
                <input type="hidden" name="cita" value={c.id} />
                <div className="min-w-0">
                  <p className="truncate font-semibold"><span className="cifra mr-2">{formatoHora(c.inicio)}</span>{c.paciente?.nombre ?? "Paciente"}</p>
                  <p className="truncate text-sm text-slate-600">{c.servicio?.nombre} · {nombrePrevision(c.paciente?.prevision, c.paciente?.isapre)}</p>
                </div>
                <fieldset className="flex gap-1.5">
                  <legend className="sr-only">¿Se atendió?</legend>
                  <label className="chip cursor-pointer has-checked:border-marca-700 has-checked:bg-marca-700 has-checked:text-white">
                    <input type="radio" name={`estado_${c.id}`} value="atendida" defaultChecked className="sr-only" />Atendida
                  </label>
                  {c.estado === "confirmada" && (
                    <label className="chip cursor-pointer has-checked:border-alerta has-checked:bg-alerta has-checked:text-white">
                      <input type="radio" name={`estado_${c.id}`} value="no_asistio" className="sr-only" />No asistió
                    </label>
                  )}
                  <label className="chip cursor-pointer has-checked:border-slate-500 has-checked:bg-slate-500 has-checked:text-white">
                    <input type="radio" name={`estado_${c.id}`} value="" className="sr-only" />Después
                  </label>
                </fieldset>
                <CamposCobro medio={sug[c.id].medio} monto={sug[c.id].monto} sufijo={`_${c.id}`} compacto />
              </li>
            ))}
          </ul>
          <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
            <button className="btn">Cerrar el día</button>
          </div>
        </form>
      )}
    </div>
  );
}
