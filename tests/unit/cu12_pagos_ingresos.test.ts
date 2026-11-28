// CU-12 registrar el pago de una cita y CU-13 Mis ingresos
import { describe, expect, it } from "vitest";
import {
  celda,
  csvIngresos,
  esMedio,
  esPrevision,
  estimarRetencion,
  leerMonto,
  medioSugerido,
  mesValido,
  mesVecino,
  nombrePrevision,
  rangoMes,
  resumenIngresos,
  tasaRetencion,
} from "@/lib/ingresos";

describe("CU-12 medioSugerido", () => {
  const sin = { recibeBonoFonasa: false, recibeBonoIsapre: false };
  it("Fonasa con convenio propone bono Fonasa", () =>
    expect(medioSugerido({ prevision: "fonasa", recibeBonoFonasa: true, recibeBonoIsapre: false })).toBe("bono_fonasa"));
  it("Isapre con convenio propone bono Isapre", () =>
    expect(medioSugerido({ prevision: "isapre", recibeBonoFonasa: false, recibeBonoIsapre: true })).toBe("bono_isapre"));
  it("sin convenio no propone bono aunque la paciente sea Fonasa", () =>
    expect(medioSugerido({ prevision: "fonasa", ...sin })).toBe("transferencia"));
  it("repite el último medio que no fue bono", () =>
    expect(medioSugerido({ prevision: "particular", ...sin, ultimoMedio: "efectivo" })).toBe("efectivo"));
  it("no repite un bono como costumbre", () =>
    expect(medioSugerido({ prevision: null, ...sin, ultimoMedio: "bono_fonasa" })).toBe("transferencia"));
});

describe("CU-12 leerMonto", () => {
  it("acepta formatos chilenos", () => {
    expect(leerMonto("25.000")).toBe(25000);
    expect(leerMonto("$ 25000")).toBe(25000);
    expect(leerMonto("0")).toBe(0);
  });
  it("rechaza negativos, texto y montos absurdos", () => {
    expect(leerMonto("-100")).toBeNull();
    expect(leerMonto("abc")).toBeNull();
    expect(leerMonto("")).toBeNull();
    expect(leerMonto("99999999")).toBeNull();
  });
});

describe("CU-12 validación de listas", () => {
  it("previsión y medio solo de la lista blanca", () => {
    expect(esPrevision("fonasa")).toBe(true);
    expect(esPrevision("FONASA")).toBe(false);
    expect(esMedio("bono_isapre")).toBe(true);
    expect(esMedio("cheque")).toBe(false);
  });
  it("nombre de la previsión con la Isapre", () => {
    expect(nombrePrevision("isapre", "Colmena")).toBe("Isapre Colmena");
    expect(nombrePrevision(null)).toBe("Sin informar");
  });
});

describe("CU-13 retención de boleta de honorarios", () => {
  it("2026 es 15,25% y sube hasta 17% en 2028", () => {
    expect(tasaRetencion(2026)).toBe(15.25);
    expect(tasaRetencion(2027)).toBe(16);
    expect(tasaRetencion(2028)).toBe(17);
    expect(tasaRetencion(2031)).toBe(17);
  });
  it("estima retención y líquido redondeados al peso", () => {
    expect(estimarRetencion(100000, 2026)).toEqual({ tasa: 15.25, retencion: 15250, liquido: 84750 });
    expect(estimarRetencion(33333, 2026)).toEqual({ tasa: 15.25, retencion: 5083, liquido: 28250 });
  });
});

describe("CU-13 meses", () => {
  it("valida YYYY-MM", () => {
    expect(mesValido("2026-11")).toBe("2026-11");
    expect(mesValido("2026-13")).toBeNull();
    expect(mesValido("2026-11'; drop")).toBeNull();
  });
  it("rango de diciembre cruza el año", () => expect(rangoMes("2026-12")).toEqual({ desde: "2026-12-01", hasta: "2027-01-01", anio: 2026 }));
  it("mes vecino", () => {
    expect(mesVecino("2026-01", -1)).toBe("2025-12");
    expect(mesVecino("2026-12", 1)).toBe("2027-01");
  });
});

describe("CU-13 resumenIngresos", () => {
  it("suma por medio y cuenta lo que falta boletear", () => {
    const r = resumenIngresos(
      [
        { id: "1", medio: "transferencia", monto: 30000, boleta_emitida: true },
        { id: "2", medio: "transferencia", monto: 30000, boleta_emitida: false },
        { id: "3", medio: "bono_fonasa", monto: 12000, boleta_emitida: false },
        { id: "4", medio: "efectivo", monto: 0, boleta_emitida: false },
      ],
      2026,
    );
    expect(r.total).toBe(72000);
    expect(r.cantidad).toBe(4);
    expect(r.porMedio.map((m) => [m.medio, m.monto])).toEqual([["transferencia", 60000], ["efectivo", 0], ["bono_fonasa", 12000]]);
    expect(r.sinBoleta).toBe(2); // las atenciones sin cobro no necesitan boleta
    expect(r.montoSinBoleta).toBe(42000);
    expect(r.retencion).toBe(10980);
    expect(r.liquido).toBe(61020);
  });
  it("sin cobros todo es cero", () => expect(resumenIngresos([], 2026)).toMatchObject({ total: 0, retencion: 0, porMedio: [] }));
});

describe("CU-13 exportar a Excel", () => {
  it("bloquea fórmulas y escapa separadores", () => {
    expect(celda("=HYPERLINK(\"x\")")).toBe(`"'=HYPERLINK(""x"")"`);
    expect(celda("+56 9 1234")).toBe("'+56 9 1234");
    expect(celda("Pérez; Ana")).toBe('"Pérez; Ana"');
    expect(celda("línea\nnueva")).toBe("línea nueva");
    expect(celda(null)).toBe("");
  });
  it("CSV con BOM, punto y coma y una fila por cobro", () => {
    const csv = csvIngresos([
      { fecha: "2026-11-03", hora: "09:00", paciente: "Ana Pérez", rut: "11.111.111-1", prestacion: "Control", prevision: "Fonasa", medio: "Bono Fonasa", folio_bono: "123", monto: 12000, boleta: false, boleta_numero: null },
    ]);
    expect(csv.startsWith("﻿Fecha;Hora;Paciente")).toBe(true);
    const lineas = csv.trim().split("\r\n");
    expect(lineas).toHaveLength(2);
    expect(lineas[1]).toBe("2026-11-03;09:00;Ana Pérez;11.111.111-1;Control;Fonasa;Bono Fonasa;123;12000;No;");
  });
});
