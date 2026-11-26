import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { formatoFechaHora } from "@/lib/fechas";

export type TipoAviso = "confirmacion" | "cancelacion" | "reprogramacion" | "recordatorio";

type Email = { para: string; asunto: string; html: string };

const SITIO = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function enviar({ para, asunto, html }: Email): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.info(`[email simulado] a ${para}: ${asunto}`);
    return { ok: true };
  }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM ?? "Agenda Salud <onboarding@resend.dev>",
        to: [para],
        subject: asunto,
        html,
      }),
    });
    if (!r.ok) return { ok: false, error: `${r.status} ${await r.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

function plantilla(titulo: string, cuerpo: string, enlace?: { texto: string; url: string }) {
  const boton = enlace
    ? `<p style="margin:24px 0"><a href="${enlace.url}" style="background:#0f766e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none">${enlace.texto}</a></p>`
    : "";
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#1f2937">
  <h2 style="color:#0f766e">${titulo}</h2>${cuerpo}${boton}
  <p style="color:#6b7280;font-size:12px">Agenda Salud · Este es un mensaje automático.</p></div>`;
}

const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type CitaAviso = {
  id: string;
  inicio: string;
  paciente: { nombre: string; email: string | null } | null;
  profesional: { perfil: { nombre: string; email: string | null } | null; direccion: string | null; comuna: string | null } | null;
  servicio: { nombre: string } | null;
};

const SELECT_CITA =
  "id, inicio, paciente:perfiles!citas_paciente_id_fkey(nombre, email), profesional:profesionales(direccion, comuna, perfil:perfiles!profesionales_id_fkey(nombre, email)), servicio:servicios(nombre)";

export async function cargarCitaAviso(supabase: SupabaseClient, citaId: string) {
  const { data } = await supabase.from("citas").select(SELECT_CITA).eq("id", citaId).single();
  return data as unknown as CitaAviso | null;
}

function correos(c: CitaAviso, tipo: TipoAviso): Email[] {
  const cuando = formatoFechaHora(c.inicio);
  const pro = c.profesional?.perfil?.nombre ?? "tu profesional";
  const pac = c.paciente?.nombre ?? "Paciente";
  const servicio = c.servicio?.nombre ?? "Atención";
  const lugar = [c.profesional?.direccion, c.profesional?.comuna].filter(Boolean).join(", ");
  const detalle = `<p><b>${esc(servicio)}</b> con ${esc(pro)}<br>${esc(cuando)}${lugar ? `<br>${esc(lugar)}` : ""}</p>`;
  const lista: Email[] = [];
  const paraPaciente = c.paciente?.email;
  const paraPro = c.profesional?.perfil?.email;
  const enlacePac = { texto: "Ver mis citas", url: `${SITIO}/mis-citas` };
  const enlacePro = { texto: "Ver mi agenda", url: `${SITIO}/panel` };

  if (tipo === "confirmacion") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Cita confirmada: ${cuando}`, html: plantilla("Tu cita está confirmada", `<p>Hola ${esc(pac)},</p>${detalle}`, enlacePac) });
    if (paraPro)
      lista.push({ para: paraPro, asunto: `Nueva reserva: ${pac}, ${cuando}`, html: plantilla("Tienes una nueva reserva", `<p>${esc(pac)} reservó:</p>${detalle}`, enlacePro) });
  } else if (tipo === "cancelacion") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Cita cancelada: ${cuando}`, html: plantilla("Tu cita fue cancelada", `<p>Hola ${esc(pac)}, esta cita quedó cancelada:</p>${detalle}`, { texto: "Reservar otra hora", url: `${SITIO}/profesionales` }) });
    if (paraPro)
      lista.push({ para: paraPro, asunto: `Cita cancelada: ${pac}, ${cuando}`, html: plantilla("Se canceló una cita", `<p>La cita de ${esc(pac)} quedó cancelada:</p>${detalle}`, enlacePro) });
  } else if (tipo === "reprogramacion") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Cita cambiada: ${cuando}`, html: plantilla("Tu cita cambió de hora", `<p>Hola ${esc(pac)}, la nueva hora es:</p>${detalle}`, enlacePac) });
    if (paraPro)
      lista.push({ para: paraPro, asunto: `Cita cambiada: ${pac}, ${cuando}`, html: plantilla("Una cita cambió de hora", `<p>${esc(pac)} tiene nueva hora:</p>${detalle}`, enlacePro) });
  } else if (tipo === "recordatorio") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Recordatorio: tu cita es mañana`, html: plantilla("Te recordamos tu cita", `<p>Hola ${esc(pac)},</p>${detalle}<p>Si no puedes asistir, cancela o cambia la hora con anticipación.</p>`, enlacePac) });
  }
  return lista;
}

/** Envía los avisos de una cita y deja registro. Nunca lanza error. */
export async function avisarCita(supabase: SupabaseClient, citaId: string, tipo: TipoAviso) {
  try {
    const cita = await cargarCitaAviso(supabase, citaId);
    if (!cita) return;
    await enviarAvisos(cita, tipo);
  } catch (e) {
    console.error("No se pudo enviar el aviso", e);
  }
}

export async function enviarAvisos(cita: CitaAviso, tipo: TipoAviso) {
  const admin = crearClienteAdmin();
  let todosOk = true;
  for (const email of correos(cita, tipo)) {
    const r = await enviar(email);
    todosOk &&= r.ok;
    if (!r.ok) console.error(`Email ${tipo} a ${email.para} falló: ${r.error}`);
    await admin?.from("notificaciones").insert({
      cita_id: cita.id,
      destinatario: email.para,
      tipo,
      ok: r.ok,
      error: r.error ?? null,
    });
  }
  return todosOk;
}

export { SELECT_CITA };
export type { CitaAviso };
