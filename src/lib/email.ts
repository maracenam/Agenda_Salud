import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { formatoFechaHora } from "@/lib/fechas";

export type TipoAviso = "confirmacion" | "cancelacion" | "reprogramacion" | "recordatorio";

type Email = { para: string; asunto: string; html: string };

const SITIO =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

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

export function plantilla(titulo: string, cuerpo: string, enlace?: { texto: string; url: string }) {
  const boton = enlace
    ? `<p style="margin:24px 0"><a href="${enlace.url}" style="display:inline-block;background:#6b2f5e;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${enlace.texto}</a></p>`
    : "";
  return `<div style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;margin:auto;color:#1e1520;font-size:16px;line-height:1.5">
  <p style="margin:0 0 20px;font-weight:800;font-size:17px;color:#2b1027">Agenda Salud</p>
  <h2 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#1e1520">${titulo}</h2>${cuerpo}${boton}
  <p style="margin-top:32px;border-top:1px solid #e4dfe5;padding-top:12px;color:#6b6070;font-size:13px">Mensaje automático de Agenda Salud. Si no reservaste esta hora, puedes ignorarlo.</p></div>`;
}

export const esc = (s: string | null | undefined) =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Un asunto de correo no puede llevar saltos de línea (inyección de cabeceras). */
export const limpiarAsunto = (s: string) => s.replace(/[\r\n\t]+/g, " ").slice(0, 120);

type CitaAviso = {
  id: string;
  inicio: string;
  paciente: { nombre: string; email: string | null } | null;
  profesional: {
    nombre: string;
    perfil: { email: string | null } | null;
    direccion: string | null;
    comuna: string | null;
    especialidad: { nombre: string } | null;
  } | null;
  servicio: { nombre: string } | null;
};

const SELECT_CITA =
  "id, inicio, paciente:perfiles!citas_paciente_id_fkey(nombre, email), profesional:profesionales(nombre, direccion, comuna, especialidad:especialidades(nombre), perfil:perfiles!profesionales_id_fkey(email)), servicio:servicios(nombre)";

/**
 * Carga los datos de la cita para el aviso. Primero comprueba con la sesión de quien
 * actúa que la cita es suya (RLS); luego lee los correos con el cliente de servidor,
 * porque una paciente no puede ver el correo de su profesional ni al revés.
 */
export async function cargarCitaAviso(supabase: SupabaseClient, citaId: string) {
  const { data: propia } = await supabase.from("citas").select("id").eq("id", citaId).maybeSingle();
  if (!propia) return null;
  const cliente = crearClienteAdmin() ?? supabase;
  const { data } = await cliente.from("citas").select(SELECT_CITA).eq("id", citaId).single();
  return data as unknown as CitaAviso | null;
}

