import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { inicioDiaChile } from "@/lib/fechas";
import { rangoMes, type MedioPago, type Prevision } from "@/lib/ingresos";

export type CobroMes = {
  id: string;
  fecha: string;
  medio: MedioPago;
  monto: number;
  folio_bono: string | null;
  boleta_emitida: boolean;
  boleta_numero: string | null;
  paciente: { nombre: string; rut: string | null; prevision: Prevision | null; isapre: string | null } | null;
  cita: { servicio: { nombre: string } | null } | null;
};

/** Cobros de la profesional en el mes (por fecha de la atención, hora de Chile). */
export async function cobrosDelMes(supabase: SupabaseClient, profesionalId: string, mes: string) {
  const r = rangoMes(mes);
  const { data, error } = await supabase
    .from("pagos")
    .select("id, fecha, medio, monto, folio_bono, boleta_emitida, boleta_numero, paciente:perfiles(nombre, rut, prevision, isapre), cita:citas(servicio:servicios(nombre))")
    .eq("profesional_id", profesionalId)
    .gte("fecha", inicioDiaChile(r.desde).toISOString())
    .lt("fecha", inicioDiaChile(r.hasta).toISOString())
    .order("fecha");
  return { cobros: (data ?? []) as unknown as CobroMes[], error, anio: r.anio };
}
