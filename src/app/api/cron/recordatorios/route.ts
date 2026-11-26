import { NextResponse, type NextRequest } from "next/server";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { enviarAvisos, SELECT_CITA, type CitaAviso } from "@/lib/email";

export const maxDuration = 60;

/**
 * RF-08: envía un recordatorio por email a cada paciente con cita en las próximas 36 horas
 * que aún no lo haya recibido. Vercel Cron lo llama una vez al día (ver vercel.json).
 */
export async function GET(request: NextRequest) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const admin = crearClienteAdmin();
  if (!admin) return NextResponse.json({ error: "Falta SUPABASE_SECRET_KEY" }, { status: 500 });

  const ahora = new Date();
  const limite = new Date(ahora.getTime() + 36 * 3600_000);
  const { data, error } = await admin
    .from("citas")
    .select(SELECT_CITA)
    .eq("estado", "confirmada")
    .is("recordatorio_enviado_en", null)
    .gt("inicio", new Date(ahora.getTime() + 2 * 3600_000).toISOString())
    .lte("inicio", limite.toISOString())
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let enviados = 0;
  for (const cita of (data ?? []) as unknown as CitaAviso[]) {
    const ok = await enviarAvisos(cita, "recordatorio");
    if (ok) {
      await admin.from("citas").update({ recordatorio_enviado_en: new Date().toISOString() }).eq("id", cita.id);
      enviados++;
    }
  }
  return NextResponse.json({ revisadas: data?.length ?? 0, enviados });
}
