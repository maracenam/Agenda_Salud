import Link from "next/link";
import { Ficha, FlechaAtras } from "@/components/marca";
import { notFound } from "next/navigation";
import { Aviso, EstadoCita } from "@/components/aviso";
import { formatoFechaCorta, formatoFechaHora, hoyChile } from "@/lib/fechas";
import { edadAnios } from "@/lib/calculos";
import { datosDelModulo, moduloDe, type Campo, type Datos } from "@/lib/especialidades";
import { requerirProfesional } from "@/lib/sesion";
import { derivarPaciente, guardarFicha, registrarAtencion } from "../../acciones";

export const metadata = { title: "Ficha clínica" };

type Ficha = Record<string, string | number | null>;

function Texto({ name, label, f, rows = 2 }: { name: string; label: string; f: Ficha | null; rows?: number }) {
  return (
    <div>
      <label className="etiqueta" htmlFor={name}>{label}</label>
      <textarea className="campo" id={name} name={name} rows={rows} defaultValue={(f?.[name] as string) ?? ""} />
    </div>
  );
}

/** Un campo propio de la especialidad, con prefijo para no chocar con los campos comunes. */
function CampoModulo({ c, valor, prefijo }: { c: Campo; valor: Datos[string] | undefined; prefijo: string }) {
  const id = prefijo + c.clave;
  const v = valor ?? "";
  const etiqueta = (
    <label className="etiqueta" htmlFor={id}>
      {c.etiqueta}
      {c.tipo === "numero" && c.unidad && <span className="font-normal text-slate-500"> ({c.unidad})</span>}
    </label>
  );
  if (c.tipo === "numero")
    return <div>{etiqueta}<input className="campo" id={id} name={id} type="number" inputMode="decimal" min={c.min} max={c.max} step={c.paso ?? 1} defaultValue={v} /></div>;
  if (c.tipo === "fecha") return <div>{etiqueta}<input className="campo" id={id} name={id} type="date" defaultValue={v} /></div>;
  if (c.tipo === "opcion")
    return (
      <div>
        {etiqueta}
        <select className="campo" id={id} name={id} defaultValue={String(v)}>
          <option value="">Sin indicar</option>
          {c.opciones.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  return (c.filas ?? 1) > 1 ? (
    <div className="col-span-full">{etiqueta}<textarea className="campo" id={id} name={id} rows={c.filas} maxLength={c.max} defaultValue={v} /></div>
  ) : (
    <div>{etiqueta}<input className="campo" id={id} name={id} maxLength={c.max} defaultValue={v} /></div>
  );
}

function valorLegible(c: Campo, v: Datos[string]) {
  if (c.tipo === "fecha" && typeof v === "string") return formatoFechaCorta(v + "T12:00:00");
  if (c.tipo === "numero") return `${String(v).replace(".", ",")}${c.unidad ? ` ${c.unidad}` : ""}`;
  return String(v);
}

export default async function FichaPaciente({ params, searchParams }: PageProps<"/panel/pacientes/[id]">) {
  const { id: pacienteId } = await params;
  const sp = await searchParams;
  if (!/^[0-9a-f-]{36}$/i.test(pacienteId)) notFound();
  const { id, supabase } = await requerirProfesional();

  const [{ data: paciente }, { data: ficha }, { data: atenciones }, { data: citas }, { data: pro }, { data: colegas }] = await Promise.all([
    supabase.from("perfiles").select("id, nombre, email, rut, telefono, fecha_nacimiento").eq("id", pacienteId).maybeSingle(),
    supabase.from("fichas").select("*").eq("profesional_id", id).eq("paciente_id", pacienteId).maybeSingle(),
    supabase.from("atenciones").select("*").eq("profesional_id", id).eq("paciente_id", pacienteId).order("fecha", { ascending: false }),
    supabase.from("citas").select("id, inicio, estado, servicio:servicios(nombre)").eq("profesional_id", id).eq("paciente_id", pacienteId).order("inicio", { ascending: false }),
    supabase.from("profesionales").select("especialidad:especialidades(slug, nombre)").eq("id", id).single(),
    supabase.from("profesionales").select("id, nombre, especialidad:especialidades(nombre)").eq("publicado", true).neq("id", id).order("nombre").limit(300),
  ]);
  if (!paciente || !citas?.length) notFound();
  // RNF-28: cada apertura de la ficha queda en la bitácora de auditoría.
  await supabase.rpc("registrar_lectura_ficha", { p_paciente: pacienteId });

  const f = ficha as Ficha | null;
  const esp = pro?.especialidad as unknown as { slug: string; nombre: string } | null;
  const modulo = moduloDe(esp?.slug);
  const hoy = hoyChile();
  const datosFicha = datosDelModulo(ficha?.datos_especialidad, modulo.slug);
  const datosAtenciones = (atenciones ?? []).map((a) => datosDelModulo(a.datos_especialidad, modulo.slug));
  const tarjetas = modulo.resumen(datosFicha, datosAtenciones, hoy);
  const citaActual = typeof sp.cita === "string" ? citas.find((c) => c.id === sp.cita) : undefined;
  const años = edadAnios(paciente.fecha_nacimiento, hoy);
  const iniciales = paciente.nombre.split(" ").filter(Boolean).slice(0, 2).map((x: string) => x[0]).join("").toUpperCase();
  const alergias = typeof f?.alergias === "string" && f.alergias.trim() ? f.alergias.trim() : null;
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

      {/* Resumen clínico: lo que la o el profesional mira antes de saludar. Cambia según la especialidad. */}
      <section aria-label="Resumen clínico" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
        {tarjetas.slice(0, 3).map((t) => (
          <div key={t.titulo} className={`border-b border-slate-200 p-5 sm:border-r lg:border-b-0 ${t.alerta ? "bg-alerta-claro" : ""}`}>
            <p className={`text-sm font-semibold ${t.alerta ? "text-alerta" : "text-slate-600"}`}>{t.titulo}</p>
            <p className="cifra mt-2 text-2xl">{t.valor}</p>
            {t.detalle && <p className={`mt-0.5 text-sm ${t.alerta ? "font-semibold text-alerta" : "text-slate-600"}`}>{t.detalle}</p>}
          </div>
        ))}
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
              {modulo.atencion.length > 0 && (
                <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2 lg:grid-cols-4">
                  {modulo.atencion.map((c) => <CampoModulo key={c.clave} c={c} valor={undefined} prefijo="at_" />)}
                </div>
              )}
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
                {atenciones!.map((a, i) => (
                  <li key={a.id} className="grid gap-x-6 gap-y-2 p-5 sm:grid-cols-[9rem_minmax(0,1fr)]">
                    <div>
                      <p className="mayus font-semibold">{formatoFechaCorta(a.fecha)}</p>
                      {a.motivo && <p className="text-sm text-slate-600">{a.motivo}</p>}
                    </div>
                    <dl className="space-y-2 text-[15px]">
                      {modulo.atencion.some((c) => datosAtenciones[i][c.clave] != null) && (
                        <div className="flex flex-wrap gap-x-5 gap-y-1">
                          {modulo.atencion.filter((c) => datosAtenciones[i][c.clave] != null).map((c) => (
                            <div key={c.clave} className="flex gap-1.5"><dt className="text-sm font-semibold text-slate-600">{c.etiqueta}</dt><dd className="cifra">{valorLegible(c, datosAtenciones[i][c.clave])}</dd></div>
                          ))}
                        </div>
                      )}
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
              {modulo.ficha.length > 0 && (
                <fieldset>
                  <legend className="mb-3 font-bold text-marca-800">{modulo.tituloFicha}</legend>
                  <div className={`grid gap-3 ${modulo.slug === "matroneria" ? "grid-cols-4 [&>*:nth-child(n+5)]:col-span-2" : "grid-cols-2"}`}>
                    {modulo.ficha.map((c) => <CampoModulo key={c.clave} c={c} valor={datosFicha[c.clave]} prefijo="esp_" />)}
                  </div>
                </fieldset>
              )}
              <fieldset className={`space-y-3 ${modulo.ficha.length > 0 ? "border-t border-slate-200 pt-5" : ""}`}>
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

          <details className="group rounded-xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
              <h2 className="subtitulo">Derivar a una colega</h2>
              <span className="text-sm font-semibold text-marca-700 group-open:hidden">Abrir</span>
              <span className="hidden text-sm font-semibold text-slate-600 group-open:inline">Cerrar</span>
            </summary>
            <form action={derivarPaciente} className="space-y-4 border-t border-slate-200 p-5">
              <input type="hidden" name="paciente" value={pacienteId} />
              <div>
                <label className="etiqueta" htmlFor="a_profesional">Colega</label>
                <select className="campo" id="a_profesional" name="a_profesional" required defaultValue="">
                  <option value="" disabled>Elige a quién derivas</option>
                  {((colegas ?? []) as unknown as { id: string; nombre: string; especialidad: { nombre: string } | null }[]).map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}{c.especialidad ? `, ${c.especialidad.nombre}` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="etiqueta" htmlFor="motivo_derivacion">Motivo</label>
                <textarea className="campo" id="motivo_derivacion" name="motivo_derivacion" rows={2} required minLength={3} maxLength={1000} />
              </div>
              <label className="flex items-start gap-3 text-[15px]">
                <input type="checkbox" name="compartir" className="mt-1 size-4 accent-marca-700" />
                <span>Compartir un resumen clínico con mi colega</span>
              </label>
              <div>
                <label className="etiqueta" htmlFor="resumen">Resumen <span className="font-normal text-slate-500">(solo se envía si marcas la casilla)</span></label>
                <textarea className="campo" id="resumen" name="resumen" rows={3} maxLength={4000} defaultValue={[f?.diagnostico, alergias ? `Alergias: ${alergias}` : null].filter(Boolean).join("\n")} />
              </div>
              <button className="btn w-full">Enviar derivación</button>
              <p className="text-sm text-slate-600">La paciente recibe un email con el enlace para reservar con tu colega.</p>
            </form>
          </details>

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
