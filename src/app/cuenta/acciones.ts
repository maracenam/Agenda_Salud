"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/sesion";
import { volver } from "@/lib/redir";
import { validarRut } from "@/lib/rut";
import { mensajeError } from "@/lib/errores";

export async function guardarCuenta(formData: FormData) {
  const { id, supabase } = await requerirSesion();
  const rut = String(formData.get("rut") ?? "").trim();
  if (rut && !validarRut(rut)) volver("/cuenta", "error", "El RUT no es válido.");
  const nombre = String(formData.get("nombre") ?? "").trim();
  if (nombre.length < 3 || nombre.length > 120) volver("/cuenta", "error", "Escribe tu nombre completo.");
  const nacimiento = String(formData.get("fecha_nacimiento") ?? "");
  if (nacimiento && (!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento) || nacimiento > new Date().toISOString().slice(0, 10)))
    volver("/cuenta", "error", "Revisa la fecha de nacimiento.");
  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre,
      rut: rut || null,
      telefono: String(formData.get("telefono") ?? "").trim().slice(0, 30) || null,
      fecha_nacimiento: nacimiento || null,
    })
    .eq("id", id);
  if (error) volver("/cuenta", "error", mensajeError(error));
  revalidatePath("/", "layout");
  volver("/cuenta", "ok", "Datos guardados.");
}
