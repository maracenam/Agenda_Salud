"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { avisarCita } from "@/lib/email";
import { mensajeError } from "@/lib/errores";
import { volver } from "@/lib/redir";
import { obtenerSesion } from "@/lib/sesion";
import { esPrevision } from "@/lib/ingresos";

export async function reservar(formData: FormData) {
  const servicio = String(formData.get("servicio") ?? "");
  const profesional = String(formData.get("profesional") ?? "");
  const fecha = String(formData.get("fecha") ?? "");
  const inicio = String(formData.get("inicio") ?? "");
  const motivo = String(formData.get("motivo") ?? "").trim() || null;
  const ruta = `/profesionales/${profesional}/reservar?servicio=${servicio}&fecha=${fecha}`;

  const sesion = await obtenerSesion();
  if (!sesion) redirect(`/ingresar?siguiente=${encodeURIComponent(ruta)}`);
  if (!inicio) volver(ruta, "error", "Elige una hora.");

  const { data, error } = await sesion.supabase.rpc("reservar_cita", {
    p_servicio: servicio,
    p_inicio: inicio,
    p_motivo: motivo,
  });
  if (error || !data) volver(ruta, "error", mensajeError(error));

  // La previsión queda en el perfil de la paciente: sirve para proponer el bono al cobrar.
  const prevision = formData.get("prevision");
  if (esPrevision(prevision) && prevision !== sesion.perfil.prevision) {
    await sesion.supabase.from("perfiles").update({ prevision, ...(prevision !== "isapre" ? { isapre: null } : {}) }).eq("id", sesion.id);
  }

  const citaId = (data as { id: string }).id;
  after(() => avisarCita(sesion.supabase, citaId, "confirmacion"));
  redirect(`/mis-citas?ok=${encodeURIComponent("¡Listo! Tu hora quedó reservada. Te enviamos la confirmación por email.")}`);
}
