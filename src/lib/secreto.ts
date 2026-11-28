import { createHash, timingSafeEqual } from "node:crypto";

/** Compara un encabezado Authorization con "Bearer <secreto>" en tiempo constante. */
export function autorizacionValida(encabezado: string | null, secreto: string | undefined): boolean {
  if (!secreto || secreto.length < 16 || !encabezado) return false;
  const a = createHash("sha256").update(encabezado).digest();
  const b = createHash("sha256").update(`Bearer ${secreto}`).digest();
  return timingSafeEqual(a, b);
}
