import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Flecha, FlechaAtras } from "@/components/marca";
import { cobrosDelMes } from "@/lib/consulta-ingresos";
import { formatoFechaCorta, formatoPrecio, hoyChile } from "@/lib/fechas";
import { mesValido, mesVecino, nombreMedio, resumenIngresos, URL_SII_BOLETAS } from "@/lib/ingresos";
import { requerirProfesional } from "@/lib/sesion";
import { marcarBoletas } from "../acciones";

export const metadata = { title: "Mis ingresos" };

const nombreMes = (mes: string) =>
  new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${mes}-15T12:00:00Z`));

function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <div className="p-5">
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      <p className="cifra mt-2 text-3xl">{valor}</p>
      <p className="mt-1 text-sm text-slate-600">{detalle}</p>
    </div>
  );
}

/** CU-13: lo cobrado en el mes, lo que falta boletear y una estimación de la retención. */
export default async function Ingresos({ searchParams }: PageProps<"/panel/ingresos">) {
  const sp = await searchParams;
  const { id, supabase } = await requerirProfesional();
  const actual = hoyChile().slice(0, 7);
  const mes = mesValido(sp.mes) ?? actual;
  const { cobros, error, anio } = await cobrosDelMes(supabase, id, mes);
  const r = resumenIngresos(cobros, anio);
  const pendientes = cobros.filter((c) => !c.boleta_emitida && c.monto > 0);
  const aquí = `/panel/ingresos?mes=${mes}`;
  const tasa = r.tasa.toLocaleString("es-CL");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Mis ingresos</h1>
          <p className="mt-1 text-[15px] text-slate-600 first-letter:uppercase">{nombreMes(mes)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 bg-white">
            <Link className="flex min-h-11 items-center rounded-l-lg px-3 hover:bg-slate-50" href={`/panel/ingresos?mes=${mesVecino(mes, -1)}`} aria-label="Mes anterior"><FlechaAtras /></Link>
            <Link className="flex min-h-11 items-center border-x border-slate-300 px-4 text-[15px] font-semibold hover:bg-slate-50" href="/panel/ingresos">Este mes</Link>
            {mes < actual ? (
              <Link className="flex min-h-11 items-center rounded-r-lg px-3 hover:bg-slate-50" href={`/panel/ingresos?mes=${mesVecino(mes, 1)}`} aria-label="Mes siguiente"><Flecha /></Link>
            ) : (
              <span className="flex min-h-11 items-center rounded-r-lg px-3 text-slate-300" aria-hidden="true"><Flecha /></span>
            )}
          </div>
          <a className="btn-sec" href={`/panel/ingresos/exportar?mes=${mes}`} download>Exportar a Excel</a>
        </div>
      </div>

      <Aviso error={sp.error} ok={sp.ok} />
      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-900">No pudimos cargar tus cobros. Intenta de nuevo.</p>}

      <section aria-label="Resumen del mes" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3 [&>*]:border-slate-200 [&>*]:max-sm:border-b sm:[&>*]:border-r sm:[&>*:last-child]:border-r-0">
        <Cifra titulo="Cobrado" valor={formatoPrecio(r.total)} detalle={`${r.cantidad} ${r.cantidad === 1 ? "atención cobrada" : "atenciones cobradas"}`} />
        <Cifra titulo={`Retención estimada (${tasa}%)`} valor={formatoPrecio(r.retencion)} detalle="Si boleteas todo lo cobrado" />
        <Cifra titulo="Te queda, estimado" valor={formatoPrecio(r.liquido)} detalle="Antes de gastos de la consulta" />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[20rem_minmax(0,1fr)] xl:items-start">
        <section aria-labelledby="por-medio" className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 id="por-medio" className="subtitulo">Por medio de pago</h2>
          {r.porMedio.length === 0 ? (
            <p className="mt-3 text-[15px] text-slate-600">Aún no hay cobros este mes. Se registran al marcar una cita como atendida.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {r.porMedio.map((m) => (
                <li key={m.medio}>
                  <div className="flex justify-between gap-3 text-[15px]">
                    <span>{m.t} <span className="text-slate-500">· {m.cantidad}</span></span>
                    <span className="cifra">{formatoPrecio(m.monto)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-marca-700" style={{ width: `${r.total ? (m.monto / r.total) * 100 : 0}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="boletas" className="rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 p-5">
            <div>
              <h2 id="boletas" className="subtitulo">Boletas de honorarios</h2>
              <p className="mt-1 text-[15px] text-slate-600">
                {pendientes.length === 0
                  ? "Todo lo cobrado este mes tiene boleta."
                  : `${pendientes.length} ${pendientes.length === 1 ? "atención" : "atenciones"} sin boleta, por ${formatoPrecio(r.montoSinBoleta)}.`}
              </p>
            </div>
            <a className="btn-sec" href={URL_SII_BOLETAS} target="_blank" rel="noopener noreferrer">Emitir en el SII ↗</a>
          </div>
          {cobros.length > 0 && (
            <form action={marcarBoletas}>
              <input type="hidden" name="volver" value={aquí} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-left text-[15px]">
                  <thead className="text-sm text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th className="w-10 px-5 py-2 font-semibold"><span className="sr-only">Elegir</span></th>
                      <th className="py-2 pr-3 font-semibold">Fecha</th>
                      <th className="py-2 pr-3 font-semibold">Paciente</th>
                      <th className="py-2 pr-3 font-semibold">Medio</th>
                      <th className="py-2 pr-3 text-right font-semibold">Monto</th>
                      <th className="py-2 pr-5 font-semibold">Boleta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cobros.map((c) => {
                      const pendiente = !c.boleta_emitida && c.monto > 0;
                      return (
                        <tr key={c.id}>
                          <td className="px-5 py-2.5">
                            {pendiente && <input type="checkbox" name="pago" value={c.id} aria-label={`Elegir cobro de ${c.paciente?.nombre ?? "paciente"}`} className="size-5 accent-marca-700" />}
                          </td>
                          <td className="cifra py-2.5 pr-3 whitespace-nowrap">{formatoFechaCorta(c.fecha)}</td>
                          <td className="max-w-[14rem] truncate py-2.5 pr-3">{c.paciente?.nombre}</td>
                          <td className="py-2.5 pr-3 whitespace-nowrap">{nombreMedio(c.medio)}{c.folio_bono ? <span className="text-slate-500"> · {c.folio_bono}</span> : null}</td>
                          <td className="cifra py-2.5 pr-3 text-right">{formatoPrecio(c.monto)}</td>
                          <td className="py-2.5 pr-5 whitespace-nowrap">
                            {c.monto === 0 ? <span className="text-slate-500">Sin cobro</span> : c.boleta_emitida ? <span className="text-acento">Emitida{c.boleta_numero ? ` N° ${c.boleta_numero}` : ""}</span> : <span className="font-semibold text-alerta">Pendiente</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pendientes.length > 0 && (
                <div className="flex flex-wrap items-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
                  <div>
                    <label className="etiqueta" htmlFor="numero">N° de boleta <span className="font-normal text-slate-500">(opcional)</span></label>
                    <input className="campo w-40" id="numero" name="numero" maxLength={20} inputMode="numeric" />
                  </div>
                  <button className="btn">Marcar con boleta emitida</button>
                </div>
              )}
            </form>
          )}
        </section>
      </div>

      <p className="max-w-[70ch] text-sm text-slate-600">
        La retención es una estimación con la tasa de {anio} ({tasa}%). Si la paciente es persona natural, la retención la pagas tú al SII; se abona a tu declaración de renta de abril. Esto no reemplaza la asesoría de un contador.
      </p>
    </div>
  );
}
