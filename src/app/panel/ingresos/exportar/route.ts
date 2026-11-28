import { NextResponse } from "next/server";
import { cobrosDelMes } from "@/lib/consulta-ingresos";
import { fechaISO, formatoHora, hoyChile } from "@/lib/fechas";
import { csvIngresos, mesValido, nombreMedio, nombrePrevision } from "@/lib/ingresos";
import { obtenerSesion } from "@/lib/sesion";

/** CU-13: descarga los cobros del mes en un archivo que Excel abre directo. */
export async function GET(req: Request) {
  const sesion = await obtenerSesion();
  if (!sesion || sesion.perfil.rol !== "profesional") return new NextResponse("No autorizado", { status: 401 });
  const mes = mesValido(new URL(req.url).searchParams.get("mes")) ?? hoyChile().slice(0, 7);
  const { cobros, error } = await cobrosDelMes(sesion.supabase, sesion.id, mes);
  if (error) return new NextResponse("No pudimos preparar el archivo", { status: 500 });
  const csv = csvIngresos(
    cobros.map((c) => ({
      fecha: fechaISO(c.fecha),
      hora: formatoHora(c.fecha),
      paciente: c.paciente?.nombre ?? "",
      rut: c.paciente?.rut ?? null,
      prestacion: c.cita?.servicio?.nombre ?? null,
      prevision: nombrePrevision(c.paciente?.prevision, c.paciente?.isapre),
      medio: nombreMedio(c.medio),
      folio_bono: c.folio_bono,
      monto: c.monto,
      boleta: c.boleta_emitida,
      boleta_numero: c.boleta_numero,
    })),
  );
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ingresos-${mes}.csv"`,
      "cache-control": "private, no-store",
    },
  });
}
