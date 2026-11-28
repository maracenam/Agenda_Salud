import { atenderYCobrar } from "@/app/panel/acciones";
import { formatoPrecio } from "@/lib/fechas";
import { MEDIOS, nombreMedio, type MedioPago } from "@/lib/ingresos";

type Pago = { medio: MedioPago; monto: number; folio_bono: string | null } | null;

/** Campos de un cobro con valores por defecto. `sufijo` permite varios en un mismo formulario. */
export function CamposCobro({ medio, monto, folio, sufijo = "", compacto }: { medio: MedioPago; monto: number; folio?: string | null; sufijo?: string; compacto?: boolean }) {
  const id = (k: string) => `${k}${sufijo || "-cobro"}`;
  return (
    <div className={`group grid gap-2 ${compacto ? "sm:grid-cols-[minmax(0,1fr)_8rem_9rem]" : "grid-cols-[minmax(0,1fr)_6.5rem]"}`}>
      <div>
        <label className={compacto ? "sr-only" : "etiqueta"} htmlFor={id("medio")}>Medio de pago</label>
        <select className="campo" id={id("medio")} name={`medio${sufijo}`} defaultValue={medio}>
          {MEDIOS.map((m) => <option key={m.valor} value={m.valor}>{m.t}</option>)}
        </select>
      </div>
      <div>
        <label className={compacto ? "sr-only" : "etiqueta"} htmlFor={id("monto")}>Monto</label>
        <input className="campo cifra" id={id("monto")} name={`monto${sufijo}`} inputMode="numeric" pattern="[0-9$. ]*" maxLength={12} defaultValue={String(monto)} required />
      </div>
      <div className={`hidden group-has-[option[value^=bono]:checked]:block ${compacto ? "" : "col-span-2"}`}>
        <label className={compacto ? "sr-only" : "etiqueta"} htmlFor={id("folio")}>Folio del bono <span className="font-normal text-slate-500">(opcional)</span></label>
        <input className="campo" id={id("folio")} name={`folio${sufijo}`} maxLength={40} defaultValue={folio ?? ""} placeholder={compacto ? "Folio (opcional)" : ""} />
      </div>
    </div>
  );
}

/**
 * Cobro en la ficha de la cita (CU-12). Un toque en el botón principal registra atendida + cobro
 * con lo propuesto. Si ya está cobrada, muestra el cobro y permite corregirlo.
 */
export function CobroCita({ cita, volver, estado, sugerido, pago }: { cita: string; volver: string; estado: string; sugerido: { medio: MedioPago; monto: number }; pago: Pago }) {
  const campos = (
    <>
      <input type="hidden" name="cita" value={cita} />
      <input type="hidden" name="volver" value={volver} />
    </>
  );
  if (pago)
    return (
      <details className="rounded-lg border border-slate-200 px-3 py-2.5">
        <summary className="flex cursor-pointer items-center justify-between gap-2 text-[15px]">
          <span>Cobrado <span className="cifra font-semibold">{formatoPrecio(pago.monto)}</span> · {nombreMedio(pago.medio)}</span>
          <span className="text-sm text-marca-700 underline">Corregir</span>
        </summary>
        <form action={atenderYCobrar} className="mt-3 space-y-3">
          {campos}
          <CamposCobro medio={pago.medio} monto={pago.monto} folio={pago.folio_bono} />
          <button className="btn-sec w-full">Guardar cobro</button>
        </form>
      </details>
    );
  return (
    <form action={atenderYCobrar} className="space-y-3 rounded-lg border border-slate-200 p-3">
      {campos}
      <CamposCobro medio={sugerido.medio} monto={sugerido.monto} />
      <button className="btn w-full">{estado === "completada" ? "Registrar cobro" : "Atendida y cobrada"}</button>
      {estado !== "completada" && (
        <button name="sin_cobro" value="1" className="w-full text-sm text-slate-600 underline hover:text-tinta">Atendida, sin registrar cobro</button>
      )}
    </form>
  );
}
