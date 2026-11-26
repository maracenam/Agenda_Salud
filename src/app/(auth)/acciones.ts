"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura, volver } from "@/lib/redir";

export async function ingresar(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const siguiente = rutaSegura(formData.get("siguiente"), "");
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = error.code === "email_not_confirmed"
      ? "Debes confirmar tu email. Revisa tu bandeja de entrada."
      : "Email o contraseña incorrectos.";
    volver(`/ingresar${siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : ""}`, "error", msg);
  }
  if (siguiente) redirect(siguiente);
  const rol = data.user?.user_metadata?.rol;
  redirect(rol === "profesional" ? "/panel" : "/mis-citas");
}

export async function registrar(formData: FormData) {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const telefono = String(formData.get("telefono") ?? "").trim();
  const rol = formData.get("rol") === "profesional" ? "profesional" : "paciente";
  const siguiente = rutaSegura(formData.get("siguiente"), "");
  const base = `/registro?rol=${rol}`;
  if (nombre.length < 3) volver(base, "error", "Escribe tu nombre completo.");
  if (password.length < 8) volver(base, "error", "La contraseña debe tener al menos 8 caracteres.");
  if (!formData.get("acepta")) volver(base, "error", "Debes aceptar el tratamiento de tus datos para continuar.");

  const origen = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, telefono, rol },
      emailRedirectTo: `${origen}/auth/callback${siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : ""}`,
    },
  });
  if (error) {
    const msg = error.code === "user_already_exists" ? "Ya existe una cuenta con ese email." : error.message;
    volver(base, "error", msg);
  }
  if (!data.session) {
    volver("/ingresar", "ok", "Te enviamos un email para confirmar tu cuenta. Ábrelo y luego ingresa.");
  }
  redirect(siguiente || (rol === "profesional" ? "/panel/perfil?ok=Bienvenida.%20Completa%20tu%20perfil%20para%20recibir%20reservas." : "/profesionales"));
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/");
}
