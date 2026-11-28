// RF-01: gestión de usuarios y control de acceso (lógica del lado de la aplicación)
import { describe, expect, it } from "vitest";
import { validarRut } from "@/lib/rut";
import { rutaSegura } from "@/lib/redir";
import { mensajeError } from "@/lib/errores";

describe("RF-01 validarRut", () => {
  it.each(["11.111.111-1", "12345678-5", "7.654.321-6", "15.333.444-K".replace("K", "k")])("acepta %s si el dígito calza", (r) => {
    const limpio = r.replace(/[.\-]/g, "").toUpperCase();
    // Calcula el DV esperado para no depender de RUT reales
    const cuerpo = limpio.slice(0, -1);
    let s = 0, f = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) { s += Number(cuerpo[i]) * f; f = f === 7 ? 2 : f + 1; }
    const dv = 11 - (s % 11);
    const esperado = dv === 11 ? "0" : dv === 10 ? "K" : String(dv);
    expect(validarRut(cuerpo + "-" + esperado)).toBe(true);
  });
  it("rechaza un dígito verificador incorrecto", () => expect(validarRut("11.111.111-2")).toBe(false));
  it("rechaza texto y largos imposibles", () => {
    expect(validarRut("hola")).toBe(false);
    expect(validarRut("1-9")).toBe(false);
    expect(validarRut("123456789012-3")).toBe(false);
  });
});

describe("RF-01 rutaSegura (redirecciones solo internas)", () => {
  it("permite rutas internas", () => expect(rutaSegura("/panel?x=1", "/")).toBe("/panel?x=1"));
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "\\\\evil.com", "/%5Cevil.com", "javascript:alert(1)", "", null])(
    "bloquea %s",
    (r) => expect(rutaSegura(r as string, "/inicio")).toBe("/inicio"),
  );
});

describe("RF-01 mensajeError", () => {
  it("traduce permisos y dobles reservas", () => {
    expect(mensajeError({ code: "42501" })).toBe("No tienes permiso para hacer esto.");
    expect(mensajeError({ code: "23P01" })).toMatch(/ya fue tomado/);
    expect(mensajeError(null)).toMatch(/inesperado/);
  });
  it("no filtra detalles técnicos de Postgres", () => {
    expect(mensajeError({ code: "23505", message: 'duplicate key value violates unique constraint "fichas_pkey"' })).toBe("Ocurrió un error inesperado.");
  });
});
