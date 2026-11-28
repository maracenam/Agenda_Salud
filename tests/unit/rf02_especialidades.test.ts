// RF-02: catálogo de especialidades, módulos y prestaciones sugeridas
import { describe, expect, it } from "vitest";
import { moduloDe, SLUGS_CON_MODULO } from "@/lib/especialidades";

const CATALOGO = ["matroneria", "medicina-general", "psicologia", "nutricion", "kinesiologia", "odontologia", "fonoaudiologia", "terapia-ocupacional", "enfermeria", "podologia"];

describe("RF-02 módulos por especialidad", () => {
  it("cada especialidad del catálogo tiene su módulo", () => {
    for (const slug of CATALOGO) expect(SLUGS_CON_MODULO).toContain(slug);
  });
  it("una especialidad nueva sin módulo usa el módulo general, no falla", () => {
    const m = moduloDe("veterinaria");
    expect(m.slug).toBe("general");
    expect(m.prestaciones.length).toBeGreaterThan(0);
    expect(moduloDe(null).slug).toBe("general");
  });
  it.each(CATALOGO)("%s sugiere prestaciones con duración válida (10 a 240 min)", (slug) => {
    const m = moduloDe(slug);
    expect(m.prestaciones.length).toBeGreaterThan(0);
    for (const p of m.prestaciones) {
      expect(p.duracion).toBeGreaterThanOrEqual(10);
      expect(p.duracion).toBeLessThanOrEqual(240);
    }
  });
  it.each(CATALOGO)("%s no repite claves de campos", (slug) => {
    const m = moduloDe(slug);
    const claves = [...m.ficha, ...m.atencion].map((c) => c.clave);
    expect(new Set(m.ficha.map((c) => c.clave)).size).toBe(m.ficha.length);
    expect(new Set(m.atencion.map((c) => c.clave)).size).toBe(m.atencion.length);
    for (const c of claves) expect(c).toMatch(/^[a-z_]+$/);
  });
  it("matronería conserva sus campos gineco-obstétricos", () => {
    const claves = moduloDe("matroneria").ficha.map((c) => c.clave);
    expect(claves).toEqual(expect.arrayContaining(["gestas", "partos", "abortos", "cesareas", "fur", "ultimo_pap", "metodo_anticonceptivo"]));
  });
});
