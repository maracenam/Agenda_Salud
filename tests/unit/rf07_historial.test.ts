// RF-07: historial de atenciones. Las mediciones de cada atención se leen por módulo.
import { describe, expect, it } from "vitest";
import { datosDelModulo, leerCampos, moduloDe } from "@/lib/especialidades";

describe("RF-07 mediciones por atención", () => {
  it.each(["matroneria", "medicina-general", "nutricion", "kinesiologia", "psicologia", "enfermeria"])(
    "%s define mediciones válidas por atención",
    (slug) => {
      const m = moduloDe(slug);
      expect(m.atencion.length).toBeGreaterThan(0);
      for (const c of m.atencion) if (c.tipo === "numero") expect(c.min).toBeLessThan(c.max);
    },
  );
  it("la medición guardada se recupera para el historial", () => {
    const f = new FormData();
    f.set("at_eva", "7");
    const r = leerCampos(moduloDe("kinesiologia").atencion, f, "at_");
    expect("datos" in r).toBe(true);
    const guardado = { kinesiologia: "datos" in r ? r.datos : {} };
    expect(datosDelModulo(guardado, "kinesiologia")).toEqual({ eva: 7 });
  });
});
