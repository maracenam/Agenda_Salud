"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { avisarCita } from "@/lib/email";
import { mensajeError } from "@/lib/errores";
import { rutaSegura, volver } from "@/lib/redir";
import { requerirSesion } from "@/lib/sesion";

export async function cancelarCita(formData: FormData) {
  const { supabase } = await requerirSesion();
  const cita = String(formData.get("cita") ?? "");
  const ruta = rutaSegura(formData.get("volver"), "/mis-citas");
  const { error } = await supabase.rpc("cancelar_cita", { p_cita: cita });
  if (error) volver(ruta, "error", mensajeError(error));
  after(() => avisarCita(supabase, cita, "cancelacion"));
  revalidatePath(ruta.split("?")[0]);
  volver(ruta, "ok", "La cita fue cancelada y avisamos por email.");
}

export async function reprogramarCita(formData: FormData) {
  const { supabase } = await requerirSesion();
  const cita = String(formData.get("cita") ?? "");
  const inicio = String(formData.get("inicio") ?? "");
  const desde = rutaSegura(formData.get("desde"), `/mis-citas/${cita}/reprogramar`);
  const destino = rutaSegura(formData.get("volver"), "/mis-citas");
  if (!inicio) volver(desde, "error", "Elige una hora.");
  const { error } = await supabase.rpc("reprogramar_cita", { p_cita: cita, p_inicio: inicio });
  if (error) volver(desde, "error", mensajeError(error));
  after(() => avisarCita(supabase, cita, "reprogramacion"));
  revalidatePath(destino.split("?")[0]);
  volver(destino, "ok", "La cita cambió de hora y avisamos por email.");
}
