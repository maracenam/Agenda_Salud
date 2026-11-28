// RF-03: reserva. Fechas y horas en zona de Chile, sin errores por cambio de horario.
import { describe, expect, it } from "vitest";
import { diaSemana, esFechaValida, fechaISO, formatoPrecio, inicioDiaChile, inicioSemana, minutosChile, sumarDias } from "@/lib/fechas";

describe("RF-03 fechas", () => {
  it("suma días cruzando meses y años", () => {
    expect(sumarDias("2026-12-30", 3)).toBe("2027-01-02");
    expect(sumarDias("2028-02-28", 1)).toBe("2028-02-29");
  });
  it("calcula el día de la semana y el lunes de la semana", () => {
    expect(diaSemana("2026-11-30")).toBe(1);
    expect(inicioSemana("2026-12-06")).toBe("2026-11-30");
    expect(inicioSemana("2026-11-30")).toBe("2026-11-30");
  });
  it("valida fechas YYYY-MM-DD", () => {
    expect(esFechaValida("2026-11-30")).toBe(true);
    expect(esFechaValida("30-11-2026")).toBe(false);
    expect(esFechaValida("2026-13-40")).toBe(false);
    expect(esFechaValida(undefined)).toBe(false);
  });
  it("la medianoche de Chile respeta horario de verano (-03) y de invierno (-04)", () => {
    expect(inicioDiaChile("2026-01-15").toISOString()).toBe("2026-01-15T03:00:00.000Z");
    expect(inicioDiaChile("2026-07-15").toISOString()).toBe("2026-07-15T04:00:00.000Z");
  });
  it("convierte instantes a la fecha y minutos de Chile", () => {
    expect(fechaISO("2026-07-15T03:30:00Z")).toBe("2026-07-14");
    expect(minutosChile("2026-01-15T12:30:00Z")).toBe(9 * 60 + 30);
  });
  it("formatea precios en pesos chilenos", () => {
    expect(formatoPrecio(19990).replace(/\s/g, " ")).toMatch(/\$\s?19\.990/);
    expect(formatoPrecio(null)).toBe("");
  });
});
