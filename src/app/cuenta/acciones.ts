"use server";

import { revalidatePath } from "next/cache";
import { requerirSesion } from "@/lib/sesion";
import { volver } from "@/lib/redir";
import { validarRut } from "@/lib/rut";

export async function guardarCuenta(formData: FormData) {
  const { id, supabase } = await requerirSesion();
  const rut = String(formData.get("rut") ?? "").trim();
  if (rut && !validarRut(rut)) volver("/cuenta", "error", "El RUT no es válido.");
  const { error } = await supabase
    .from("perfiles")
    .update({
      nombre: String(formData.get("nombre") ?? "").trim(),
      rut: rut || null,
      telefono: String(formData.get("telefono") ?? "").trim() || null,
      fecha_nacimiento: String(formData.get("fecha_nacimiento") ?? "") || null,
    })
    .eq("id", id);
  if (error) volver("/cuenta", "error", error.message);
  revalidatePath("/", "layout");
  volver("/cuenta", "ok", "Datos guardados.");
}
