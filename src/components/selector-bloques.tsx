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
    <div className="space-y-5">
      <div>
        <p className="etiqueta">1. Elige el día</p>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {dias.map((d) => {
            const atiende = diasConHorario.includes(diaSemana(d));
            const activo = d === fecha;
            return (
              <Link
                key={d}
                href={`${rutaBase}${sep}fecha=${d}`}
                scroll={false}
                aria-disabled={!atiende}
                className={`flex min-w-16 flex-col items-center rounded-lg border px-2 py-2 text-xs ${
                  activo
                    ? "border-marca-600 bg-marca-700 text-white"
                    : atiende
                      ? "border-slate-300 bg-white hover:border-marca-600"
                      : "pointer-events-none border-slate-100 bg-slate-50 text-slate-300"
                }`}
              >
                <span className="capitalize">{formatoDia(d, { weekday: "short", day: undefined, month: undefined })}</span>
                <span className="text-lg font-semibold">{Number(d.slice(8))}</span>
                <span>{formatoDia(d, { month: "short", weekday: undefined, day: undefined })}</span>
              </Link>
            );
          })}
        </div>
      </div>
      <form action={accion} className="space-y-4">
        {Object.entries(ocultos).map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
        <fieldset>
          <legend className="etiqueta">2. Elige la hora · <span className="capitalize">{formatoDia(fecha)}</span></legend>
          {error ? (
            <p className="text-sm text-red-700">No se pudieron cargar las horas.</p>
          ) : lista.length === 0 ? (
            <p className="text-sm text-slate-600">No quedan horas disponibles este día. Prueba con otro.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {lista.map((b) => (
                <label key={b.inicio} className="cursor-pointer rounded-lg border border-slate-300 bg-white py-2 text-center text-sm has-checked:border-marca-600 has-checked:bg-marca-50 has-checked:font-semibold">
                  <input type="radio" name="inicio" value={b.inicio} required className="sr-only" />
                  {formatoHora(b.inicio)}
                </label>
              ))}
            </div>
          )}
        </fieldset>
        {conMotivo && lista.length > 0 && (
          <div>
            <label className="etiqueta" htmlFor="motivo">Motivo de consulta (opcional)</label>
            <textarea className="campo" id="motivo" name="motivo" rows={2} maxLength={500} placeholder="Ej: control de embarazo, 12 semanas" />
          </div>
        )}
        {lista.length > 0 && <button className="btn">{textoBoton}</button>}
      </form>
    </div>
  );
}
