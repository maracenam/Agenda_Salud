/**
 * Mensaje legible a partir de un error de Supabase/Postgres.
 * Solo se muestran tal cual los mensajes que escriben nuestras funciones (código P0001,
 * en español y pensados para la persona). Cualquier otro error se resume, para no
 * mostrar nombres de tablas, restricciones ni detalles internos (OWASP A05).
 */
export function mensajeError(e: { message?: string; code?: string } | null | undefined): string {
  if (!e) return "Ocurrió un error inesperado.";
  if (e.code === "23P01") return "Ese horario ya fue tomado. Elige otro.";
  if (e.code === "42501") return "No tienes permiso para hacer esto.";
  if (e.code === "23514" || e.code === "22001") return "Revisa los datos: hay un campo demasiado largo o con un valor no válido.";
  if (e.code === "P0001" && e.message) return e.message.slice(0, 200);
  return "Ocurrió un error inesperado.";
}
