import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso, EstadoCita } from "@/components/aviso";
import { formatoFechaCorta, formatoFechaHora, hoyChile } from "@/lib/fechas";
import { requerirProfesional } from "@/lib/sesion";
import { guardarFicha, registrarAtencion } from "../../acciones";

export const metadata = { title: "Ficha clínica" };

type Ficha = Record<string, string | number | null>;

function edad(nacimiento: string | null) {
  if (!nacimiento) return null;
  const [a, m, d] = nacimiento.split("-").map(Number);
  const [ha, hm, hd] = hoyChile().split("-").map(Number);
  return ha - a - (hm < m || (hm === m && hd < d) ? 1 : 0);
}

/** Semanas de gestación según FUR (regla de Naegele) */
function edadGestacional(fur: string | null | undefined) {
  if (!fur) return null;
  const dias = Math.floor((Date.parse(hoyChile()) - Date.parse(fur)) / 86_400_000);
  if (dias < 0 || dias > 300) return null;
  const fpp = new Date(Date.parse(fur) + 280 * 86_400_000).toISOString().slice(0, 10);
  return { semanas: Math.floor(dias / 7), dias: dias % 7, fpp };
}

function Texto({ name, label, f, rows = 2 }: { name: string; label: string; f: Ficha | null; rows?: number }) {
  return (
    <div>
      <label className="etiqueta" htmlFor={name}>{label}</label>
      <textarea className="campo" id={name} name={name} rows={rows} defaultValue={(f?.[name] as string) ?? ""} />
    </div>
  );
}

function Numero({ name, label, f }: { name: string; label: string; f: Ficha | null }) {
  return (
    <div>
      <label className="etiqueta" htmlFor={name}>{label}</label>
      <input className="campo" id={name} name={name} type="number" min={0} max={30} defaultValue={(f?.[name] as number) ?? ""} />
    </div>
  );
}

