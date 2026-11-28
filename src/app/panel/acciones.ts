"use server";

import { revalidatePath } from "next/cache";
import { mensajeError } from "@/lib/errores";
import { rutaSegura, volver } from "@/lib/redir";
import { requerirProfesional } from "@/lib/sesion";
import { inicioDiaChile } from "@/lib/fechas";
import { leerCampos, moduloDe } from "@/lib/especialidades";

const txt = (f: FormData, k: string) => String(f.get(k) ?? "").trim() || null;
const num = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === "" ? null : Number(v);
};

// Perfil profesional ------------------------------------------------------------
export async function guardarPerfil(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const publicar = formData.get("publicado") === "on";
  if (publicar) {
    const [{ count: nServ }, { count: nHor }] = await Promise.all([
      supabase.from("servicios").select("id", { count: "exact", head: true }).eq("profesional_id", id).eq("activo", true),
      supabase.from("horarios").select("id", { count: "exact", head: true }).eq("profesional_id", id),
    ]);
    if (!nServ || !nHor) volver("/panel/perfil", "error", "Para publicar necesitas al menos una prestación activa y un horario de atención.");
  }
  const especialidad = num(formData, "especialidad_id");
  const { error } = await supabase
    .from("profesionales")
    .update({
      ...(especialidad && Number.isInteger(especialidad) ? { especialidad_id: especialidad } : {}),
      titulo: txt(formData, "titulo"),
      registro_sis: txt(formData, "registro_sis"),
      bio: txt(formData, "bio"),
      direccion: txt(formData, "direccion"),
      comuna: txt(formData, "comuna"),
      horas_min_cambio: Math.min(72, Math.max(0, num(formData, "horas_min_cambio") ?? 2)),
      publicado: publicar,
    })
    .eq("id", id);
  if (error) volver("/panel/perfil", "error", mensajeError(error));
  revalidatePath("/panel", "layout");
  volver("/panel/perfil", "ok", publicar ? "Perfil guardado. Tu página está publicada." : "Perfil guardado.");
}

// Servicios ---------------------------------------------------------------------
export async function guardarServicio(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const servicioId = txt(formData, "id");
  const datos = {
    nombre: txt(formData, "nombre") ?? "",
    descripcion: txt(formData, "descripcion"),
    duracion_min: num(formData, "duracion_min") ?? 30,
    precio: num(formData, "precio"),
    activo: formData.get("activo") !== "off",
  };
  if (!datos.nombre) volver("/panel/servicios", "error", "Escribe el nombre de la prestación.");
  const { error } = servicioId
    ? await supabase.from("servicios").update(datos).eq("id", servicioId).eq("profesional_id", id)
    : await supabase.from("servicios").insert({ ...datos, profesional_id: id });
  if (error) volver("/panel/servicios", "error", mensajeError(error));
  revalidatePath("/panel/servicios");
  volver("/panel/servicios", "ok", "Prestación guardada.");
}

export async function alternarServicio(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const { error } = await supabase
    .from("servicios")
    .update({ activo: formData.get("activo") === "true" })
    .eq("id", String(formData.get("id")))
    .eq("profesional_id", id);
  if (error) volver("/panel/servicios", "error", mensajeError(error));
  revalidatePath("/panel/servicios");
  volver("/panel/servicios", "ok", "Prestación actualizada.");
}

// Horarios y bloqueos -----------------------------------------------------------
export async function agregarHorario(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const dias = formData.getAll("dia").map(Number).filter((d) => d >= 0 && d <= 6);
  const inicio = String(formData.get("hora_inicio") ?? "");
  const fin = String(formData.get("hora_fin") ?? "");
  if (dias.length === 0) volver("/panel/horarios", "error", "Elige al menos un día.");
  if (!inicio || !fin || fin <= inicio) volver("/panel/horarios", "error", "La hora de término debe ser posterior a la de inicio.");
  const { data: existentes } = await supabase.from("horarios").select("dia_semana, hora_inicio, hora_fin").eq("profesional_id", id).in("dia_semana", dias);
  const choca = (existentes ?? []).some((h) => h.hora_inicio.slice(0, 5) < fin && h.hora_fin.slice(0, 5) > inicio);
  if (choca) volver("/panel/horarios", "error", "Ese bloque se cruza con un horario que ya tienes ese día.");
  const { error } = await supabase
    .from("horarios")
    .insert(dias.map((d) => ({ profesional_id: id, dia_semana: d, hora_inicio: inicio, hora_fin: fin })));
  if (error) volver("/panel/horarios", "error", mensajeError(error));
  revalidatePath("/panel/horarios");
  volver("/panel/horarios", "ok", "Horario agregado.");
}

export async function eliminarHorario(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  await supabase.from("horarios").delete().eq("id", String(formData.get("id"))).eq("profesional_id", id);
  revalidatePath("/panel/horarios");
  volver("/panel/horarios", "ok", "Horario eliminado. Las citas ya reservadas se mantienen.");
}

export async function agregarBloqueo(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const desde = String(formData.get("desde") ?? "");
  const hasta = String(formData.get("hasta") ?? "") || desde;
  if (!desde || hasta < desde) volver("/panel/horarios", "error", "Revisa las fechas del bloqueo.");
  // Días completos, de 00:00 de "desde" a 00:00 del día siguiente a "hasta", hora de Chile
  const [a, m, d] = hasta.split("-").map(Number);
  const siguiente = new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
  const { error } = await supabase.from("bloqueos").insert({
    profesional_id: id,
    inicio: inicioDiaChile(desde).toISOString(),
    fin: inicioDiaChile(siguiente).toISOString(),
    motivo: txt(formData, "motivo"),
  });
  if (error) volver("/panel/horarios", "error", mensajeError(error));
  revalidatePath("/panel/horarios");
  volver("/panel/horarios", "ok", "Días bloqueados. Las citas ya reservadas esos días no se cancelan solas: revísalas en tu agenda.");
}

