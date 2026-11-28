/**
 * Pruebas integrales del sistema: Auth + API REST + funciones + RLS, a través de la red,
 * con el mismo cliente que usa la aplicación. Recorren los casos de uso de punta a punta
 * entre varias especialidades. Requieren Supabase local (npx supabase start).
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, cliente, crearCuenta, lunes, profesionalLista, stackDisponible } from "./apoyo";

const disponible = await stackDisponible();

describe.skipIf(!disponible)("Sistema: del registro a la derivación, con varias especialidades", () => {
  let psi: Awaited<ReturnType<typeof profesionalLista>>;
  let nut: Awaited<ReturnType<typeof profesionalLista>>;
  let ana: Awaited<ReturnType<typeof crearCuenta>>;
  let berta: Awaited<ReturnType<typeof crearCuenta>>;
  let citaId = "";
  const l = lunes(9);

  beforeAll(async () => {
    psi = await profesionalLista("psicologia", "Pía Psicóloga");
    nut = await profesionalLista("nutricion", "Nina Nutricionista");
    ana = await crearCuenta({ rol: "paciente", nombre: "Ana Paciente" });
    berta = await crearCuenta({ rol: "paciente", nombre: "Berta Paciente" });
  });

  it("CU-01: el registro asigna rol y especialidad", async () => {
    const { data } = await psi.c.from("profesionales").select("nombre, especialidad:especialidades(slug)").eq("id", psi.id).single();
    expect(data).toMatchObject({ nombre: "Pía Psicóloga", especialidad: { slug: "psicologia" } });
    const { data: p } = await ana.c.from("perfiles").select("rol").eq("id", ana.id).single();
    expect(p?.rol).toBe("paciente");
  });

  it("CU-02: el directorio público filtra por especialidad y no expone datos personales", async () => {
    const anon = cliente();
    const { data } = await anon
      .from("profesionales")
      .select("id, nombre, especialidad:especialidades!inner(slug)")
      .eq("publicado", true)
      .eq("especialidad.slug", "nutricion");
    expect(data?.map((x) => x.id)).toContain(nut.id);
    expect(data?.map((x) => x.id)).not.toContain(psi.id);
    const { data: perfiles } = await anon.from("perfiles").select("email, rut");
    expect(perfiles).toEqual([]);
  });

  it("CU-04: la paciente ve los bloques libres y reserva; nadie más toma ese bloque", async () => {
    const { data: bloques } = await cliente().rpc("bloques_disponibles", { p_servicio: psi.servicio, p_fecha: l.fecha });
    expect(bloques).toHaveLength(8);
    const r = await ana.c.rpc("reservar_cita", { p_servicio: psi.servicio, p_inicio: l.iso, p_motivo: "Ansiedad" });
    expect(r.error).toBeNull();
    citaId = r.data.id;
    const doble = await berta.c.rpc("reservar_cita", { p_servicio: psi.servicio, p_inicio: l.iso });
    expect(doble.error?.message).toBe("El horario ya no está disponible");
  });

  it("CU-04: dos reservas simultáneas al mismo bloque: solo una gana", async () => {
    const otro = lunes(11);
    const [a, b] = await Promise.all([
      ana.c.rpc("reservar_cita", { p_servicio: nut.servicio, p_inicio: otro.iso }),
      berta.c.rpc("reservar_cita", { p_servicio: nut.servicio, p_inicio: otro.iso }),
    ]);
    expect([a.error, b.error].filter((e) => e == null)).toHaveLength(1);
  });

  it("CU-05: la paciente cambia la hora y el bloque anterior queda libre", async () => {
    const nuevo = lunes(10);
    const r = await ana.c.rpc("reprogramar_cita", { p_cita: citaId, p_inicio: nuevo.iso });
    expect(r.error).toBeNull();
    const { data: bloques } = await cliente().rpc("bloques_disponibles", { p_servicio: psi.servicio, p_fecha: l.fecha });
    expect(bloques?.map((b: { inicio: string }) => new Date(b.inicio).toISOString())).toContain(l.iso);
  });

  it("CU-06: la profesional ve su agenda con la paciente; otra profesional no", async () => {
    const { data } = await psi.c.from("citas").select("id, paciente:perfiles!citas_paciente_id_fkey(nombre)").eq("id", citaId).single();
    expect(data?.paciente).toMatchObject({ nombre: "Ana Paciente" });
    const { data: ajena } = await nut.c.from("citas").select("id").eq("id", citaId);
    expect(ajena).toEqual([]);
  });

  it("CU-07/08: ficha con datos de psicología, atención con mediciones, y solo la tratante la ve", async () => {
    const f = await psi.c
      .from("fichas")
      .insert({ profesional_id: psi.id, paciente_id: ana.id, diagnostico: "Ansiedad generalizada", datos_especialidad: { psicologia: { enfoque: "Cognitivo-conductual" } } })
      .select("id")
      .single();
    expect(f.error).toBeNull();
    const a = await psi.c.from("atenciones").insert({
      ficha_id: f.data!.id, profesional_id: psi.id, paciente_id: ana.id, cita_id: citaId, motivo: "Primera sesión",
      datos_especialidad: { psicologia: { animo: 5, riesgo: "Bajo" } },
    });
    expect(a.error).toBeNull();
    expect((await psi.c.rpc("marcar_cita", { p_cita: citaId, p_estado: "completada" })).error).toBeNull();
    expect((await nut.c.from("fichas").select("id").eq("paciente_id", ana.id)).data).toEqual([]);
    expect((await ana.c.from("fichas").select("id")).data).toEqual([]);
    expect((await psi.c.from("fichas").delete().eq("id", f.data!.id)).error).not.toBeNull();
  });

  it("CU-10: indicadores del día reflejan la atención", async () => {
    const { data } = await psi.c.rpc("indicadores_profesional", { p_desde: l.fecha, p_hasta: l.fecha });
    expect(data).toMatchObject({ agendadas: 1, completadas: 1, pacientes_atendidos: 1, fichas_completas: 1 });
  });

  it("CU-11: psicología deriva a nutrición; la nutricionista acepta; la paciente lo ve", async () => {
    const d = await psi.c.rpc("derivar_paciente", { p_paciente: ana.id, p_a_profesional: nut.id, p_motivo: "Alimentación y ánimo", p_resumen: null });
    expect(d.error).toBeNull();
    const { data: recibida } = await nut.c.from("derivaciones").select("id, estado, paciente:perfiles!derivaciones_paciente_id_fkey(nombre)").single();
    expect(recibida).toMatchObject({ estado: "pendiente", paciente: { nombre: "Ana Paciente" } });
    expect((await nut.c.rpc("responder_derivacion", { p_derivacion: recibida!.id, p_aceptar: true })).error).toBeNull();
    const { data: vista } = await ana.c.from("derivaciones").select("estado, a:profesionales!derivaciones_a_profesional_fkey(nombre)").single();
    expect(vista).toMatchObject({ estado: "aceptada", a: { nombre: "Nina Nutricionista" } });
  });

  it("RNF-27: las acciones clínicas quedan en la bitácora", async () => {
    const { data } = await admin().from("auditoria").select("accion, tabla").eq("paciente_id", ana.id);
    const tablas = new Set((data ?? []).map((x) => `${x.tabla}:${x.accion}`));
    expect(tablas).toEqual(new Set(["citas:insert", "citas:update", "fichas:insert", "atenciones:insert", "derivaciones:insert", "derivaciones:update"]));
  });
});