export default async function FichaPaciente({ params, searchParams }: PageProps<"/panel/pacientes/[id]">) {
  const { id: pacienteId } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(pacienteId)) notFound();
  const { id, supabase } = await requerirProfesional();

  const [{ data: paciente }, { data: ficha }, { data: atenciones }, { data: citas }] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, email, rut, telefono, fecha_nacimiento").eq("id", pacienteId).maybeSingle(),
    supabase.from("fichas").select("*").eq("profesional_id", id).eq("paciente_id", pacienteId).maybeSingle(),
    supabase.from("atenciones").select("*").eq("profesional_id", id).eq("paciente_id", pacienteId).order("fecha", { ascending: false }),
    supabase.from("citas").select("id, inicio, estado, servicio:servicios(nombre)").eq("profesional_id", id).eq("paciente_id", pacienteId).order("inicio", { ascending: false }),
  ]);
  if (!paciente || !citas?.length) notFound();

  const f = ficha as Ficha | null;
  const eg = edadGestacional(f?.fur as string | null);
  const citaActual = typeof sp.cita === "string" ? citas.find((c) => c.id === sp.cita) : undefined;
  const años = edad(paciente.fecha_nacimiento);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/pacientes" className="enlace text-sm">← Pacientes</Link>
        <h1 className="titulo mt-2">{paciente.nombre}</h1>
        <p className="text-sm text-slate-600">
          {[paciente.rut, años != null ? `${años} años` : null, paciente.telefono, paciente.email].filter(Boolean).join(" · ")}
        </p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <section className="tarjeta">
            <h2 className="mb-1 font-semibold">Registrar atención</h2>
            <p className="mb-4 text-sm text-slate-600">
              {citaActual ? <>Cita del <span className="capitalize">{formatoFechaHora(citaActual.inicio)}</span>. Al guardar se marca como atendida.</> : "Queda en el historial con la fecha de hoy."}
            </p>
            <form action={registrarAtencion} className="space-y-3">
              <input type="hidden" name="paciente" value={pacienteId} />
              {citaActual && <input type="hidden" name="cita" value={citaActual.id} />}
              <div>
                <label className="etiqueta" htmlFor="motivo">Motivo de consulta</label>
                <input className="campo" id="motivo" name="motivo" defaultValue={(citaActual?.servicio as unknown as { nombre: string } | null)?.nombre ?? ""} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="at_diagnostico">Diagnóstico</label>
                <textarea className="campo" id="at_diagnostico" name="diagnostico" rows={2} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="indicaciones">Indicaciones</label>
                <textarea className="campo" id="indicaciones" name="indicaciones" rows={2} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="notas">Notas de evolución</label>
                <textarea className="campo" id="notas" name="notas" rows={3} />
              </div>
              <button className="btn">Guardar atención</button>
            </form>
          </section>

          <section>
            <h2 className="mb-3 font-semibold">Historial de atenciones</h2>
            {(atenciones ?? []).length === 0 ? (
              <p className="tarjeta text-sm text-slate-600">Todavía no hay atenciones registradas.</p>
            ) : (
              <ol className="space-y-3 border-l-2 border-marca-100 pl-4">
                {atenciones!.map((a) => (
                  <li key={a.id} className="tarjeta relative text-sm">
                    <span className="absolute top-6 -left-[23px] h-3 w-3 rounded-full border-2 border-white bg-marca-600" />
                    <p className="font-medium capitalize">{formatoFechaHora(a.fecha)}{a.motivo ? ` · ${a.motivo}` : ""}</p>
                    {a.diagnostico && <p className="mt-2"><span className="text-slate-500">Diagnóstico:</span> {a.diagnostico}</p>}
                    {a.indicaciones && <p className="mt-1 whitespace-pre-line"><span className="text-slate-500">Indicaciones:</span> {a.indicaciones}</p>}
                    {a.notas && <p className="mt-1 whitespace-pre-line text-slate-700">{a.notas}</p>}
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <form action={guardarFicha} className="tarjeta space-y-4">
            <input type="hidden" name="paciente" value={pacienteId} />
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Ficha clínica</h2>
              {ficha && <span className="text-xs text-slate-500">Actualizada {formatoFechaCorta(ficha.actualizado_en)}</span>}
            </div>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-marca-700">Gineco-obstétrico</legend>
              <div className="grid grid-cols-4 gap-2">
                <Numero name="gestas" label="G" f={f} />
                <Numero name="partos" label="P" f={f} />
                <Numero name="abortos" label="A" f={f} />
                <Numero name="cesareas" label="C" f={f} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="etiqueta" htmlFor="fur">FUR</label>
                  <input className="campo" id="fur" name="fur" type="date" defaultValue={(f?.fur as string) ?? ""} />
                </div>
                <div>
                  <label className="etiqueta" htmlFor="ultimo_pap">Último PAP</label>
                  <input className="campo" id="ultimo_pap" name="ultimo_pap" type="date" defaultValue={(f?.ultimo_pap as string) ?? ""} />
                </div>
              </div>
              {eg && (
                <p className="rounded-lg bg-marca-50 px-3 py-2 text-sm text-marca-800">
                  Edad gestacional: <b>{eg.semanas}+{eg.dias} semanas</b> · FPP {formatoFechaCorta(eg.fpp + "T12:00:00")}
                </p>
              )}
              <div>
                <label className="etiqueta" htmlFor="metodo_anticonceptivo">Método anticonceptivo</label>
                <input className="campo" id="metodo_anticonceptivo" name="metodo_anticonceptivo" defaultValue={(f?.metodo_anticonceptivo as string) ?? ""} />
              </div>
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-marca-700">Antecedentes</legend>
              <Texto name="antecedentes" label="Antecedentes mórbidos y quirúrgicos" f={f} />
              <Texto name="alergias" label="Alergias" f={f} rows={1} />
              <Texto name="medicamentos" label="Medicamentos en uso" f={f} rows={1} />
            </fieldset>
            <fieldset className="space-y-3">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-marca-700">Estado actual</legend>
              <Texto name="diagnostico" label="Diagnóstico" f={f} />
              <Texto name="tratamiento" label="Tratamiento" f={f} />
              <Texto name="observaciones" label="Observaciones" f={f} />
            </fieldset>
            <button className="btn">Guardar ficha</button>
          </form>

          <section className="tarjeta">
            <h2 className="mb-3 font-semibold">Citas</h2>
            <ul className="space-y-2 text-sm">
              {citas.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-2">
                  <span className="capitalize">{formatoFechaCorta(c.inicio)} · {(c.servicio as unknown as { nombre: string } | null)?.nombre}</span>
                  <EstadoCita estado={c.estado} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
