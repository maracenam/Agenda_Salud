import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { diaSemana, formatoDia, formatoHora, hoyChile, sumarDias } from "@/lib/fechas";

type Props = {
  supabase: SupabaseClient;
  servicioId: string;
  fecha: string;
  diasConHorario: number[];
  /** Ruta de esta página, para los enlaces de día (se agrega &fecha=) */
  rutaBase: string;
  accion: (formData: FormData) => Promise<void>;
  ocultos: Record<string, string>;
  textoBoton?: string;
  conMotivo?: boolean;
};

export async function SelectorBloques({ supabase, servicioId, fecha, diasConHorario, rutaBase, accion, ocultos, textoBoton = "Confirmar reserva", conMotivo }: Props) {
  const hoy = hoyChile();
  const dias = Array.from({ length: 21 }, (_, i) => sumarDias(hoy, i));
  const { data: bloques, error } = await supabase.rpc("bloques_disponibles", { p_servicio: servicioId, p_fecha: fecha });
  const lista = (bloques ?? []) as { inicio: string; fin: string }[];
  const sep = rutaBase.includes("?") ? "&" : "?";

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 flex items-center gap-2.5 text-lg font-semibold"><span className="insignia size-7 bg-marca-700 text-white">1</span>Elige el día</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pt-1 pb-3">
          {dias.map((d) => {
            const atiende = diasConHorario.includes(diaSemana(d));
            const activo = d === fecha;
            return (
              <Link
                key={d}
                href={`${rutaBase}${sep}fecha=${d}`}
                scroll={false}
                aria-disabled={!atiende}
                aria-current={activo ? "date" : undefined}
                className={`flex min-w-[4.25rem] flex-col items-center rounded-xl border px-2 py-2 text-[13px] font-medium transition-colors ${
                  activo
                    ? "border-marca-700 bg-marca-700 text-white"
                    : atiende
                      ? "border-slate-300 bg-white text-tinta hover:border-marca-600"
                      : "pointer-events-none border-transparent bg-slate-100 text-slate-400 line-through decoration-slate-300"
                }`}
              >
                <span className="mayus">{formatoDia(d, { weekday: "short", day: undefined, month: undefined })}</span>
                <span className="cifra text-[24px] leading-tight">{Number(d.slice(8))}</span>
                <span>{formatoDia(d, { month: "short", weekday: undefined, day: undefined })}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <form action={accion} className="space-y-6">
        {Object.entries(ocultos).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <fieldset>
          <legend className="mb-3 flex flex-wrap items-center gap-2.5 text-lg font-semibold">
            <span className="insignia size-7 bg-marca-700 text-white">2</span>Elige la hora
            <span className="font-sans text-base font-medium text-slate-600">· <span className="mayus">{formatoDia(fecha)}</span></span>
          </legend>
          {error ? (
            <p className="text-[15px] font-medium text-red-800">No se pudieron cargar las horas. Recarga la página o prueba en un momento.</p>
          ) : lista.length === 0 ? (
            <p className="rounded-lg bg-slate-100 px-4 py-3 text-[15px] text-slate-700">No quedan horas disponibles este día. Prueba con otro.</p>
          ) : (
            <div key={fecha}>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                {lista.map((b, i) => (
                  <label
                    key={b.inicio}
                    className="cursor-pointer overflow-hidden rounded-lg border border-acento-suave bg-acento-claro/50 py-3 text-center text-acento transition-colors hover:border-acento has-checked:border-acento has-checked:bg-acento has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-marca-600"
                  >
                    <input type="radio" name="inicio" value={b.inicio} required className="sr-only" />
                    <span className="cifra tablero-cifra text-xl" style={{ "--i": i } as React.CSSProperties}>{formatoHora(b.inicio)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </fieldset>
        {conMotivo && lista.length > 0 && (
          <div>
            <label className="etiqueta" htmlFor="motivo">Motivo de consulta (opcional)</label>
            <textarea className="campo" id="motivo" name="motivo" rows={2} maxLength={500} placeholder="Ej: control de embarazo, 12 semanas" />
          </div>
        )}
        {lista.length > 0 && <button className="btn-acento w-full sm:w-auto">{textoBoton}</button>}
      </form>
    </div>
  );
}