export function correos(c: CitaAviso, tipo: TipoAviso): Email[] {
  const cuando = formatoFechaHora(c.inicio);
  const pro = c.profesional?.nombre ?? "tu profesional";
  const especialidad = c.profesional?.especialidad?.nombre;
  const pac = c.paciente?.nombre ?? "Paciente";
  const servicio = c.servicio?.nombre ?? "Atención";
  const lugar = [c.profesional?.direccion, c.profesional?.comuna].filter(Boolean).join(", ");
  const detalle = `<p><b>${esc(servicio)}</b> con ${esc(pro)}${especialidad ? ` (${esc(especialidad)})` : ""}<br>${esc(cuando)}${lugar ? `<br>${esc(lugar)}` : ""}</p>`;
  const lista: Email[] = [];
  const paraPaciente = c.paciente?.email;
  const paraPro = c.profesional?.perfil?.email;
  const enlacePac = { texto: "Ver mis citas", url: `${SITIO}/mis-citas` };
  const enlacePro = { texto: "Ver mi agenda", url: `${SITIO}/panel` };

  if (tipo === "confirmacion") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Cita confirmada: ${cuando}`, html: plantilla("Tu cita está confirmada", `<p>Hola ${esc(pac)},</p>${detalle}`, enlacePac) });
    if (paraPro)
      lista.push({ para: paraPro, asunto: `Nueva reserva: ${limpiarAsunto(pac)}, ${cuando}`, html: plantilla("Tienes una nueva reserva", `<p>${esc(pac)} reservó:</p>${detalle}`, enlacePro) });
  } else if (tipo === "cancelacion") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Cita cancelada: ${cuando}`, html: plantilla("Tu cita fue cancelada", `<p>Hola ${esc(pac)}, esta cita quedó cancelada:</p>${detalle}`, { texto: "Reservar otra hora", url: `${SITIO}/profesionales` }) });
    if (paraPro)
      lista.push({ para: paraPro, asunto: `Cita cancelada: ${limpiarAsunto(pac)}, ${cuando}`, html: plantilla("Se canceló una cita", `<p>La cita de ${esc(pac)} quedó cancelada:</p>${detalle}`, enlacePro) });
  } else if (tipo === "reprogramacion") {
    if (paraPaciente)
      lista.push({ para: paraPaciente, asunto: `Cita cambiada: ${cuando}`, html: plantilla("Tu cita cambió de hora", `<p>Hola ${esc(pac)}, la nueva hora es:</p>${detalle}`, enlacePac) });
    if (paraPro)
      lista.push({ para: paraPro, asunto: `Cita cambiada: ${limpiarAsunto(pac)}, ${cuando}`, html: plantilla("Una cita cambió de hora", `<p>${esc(pac)} tiene nueva hora:</p>${detalle}`, enlacePro) });
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

type DerivacionAviso = {
  id: string;
  motivo: string;
  paciente: { nombre: string; email: string | null } | null;
  de: { nombre: string } | null;
  a: { id: string; nombre: string; especialidad: { nombre: string } | null; perfil: { email: string | null } | null } | null;
};

/** CU-11: avisa a la paciente y a la colega que recibe una derivación. Nunca lanza error. */
export async function avisarDerivacion(supabase: SupabaseClient, derivacionId: string) {
  try {
    const { data: propia } = await supabase.from("derivaciones").select("id").eq("id", derivacionId).maybeSingle();
    if (!propia) return;
    const cliente = crearClienteAdmin() ?? supabase;
    const { data } = await cliente
      .from("derivaciones")
      .select(
        "id, motivo, paciente:perfiles!derivaciones_paciente_id_fkey(nombre, email), de:profesionales!derivaciones_de_profesional_fkey(nombre), a:profesionales!derivaciones_a_profesional_fkey(id, nombre, especialidad:especialidades(nombre), perfil:perfiles!profesionales_id_fkey(email))",
      )
      .eq("id", derivacionId)
      .single();
    const d = data as unknown as DerivacionAviso | null;
    if (!d) return;
    for (const email of correosDerivacion(d)) {
      const r = await enviar(email);
      if (!r.ok) console.error(`Email derivación a ${email.para} falló: ${r.error}`);
    }
  } catch (e) {
    console.error("No se pudo enviar el aviso de derivación", e);
  }
}

export function correosDerivacion(d: DerivacionAviso): Email[] {
  const lista: Email[] = [];
  const pac = d.paciente?.nombre ?? "Paciente";
  const de = d.de?.nombre ?? "Tu profesional";
  const a = d.a?.nombre ?? "una colega";
  const esp = d.a?.especialidad?.nombre;
  if (d.paciente?.email)
    lista.push({
      para: d.paciente.email,
      asunto: `${limpiarAsunto(de)} te derivó a ${limpiarAsunto(a)}`,
      html: plantilla(
        "Te derivaron a una colega",
        `<p>Hola ${esc(pac)},</p><p>${esc(de)} te recomienda atenderte con <b>${esc(a)}</b>${esp ? ` (${esc(esp)})` : ""}.</p><p>Motivo: ${esc(d.motivo)}</p>`,
        { texto: "Reservar hora", url: `${SITIO}/profesionales/${d.a?.id ?? ""}` },
      ),
    });
  if (d.a?.perfil?.email)
    lista.push({
      para: d.a.perfil.email,
      asunto: `Nueva derivación de ${limpiarAsunto(de)}`,
      html: plantilla("Recibiste una derivación", `<p>${esc(de)} te derivó a ${esc(pac)}.</p><p>Motivo: ${esc(d.motivo)}</p>`, {
        texto: "Ver derivaciones",
        url: `${SITIO}/panel/derivaciones`,
      }),
    });
  return lista;
}
export type { DerivacionAviso };
