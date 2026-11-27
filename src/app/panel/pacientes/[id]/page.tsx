import Link from "next/link";
import { Ficha, FlechaAtras } from "@/components/marca";
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
  const iniciales = paciente.nombre.split(" ").filter(Boolean).slice(0, 2).map((x: string) => x[0]).join("").toUpperCase();
  const alergias = typeof f?.alergias === "string" && f.alergias.trim() ? f.alergias.trim() : null;
  const pap = typeof f?.ultimo_pap === "string" ? f.ultimo_pap : null;
  const mesesPap = pap ? Math.floor((Date.parse(hoyChile()) - Date.parse(pap)) / (86_400_000 * 30.44)) : null;
  const n = (k: string) => (f?.[k] != null && f[k] !== "" ? String(f[k]) : "–");
  const nombreServicio = (c: (typeof citas)[number]) => (c.servicio as unknown as { nombre: string } | null)?.nombre;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/panel/pacientes" className="enlace inline-flex items-center gap-1 text-[15px]"><FlechaAtras className="size-4" />Pacientes</Link>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <span className="insignia size-14 text-lg">{iniciales}</span>
          <div className="min-w-0">
            <h1 className="titulo">{paciente.nombre}</h1>
            <dl className="mt-1 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-slate-600">
              {paciente.rut && <div className="flex gap-1.5"><dt className="sr-only">RUT</dt><dd>{paciente.rut}</dd></div>}
              {años != null && <div className="flex gap-1.5"><dt className="sr-only">Edad</dt><dd>{años} años</dd></div>}
              {paciente.telefono && <div className="flex gap-1.5"><dt className="sr-only">Teléfono</dt><dd><a className="hover:text-tinta hover:underline" href={`tel:${paciente.telefono.replace(/\s/g, "")}`}>{paciente.telefono}</a></dd></div>}
              {paciente.email && <div className="flex gap-1.5"><dt className="sr-only">Correo</dt><dd><a className="hover:text-tinta hover:underline" href={`mailto:${paciente.email}`}>{paciente.email}</a></dd></div>}
            </dl>
          </div>
        </div>
      </div>

      {/* Resumen clínico: lo que la matrona mira antes de saludar. */}
      <section aria-label="Resumen clínico" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
        <div className="border-b border-slate-200 p-5 sm:border-r lg:border-b-0">
          <p className="text-sm font-semibold text-slate-600">Fórmula obstétrica</p>
          <p className="cifra mt-2 flex gap-3 text-2xl">
            {(["gestas", "partos", "abortos", "cesareas"] as const).map((k) => (
              <span key={k}><span className="text-slate-500">{k[0].toUpperCase()}</span>{n(k)}</span>
            ))}
          </p>
        </div>
        <div className="border-b border-slate-200 p-5 lg:border-r lg:border-b-0">
          <p className="text-sm font-semibold text-slate-600">Edad gestacional</p>
          {eg ? (
            <>
              <p className="cifra mt-2 text-2xl text-marca-700">{eg.semanas}+{eg.dias} <span className="text-base font-medium text-slate-600">semanas</span></p>
              <p className="mt-0.5 text-sm text-slate-600">Parto probable el {formatoFechaCorta(eg.fpp + "T12:00:00")}</p>
            </>
          ) : (
            <p className="mt-2 text-[15px] text-slate-500">Sin FUR registrada</p>
          )}
        </div>
        <div className="border-b border-slate-200 p-5 sm:border-r sm:border-b-0">
          <p className="text-sm font-semibold text-slate-600">Último PAP</p>
          {pap ? (
            <>
              <p className="cifra mt-2 text-2xl">{formatoFechaCorta(pap + "T12:00:00")}</p>
              <p className={`mt-0.5 text-sm ${mesesPap != null && mesesPap >= 12 ? "font-semibold text-alerta" : "text-slate-600"}`}>
                {mesesPap != null && mesesPap >= 12 ? `Hace ${mesesPap} meses, toca repetirlo` : mesesPap === 0 ? "Este mes" : `Hace ${mesesPap} ${mesesPap === 1 ? "mes" : "meses"}`}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[15px] text-slate-500">Sin registro</p>
          )}
        </div>
        <div className={`p-5 ${alergias ? "bg-alerta-claro" : ""}`}>
          <p className={`text-sm font-semibold ${alergias ? "text-alerta" : "text-slate-600"}`}>Alergias</p>
          <p className={`mt-2 text-lg leading-snug font-bold ${alergias ? "text-[#5c2d07]" : "font-medium text-slate-500"}`}>{alergias ?? "No registradas"}</p>
        </div>
      </section>

      <Aviso error={sp.error} ok={sp.ok} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_25rem]">
        <div className="space-y-8">
          <section className={`rounded-xl border bg-white ${citaActual ? "border-marca-600 ring-3 ring-marca-100" : "border-slate-200"}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <h2 className="subtitulo">Registrar atención</h2>
              <p className="text-sm text-slate-600">
                {citaActual ? <>Cita del <span className="mayus inline">{formatoFechaHora(citaActual.inicio)}</span></> : "Con fecha de hoy"}
              </p>
            </div>
            <form action={registrarAtencion} className="grid gap-4 p-5 sm:grid-cols-2">
              <input type="hidden" name="paciente" value={pacienteId} />
              {citaActual && <input type="hidden" name="cita" value={citaActual.id} />}
              <div className="sm:col-span-2">
                <label className="etiqueta" htmlFor="motivo">Motivo de consulta</label>
                <input className="campo" id="motivo" name="motivo" defaultValue={citaActual ? nombreServicio(citaActual) ?? "" : ""} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="at_diagnostico">Diagnóstico</label>
                <textarea className="campo" id="at_diagnostico" name="diagnostico" rows={3} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="indicaciones">Indicaciones</label>
                <textarea className="campo" id="indicaciones" name="indicaciones" rows={3} />
              </div>
              <div className="sm:col-span-2">
                <label className="etiqueta" htmlFor="notas">Notas de evolución</label>
                <textarea className="campo" id="notas" name="notas" rows={4} />
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                <button className="btn">Guardar atención</button>
                {citaActual && <p className="text-sm text-slate-600">La cita quedará marcada como atendida.</p>}
              </div>
            </form>
          </section>

          <section>
            <h2 className="subtitulo">Historial de atenciones</h2>
            {(atenciones ?? []).length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-[15px] text-slate-600">
                Aún no hay atenciones. La primera que guardes aparecerá aquí con su fecha.
              </p>
            ) : (
              <ol className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
                {atenciones!.map((a) => (
                  <li key={a.id} className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
                    <div>
                      <p className="mayus font-semibold">{formatoFechaCorta(a.fecha)}</p>
                      {a.motivo && <p className="text-sm text-slate-600">{a.motivo}</p>}
                    </div>
                    <dl className="space-y-2 text-[15px]">
                      {a.diagnostico && <div><dt className="text-sm font-semibold text-slate-600">Diagnóstico</dt><dd>{a.diagnostico}</dd></div>}
                      {a.indicaciones && <div><dt className="text-sm font-semibold text-slate-600">Indicaciones</dt><dd className="whitespace-pre-line">{a.indicaciones}</dd></div>}
                      {a.notas && <div><dt className="text-sm font-semibold text-slate-600">Evolución</dt><dd className="whitespace-pre-line text-slate-700">{a.notas}</dd></div>}
                    </dl>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <form action={guardarFicha} className="rounded-xl border border-slate-200 bg-white">
            <input type="hidden" name="paciente" value={pacienteId} />
            <div className="flex items-baseline justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <h2 className="subtitulo flex items-center gap-2 self-center"><Ficha className="size-5 text-marca-700" />Ficha clínica</h2>
              {ficha && <span className="text-sm text-slate-600">Al día el {formatoFechaCorta(ficha.actualizado_en)}</span>}
            </div>
            <div className="space-y-6 p-5">
              <fieldset className="space-y-3">
                <legend className="mb-3 font-bold text-marca-800">Gineco-obstétrico</legend>
                <div className="grid grid-cols-4 gap-2">
                  <Numero name="gestas" label="Gestas" f={f} />
                  <Numero name="partos" label="Partos" f={f} />
                  <Numero name="abortos" label="Abortos" f={f} />
                  <Numero name="cesareas" label="Cesáreas" f={f} />
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
                <div>
                  <label className="etiqueta" htmlFor="metodo_anticonceptivo">Método anticonceptivo</label>
                  <input className="campo" id="metodo_anticonceptivo" name="metodo_anticonceptivo" defaultValue={(f?.metodo_anticonceptivo as string) ?? ""} />
                </div>
              </fieldset>
              <fieldset className="space-y-3 border-t border-slate-200 pt-5">
                <legend className="float-left mb-3 w-full font-bold text-marca-800">Antecedentes</legend>
                <Texto name="antecedentes" label="Mórbidos y quirúrgicos" f={f} />
                <Texto name="alergias" label="Alergias" f={f} rows={1} />
                <Texto name="medicamentos" label="Medicamentos en uso" f={f} rows={1} />
              </fieldset>
              <fieldset className="space-y-3 border-t border-slate-200 pt-5">
                <legend className="float-left mb-3 w-full font-bold text-marca-800">Estado actual</legend>
                <Texto name="diagnostico" label="Diagnóstico" f={f} />
                <Texto name="tratamiento" label="Tratamiento" f={f} />
                <Texto name="observaciones" label="Observaciones" f={f} />
              </fieldset>
            </div>
            <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button className="btn w-full">Guardar ficha</button>
            </div>
          </form>

          <section className="rounded-xl border border-slate-200 bg-white">
            <h2 className="subtitulo border-b border-slate-200 px-5 py-4">Sus citas</h2>
            <ul className="divide-y divide-slate-200">
              {citas.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="mayus font-semibold">{formatoFechaCorta(c.inicio)}</p>
                    <p className="truncate text-sm text-slate-600">{nombreServicio(c)}</p>
                  </div>
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
