/** Mensaje legible a partir de un error de Supabase/Postgres. */
export function mensajeError(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return "Ocurrió un error inesperado.";
  if (e.code === "23P01") return "Ese horario ya fue tomado. Elige otro.";
  if (e.code === "42501") return "No tienes permiso para hacer esto.";
  return e.message || "Ocurrió un error inesperado.";
}
