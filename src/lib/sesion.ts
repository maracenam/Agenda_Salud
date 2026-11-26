import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Perfil = {
  id: string;
  rol: "paciente" | "profesional";
  nombre: string;
  email: string | null;
  rut: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
};

/** Usuario y perfil de la sesión actual, o null. */
export const obtenerSesion = cache(async () => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) return null;
  const { data: perfil } = await supabase.from("perfiles").select("*").eq("id", id).single<Perfil>();
  if (!perfil) return null;
  return { id, perfil, supabase };
});

export async function requerirSesion() {
  const s = await obtenerSesion();
  if (!s) redirect("/ingresar");
  return s;
}

export async function requerirProfesional() {
  const s = await requerirSesion();
  if (s.perfil.rol !== "profesional") redirect("/mis-citas");
  return s;
}
