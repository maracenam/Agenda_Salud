// RF-06: ficha clínica adaptable. Validación de campos y cálculos clínicos.
import { describe, expect, it } from "vitest";
import { datosDelModulo, leerCampos, moduloDe } from "@/lib/especialidades";
import { edadAnios, edadGestacional, imc, mesesDesde, presionElevada } from "@/lib/calculos";

const form = (o: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(o)) f.set(k, v);
  return f;
};

describe("RF-06 leerCampos (lista blanca por módulo)", () => {
  const matroneria = moduloDe("matroneria").ficha;
  it("lee números, fechas y textos del módulo", () => {
    const r = leerCampos(matroneria, form({ esp_gestas: "2", esp_fur: "2026-09-01", esp_metodo_anticonceptivo: "DIU" }), "esp_");
    expect(r).toEqual({ datos: { gestas: 2, fur: "2026-09-01", metodo_anticonceptivo: "DIU" } });
  });
  it("ignora claves que el módulo no define (no se cuela basura en la ficha)", () => {
    const r = leerCampos(matroneria, form({ esp_gestas: "1", esp_rol: "admin", esp___proto__: "x" }), "esp_");
    expect(r).toEqual({ datos: { gestas: 1 } });
  });
  it("rechaza números fuera de rango", () => {
    expect(leerCampos(matroneria, form({ esp_gestas: "99" }), "esp_")).toEqual({ error: expect.stringContaining("Gestas") });
    expect(leerCampos(matroneria, form({ esp_gestas: "-1" }), "esp_")).toHaveProperty("error");
    expect(leerCampos(matroneria, form({ esp_gestas: "abc" }), "esp_")).toHaveProperty("error");
  });
  it("acepta coma decimal", () => {
    const r = leerCampos(moduloDe("nutricion").atencion, form({ at_peso: "70,5" }), "at_");
    expect(r).toEqual({ datos: { peso: 70.5 } });
  });
  it("rechaza fechas y opciones no válidas", () => {
    expect(leerCampos(matroneria, form({ esp_fur: "ayer" }), "esp_")).toHaveProperty("error");
    expect(leerCampos(moduloDe("psicologia").ficha, form({ esp_enfoque: "<script>" }), "esp_")).toHaveProperty("error");
  });
  it("recorta textos al largo máximo", () => {
    const r = leerCampos(matroneria, form({ esp_metodo_anticonceptivo: "x".repeat(1000) }), "esp_");
    expect("datos" in r && String(r.datos.metodo_anticonceptivo).length).toBe(200);
  });
  it("datosDelModulo solo devuelve valores simples del módulo pedido", () => {
    expect(datosDelModulo({ matroneria: { fur: "2026-09-01", x: { y: 1 } }, nutricion: { peso: 1 } }, "matroneria")).toEqual({ fur: "2026-09-01" });
    expect(datosDelModulo(null, "matroneria")).toEqual({});
    expect(datosDelModulo([1], "matroneria")).toEqual({});
  });
});

describe("RF-06 cálculos clínicos", () => {
  it("edad gestacional y fecha probable de parto (Naegele)", () => {
    expect(edadGestacional("2026-09-01", "2026-11-28")).toEqual({ semanas: 12, dias: 4, fpp: "2027-06-08" });
    expect(edadGestacional("2027-01-01", "2026-11-28")).toBeNull();
    expect(edadGestacional("2025-01-01", "2026-11-28")).toBeNull();
  });
  it("IMC con categoría", () => {
    expect(imc(70, 175)).toEqual({ valor: 22.9, categoria: "Normal", alerta: false });
    expect(imc(100, 170)?.categoria).toBe("Obesidad");
    expect(imc(null, 170)).toBeNull();
  });
  it("meses desde una fecha y edad en años", () => {
    expect(mesesDesde("2025-10-01", "2026-11-28")).toBe(13);
    expect(edadAnios("1990-11-29", "2026-11-28")).toBe(35);
    expect(edadAnios("1990-11-28", "2026-11-28")).toBe(36);
  });
  it("presión arterial elevada", () => {
    expect(presionElevada("120/80")).toBe(false);
    expect(presionElevada("150/95")).toBe(true);
    expect(presionElevada("alta")).toBeNull();
  });
});

describe("RF-06 resumen clínico por especialidad", () => {
  it("matronería: PAP vencido levanta alerta", () => {
    const t = moduloDe("matroneria").resumen({ ultimo_pap: "2025-06-01", fur: "2026-09-01", gestas: 1 }, [], "2026-11-28");
    expect(t.find((x) => x.titulo === "Último PAP")?.alerta).toBe(true);
    expect(t.find((x) => x.titulo === "Edad gestacional")?.valor).toBe("12+4 semanas");
  });
  it("nutrición: IMC con el último peso y la talla de la ficha", () => {
    const t = moduloDe("nutricion").resumen({ talla: 160 }, [{ peso: 80 }, { peso: 85 }], "2026-11-28");
    expect(t.find((x) => x.titulo === "IMC")?.valor).toBe("31,2"); // 80 / 1,6² = 31,25
    expect(t.find((x) => x.titulo === "Peso")?.detalle).toMatch(/-5 kg/);
  });
  it("psicología: riesgo alto levanta alerta", () => {
    const t = moduloDe("psicologia").resumen({}, [{ riesgo: "Alto", animo: 3 }], "2026-11-28");
    expect(t.find((x) => x.titulo === "Riesgo")?.alerta).toBe(true);
  });
  it("kinesiología: avance de sesiones", () => {
    const t = moduloDe("kinesiologia").resumen({ sesiones_indicadas: 10 }, [{ eva: 4 }, { eva: 6 }], "2026-11-28");
    expect(t[0].valor).toBe("2 de 10");
  });
});
