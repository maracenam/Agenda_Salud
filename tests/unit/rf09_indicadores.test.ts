// RF-09: indicadores
import { describe, expect, it } from "vitest";
import { calcularIndicadores, rangoPeriodo } from "@/lib/indicadores";

describe("RF-09 calcularIndicadores", () => {
  it("calcula tasas solo con citas ya ocurridas o canceladas", () => {
    const i = calcularIndicadores({ agendadas: 10, confirmadas: 2, completadas: 6, canceladas: 1, no_asistio: 1, pacientes_atendidos: 5, fichas_completas: 4 });
    expect(i.tasaRealizadas).toBe(75);
    expect(i.tasaCanceladas).toBe(13);
    expect(i.tasaInasistencia).toBe(14);
    expect(i.completitudFichas).toBe(80);
  });
  it("sin datos no divide por cero", () => {
    const i = calcularIndicadores({ agendadas: 0, confirmadas: 0, completadas: 0, canceladas: 0, no_asistio: 0, pacientes_atendidos: 0, fichas_completas: 0 });
    expect(i.tasaRealizadas).toBeNull();
    expect(i.completitudFichas).toBeNull();
  });
});

describe("RF-09 rangoPeriodo", () => {
  it("este mes", () => expect(rangoPeriodo("mes", "2026-02-10")).toMatchObject({ desde: "2026-02-01", hasta: "2026-02-28" }));
  it("mes anterior cruzando el año", () => expect(rangoPeriodo("mes-anterior", "2026-01-15")).toMatchObject({ desde: "2025-12-01", hasta: "2025-12-31" }));
  it("últimos 90 días", () => expect(rangoPeriodo("90", "2026-11-28")).toMatchObject({ desde: "2026-08-31", hasta: "2026-11-28" }));
  it("un periodo desconocido cae en este mes", () => expect(rangoPeriodo("<script>", "2026-11-28").clave).toBe("mes"));
});