export async function eliminarBloqueo(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  await supabase.from("bloqueos").delete().eq("id", String(formData.get("id"))).eq("profesional_id", id);
  revalidatePath("/panel/horarios");
  volver("/panel/horarios", "ok", "Bloqueo eliminado.");
}

// Agenda ------------------------------------------------------------------------
export async function marcarCita(formData: FormData) {
  const { supabase } = await requerirProfesional();
  const ruta = rutaSegura(formData.get("volver"), "/panel");
  const estado = String(formData.get("estado"));
  const { error } = await supabase.rpc("marcar_cita", { p_cita: String(formData.get("cita")), p_estado: estado });
  if (error) volver(ruta, "error", mensajeError(error));
  revalidatePath("/panel");
  volver(ruta, "ok", estado === "completada" ? "Cita marcada como atendida." : estado === "no_asistio" ? "Cita marcada como inasistencia." : "Cita actualizada.");
}

// Fichas y atenciones (CU-07, CU-08) ---------------------------------------------
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function moduloProfesional(supabase: Awaited<ReturnType<typeof requerirProfesional>>["supabase"], id: string) {
  const { data } = await supabase.from("profesionales").select("especialidad:especialidades(slug)").eq("id", id).single();
  return moduloDe((data?.especialidad as unknown as { slug: string } | null)?.slug);
}

export async function guardarFicha(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const paciente = String(formData.get("paciente") ?? "");
  if (!UUID.test(paciente)) volver("/panel/pacientes", "error", "Paciente no válido.");
  const ruta = `/panel/pacientes/${paciente}`;
  const modulo = await moduloProfesional(supabase, id);
  const leido = leerCampos(modulo.ficha, formData, "esp_");
  if ("error" in leido) volver(ruta, "error", leido.error);

  // Se conservan los datos de otros módulos (por ejemplo, si cambió de especialidad).
  const { data: actual } = await supabase
    .from("fichas")
    .select("datos_especialidad")
    .eq("profesional_id", id)
    .eq("paciente_id", paciente)
    .maybeSingle();
  const previos = (actual?.datos_especialidad ?? {}) as Record<string, unknown>;
  const datos = {
    antecedentes: txt(formData, "antecedentes")?.slice(0, 4000) ?? null,
    alergias: txt(formData, "alergias")?.slice(0, 1000) ?? null,
    medicamentos: txt(formData, "medicamentos")?.slice(0, 1000) ?? null,
    diagnostico: txt(formData, "diagnostico")?.slice(0, 4000) ?? null,
    tratamiento: txt(formData, "tratamiento")?.slice(0, 4000) ?? null,
    observaciones: txt(formData, "observaciones")?.slice(0, 4000) ?? null,
    datos_especialidad: { ...previos, [modulo.slug]: leido.datos },
  };
  const { error } = await supabase
    .from("fichas")
    .upsert({ profesional_id: id, paciente_id: paciente, ...datos }, { onConflict: "profesional_id,paciente_id" });
  if (error) volver(ruta, "error", mensajeError(error));
  revalidatePath(ruta);
  volver(ruta, "ok", "Ficha guardada.");
}

export async function registrarAtencion(formData: FormData) {
  const { id, supabase } = await requerirProfesional();
  const paciente = String(formData.get("paciente") ?? "");
  if (!UUID.test(paciente)) volver("/panel/pacientes", "error", "Paciente no válido.");
  const ruta = `/panel/pacientes/${paciente}`;
  const modulo = await moduloProfesional(supabase, id);
  const leido = leerCampos(modulo.atencion, formData, "at_");
  if ("error" in leido) volver(ruta, "error", leido.error);

  // La cita, si viene, debe ser de esta profesional y de esta paciente.
  const citaId = txt(formData, "cita");
  if (citaId) {
    const { data: cita } = await supabase
      .from("citas")
      .select("id")
      .eq("id", UUID.test(citaId) ? citaId : "00000000-0000-0000-0000-000000000000")
      .eq("profesional_id", id)
      .eq("paciente_id", paciente)
      .maybeSingle();
    if (!cita) volver(ruta, "error", "La cita no corresponde a esta paciente.");
  }

  // La ficha debe existir: se crea vacía si hace falta
  let { data: ficha } = await supabase.from("fichas").select("id").eq("profesional_id", id).eq("paciente_id", paciente).maybeSingle();
  if (!ficha) {
    const r = await supabase.from("fichas").insert({ profesional_id: id, paciente_id: paciente }).select("id").single();
    if (r.error) volver(ruta, "error", mensajeError(r.error));
    ficha = r.data;
  }
  const { error } = await supabase.from("atenciones").insert({
    ficha_id: ficha!.id,
    profesional_id: id,
    paciente_id: paciente,
    cita_id: citaId,
    motivo: txt(formData, "motivo")?.slice(0, 300) ?? null,
    diagnostico: txt(formData, "diagnostico")?.slice(0, 4000) ?? null,
    indicaciones: txt(formData, "indicaciones")?.slice(0, 4000) ?? null,
    notas: txt(formData, "notas")?.slice(0, 8000) ?? null,
    datos_especialidad: Object.keys(leido.datos).length ? { [modulo.slug]: leido.datos } : {},
  });
  if (error) volver(ruta, "error", mensajeError(error));
  if (citaId) await supabase.rpc("marcar_cita", { p_cita: citaId, p_estado: "completada" });
  revalidatePath(ruta);
  revalidatePath("/panel");
  volver(ruta, "ok", "Atención registrada en el historial.");
}
