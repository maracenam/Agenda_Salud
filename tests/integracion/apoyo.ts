import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

/**
 * Supabase local (npx supabase start). Las claves se leen de la CLI al correr las pruebas,
 * para no guardarlas en el repositorio. Se pueden fijar con SB_URL, SB_PUBLISHABLE_KEY y SB_SECRET_KEY.
 */
function estadoLocal(): Record<string, string> {
  if (process.env.SB_PUBLISHABLE_KEY && process.env.SB_SECRET_KEY) return {};
  const salida = execSync("npx supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  return Object.fromEntries(
    salida
      .split("\n")
      .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], m[2]]),
  );
}
const local = estadoLocal();

export const URL_SB = process.env.SB_URL ?? local.API_URL ?? "http://127.0.0.1:54321";
export const CLAVE = process.env.SB_PUBLISHABLE_KEY ?? local.PUBLISHABLE_KEY;
export const CLAVE_ADMIN = process.env.SB_SECRET_KEY ?? local.SECRET_KEY;

export const cliente = () => createClient(URL_SB, CLAVE, { auth: { persistSession: false, autoRefreshToken: false } });
export const admin = () => createClient(URL_SB, CLAVE_ADMIN, { auth: { persistSession: false, autoRefreshToken: false } });

export const sufijo = () => Math.random().toString(36).slice(2, 8);

export async function crearCuenta(meta: Record<string, string>, email = `${meta.rol}-${sufijo()}@prueba.test`) {
  const c = cliente();
  const { data, error } = await c.auth.signUp({ email, password: "clave-segura-123", options: { data: meta } });
  if (error || !data.user) throw new Error(`No se pudo registrar: ${error?.message}`);
  return { c, id: data.user.id, email };
}

/** Próximo lunes (al menos 7 días) a la hora dada, hora de Chile, como ISO UTC. */
export function lunes(hora: number, minuto = 0) {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(ahora);
  const g = (t: string) => partes.find((p) => p.type === t)!.value;
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday"));
  const base = new Date(Date.UTC(Number(g("year")), Number(g("month")) - 1, Number(g("day"))));
  base.setUTCDate(base.getUTCDate() + ((8 - dow) % 7 || 7) + 7);
  const fecha = base.toISOString().slice(0, 10);
  // Offset de Chile ese día
  const off = new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", timeZoneName: "longOffset" })
    .formatToParts(new Date(fecha + "T12:00:00Z")).find((p) => p.type === "timeZoneName")!.value.replace("GMT", "") || "+00:00";
  return { fecha, iso: new Date(`${fecha}T${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}:00${off}`).toISOString() };
}

export async function profesionalLista(especialidad: string, nombre = `Pro ${especialidad}`) {
  const p = await crearCuenta({ rol: "profesional", nombre, especialidad });
  const s = await p.c.from("servicios").insert({ profesional_id: p.id, nombre: "Consulta", duracion_min: 30, precio: 25000 }).select("id").single();
  if (s.error) throw s.error;
  const h = await p.c.from("horarios").insert({ profesional_id: p.id, dia_semana: 1, hora_inicio: "09:00", hora_fin: "13:00" });
  if (h.error) throw h.error;
  const u = await p.c.from("profesionales").update({ publicado: true, comuna: "Ñuñoa" }).eq("id", p.id);
  if (u.error) throw u.error;
  return { ...p, servicio: s.data.id as string };
}

export async function stackDisponible() {
  try {
    const r = await fetch(`${URL_SB}/auth/v1/health`, { headers: { apikey: CLAVE } });
    return r.ok;
  } catch {
    return false;
  }
}

export type Cliente = SupabaseClient;
