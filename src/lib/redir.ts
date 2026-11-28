import { redirect } from "next/navigation";

/** Redirige a `ruta` agregando ?error= o ?ok= */
export function volver(ruta: string, tipo: "error" | "ok", mensaje: string): never {
  const sep = ruta.includes("?") ? "&" : "?";
  redirect(`${ruta}${sep}${tipo}=${encodeURIComponent(mensaje)}`);
}

const BASE = "http://agenda.invalid";

/**
 * Solo permite redirecciones internas. Bloquea "//otro.cl", "/\otro.cl" (los navegadores
 * tratan "\" como "/"), sus versiones codificadas y caracteres de control.
 */
export function rutaSegura(r: FormDataEntryValue | string | null | undefined, porDefecto: string) {
  const s = typeof r === "string" ? r : "";
  if (!s.startsWith("/") || s.startsWith("//") || s.length > 512) return porDefecto;
  if (/[\\\u0000-\u001f\u007f]/.test(s) || /%(5c|2f|0[0-9a-f]|1[0-9a-f])/i.test(s.slice(0, 4))) return porDefecto;
  try {
    const u = new URL(s, BASE);
    if (u.origin !== BASE) return porDefecto;
    return u.pathname + u.search + u.hash;
  } catch {
    return porDefecto;
  }
}
