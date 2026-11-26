import { redirect } from "next/navigation";

/** Redirige a `ruta` agregando ?error= o ?ok= */
export function volver(ruta: string, tipo: "error" | "ok", mensaje: string): never {
  const sep = ruta.includes("?") ? "&" : "?";
  redirect(`${ruta}${sep}${tipo}=${encodeURIComponent(mensaje)}`);
}

/** Solo permite redirecciones internas. */
export function rutaSegura(r: FormDataEntryValue | string | null | undefined, porDefecto: string) {
  const s = typeof r === "string" ? r : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : porDefecto;
}
