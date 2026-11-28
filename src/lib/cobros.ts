import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { medioSugerido, type MedioPago, type Prevision } from "@/lib/ingresos";

export type Sugerencia = { medio: MedioPago; monto: number };

/**
 * Valores por defecto del cobro de cada cita (CU-12): monto = precio de la prestación,
 * medio según la previsión de la paciente y los convenios de la profesional.
 */
export async function sugerenciasCobro(
  supabase: SupabaseClient,
  profesionalId: string,
  citas: { id: string; precio: number | null; prevision: Prevision | null }[],
): Promise<Record<string, Sugerencia>> {
  if (citas.length === 0) return {};
  const [{ data: pro }, { data: ultimo }] = await Promise.all([
    supabase.from("profesionales").select("recibe_bono_fonasa, recibe_bono_isapre").eq("id", profesionalId).single(),
    supabase
      .from("pagos")
      .select("medio")
      .eq("profesional_id", profesionalId)
      .not("medio", "in", "(bono_fonasa,bono_isapre)")
      .order("creado_en", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return Object.fromEntries(
    citas.map((c) => [
      c.id,
      {
        monto: c.precio ?? 0,
        medio: medioSugerido({
          prevision: c.prevision,
          recibeBonoFonasa: !!pro?.recibe_bono_fonasa,
          recibeBonoIsapre: !!pro?.recibe_bono_isapre,
          ultimoMedio: (ultimo?.medio as MedioPago | undefined) ?? null,
        }),
      },
    ]),
  );
}
