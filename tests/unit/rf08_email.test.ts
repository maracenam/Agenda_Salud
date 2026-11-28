// RF-08: notificaciones por email
import { describe, expect, it } from "vitest";
import { correos, correosDerivacion, esc, limpiarAsunto, type CitaAviso } from "@/lib/email";

const cita: CitaAviso = {
  id: "c1",
  inicio: "2026-12-07T12:00:00Z",
  paciente: { nombre: 'Ana <img src=x onerror=alert(1)>', email: "ana@t.cl" },
  profesional: { nombre: "Pía Soto", perfil: { email: "pia@t.cl" }, direccion: "Av. Siempre Viva 1", comuna: "Ñuñoa", especialidad: { nombre: "Psicología" } },
  servicio: { nombre: "Sesión" },
};

describe("RF-08 correos de cita", () => {
  it("confirmación: un correo a la paciente y otro a la profesional", () => {
    const l = correos(cita, "confirmacion");
    expect(l.map((c) => c.para)).toEqual(["ana@t.cl", "pia@t.cl"]);
    expect(l[0].html).toContain("Psicología");
    expect(l[0].html).toContain("09:00"); // 12:00 UTC es 09:00 en Chile (horario de verano, -03)
  });
  it("recordatorio: solo a la paciente", () => {
    expect(correos(cita, "recordatorio").map((c) => c.para)).toEqual(["ana@t.cl"]);
  });
  it("cancelación y cambio avisan a ambas partes", () => {
    expect(correos(cita, "cancelacion")).toHaveLength(2);
    expect(correos(cita, "reprogramacion")).toHaveLength(2);
  });
  it("escapa HTML del nombre (sin XSS en el correo)", () => {
    const html = correos(cita, "confirmacion").map((c) => c.html).join("");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
  it("sin email no se envía nada", () => {
    expect(correos({ ...cita, paciente: { nombre: "X", email: null }, profesional: null }, "confirmacion")).toEqual([]);
  });
  it("el asunto no admite saltos de línea (inyección de cabeceras)", () => {
    expect(limpiarAsunto("Hola\r\nBcc: x@evil.cl")).toBe("Hola Bcc: x@evil.cl");
    expect(esc(`"'<>&`)).toBe("&quot;&#39;&lt;&gt;&amp;");
  });
  it("derivación: avisa a la paciente con enlace para reservar y a la colega", () => {
    const l = correosDerivacion({
      id: "d1",
      motivo: "Evaluación nutricional",
      paciente: { nombre: "Ana", email: "ana@t.cl" },
      de: { nombre: "Matrona Uno" },
      a: { id: "p2", nombre: "Nina Nutri", especialidad: { nombre: "Nutrición" }, perfil: { email: "nina@t.cl" } },
    });
    expect(l.map((c) => c.para)).toEqual(["ana@t.cl", "nina@t.cl"]);
    expect(l[0].html).toContain("/profesionales/p2");
  });
});
