/**
 * CU-12 y CU-13 de punta a punta por la API: la paciente indica su previsión, la profesional
 * atiende y cobra en un paso, marca la boleta, y nadie más ve esos montos.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { admin, crearCuenta, lunes, profesionalLista, stackDisponible } from "./apoyo";

const disponible = await stackDisponible();

describe.skipIf(!disponible)("Sistema: cobro de atenciones y Mis ingresos", () => {
  let mat: Awaited<ReturnType<typeof profesionalLista>>;
  let kine: Awaited<ReturnType<typeof profesionalLista>>;
  let ana: Awaited<ReturnType<typeof crearCuenta>>;
  let cita = "";

  beforeAll(async () => {
    mat = await profesionalLista("matroneria", "Marta Matrona");
    kine = await profesionalLista("kinesiologia", "Kevin Kine");
    ana = await crearCuenta({ rol: "paciente", nombre: "Ana Pagos" });
    const r = await ana.c.rpc("reservar_cita", { p_servicio: mat.servicio, p_inicio: lunes(11).iso });
    if (r.error) throw r.error;
    cita = r.data.id;
    // La cita ya ocurrió
    const u = await admin().from("citas").update({ inicio: new Date(Date.now() - 2 * 3600e3).toISOString(), fin: new Date(Date.now() - 1.5 * 3600e3).toISOString() }).eq("id", cita);
    if (u.error) throw u.error;
  });

  it("la paciente guarda su previsión y la profesional la ve", async () => {
    const u = await ana.c.from("perfiles").update({ prevision: "isapre", isapre: "Colmena" }).eq("id", ana.id);
    expect(u.error).toBeNull();
    const { data } = await mat.c.from("perfiles").select("prevision, isapre").eq("id", ana.id).single();
    expect(data).toEqual({ prevision: "isapre", isapre: "Colmena" });
  });

  it("atendida y cobrada en un paso; el monto lo ve solo la profesional", async () => {
    const r = await mat.c.rpc("registrar_pago", { p_cita: cita, p_medio: "bono_isapre", p_monto: 25000, p_folio: "A-1" });
    expect(r.error).toBeNull();
    const { data: c } = await mat.c.from("citas").select("estado, pago:pagos(monto, medio)").eq("id", cita).single();
    expect(c).toMatchObject({ estado: "completada", pago: { monto: 25000, medio: "bono_isapre" } });
    expect((await ana.c.from("pagos").select("id")).data).toEqual([]);
    expect((await kine.c.from("pagos").select("id")).data).toEqual([]);
  });

  it("la paciente no puede escribir un cobro directo ni por la función", async () => {
    const i = await ana.c.from("pagos").insert({ cita_id: cita, profesional_id: mat.id, paciente_id: ana.id, fecha: new Date().toISOString(), medio: "efectivo", monto: 1 });
    expect(i.error).not.toBeNull();
    const r = await ana.c.rpc("registrar_pago", { p_cita: cita, p_medio: "efectivo", p_monto: 1 });
    expect(r.error?.message).toBe("Cita no encontrada");
  });

  it("marcar boleta emitida", async () => {
    const { data: p } = await mat.c.from("pagos").select("id").eq("cita_id", cita).single();
    const r = await mat.c.rpc("marcar_boletas", { p_pagos: [p!.id], p_emitida: true, p_numero: "120" });
    expect(r.data).toBe(1);
    const otra = await kine.c.rpc("marcar_boletas", { p_pagos: [p!.id], p_emitida: false });
    expect(otra.data).toBe(0);
    const { data } = await mat.c.from("pagos").select("boleta_emitida, boleta_numero").eq("id", p!.id).single();
    expect(data).toEqual({ boleta_emitida: true, boleta_numero: "120" });
  });

  it("los cambios de cobro quedan en la bitácora", async () => {
    const { data } = await admin().from("auditoria").select("accion").eq("tabla", "pagos").eq("actor", mat.id);
    expect(data!.length).toBeGreaterThanOrEqual(2);
  });
});
