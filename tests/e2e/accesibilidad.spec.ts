import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** QA de accesibilidad (WCAG 2.1 AA) en las páginas públicas, con axe-core. */
for (const ruta of ["/", "/profesionales", "/profesionales?especialidad=psicologia", "/registro?rol=profesional", "/ingresar"]) {
  test(`sin fallas WCAG AA en ${ruta}`, async ({ page }) => {
    await page.goto(ruta);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    expect(graves.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
}

test.describe("páginas con sesión", () => {
  test.skip(({ browserName }) => browserName !== "chromium");
  let pro = "";
  let pac = "";
  let pacId = "";
  test.beforeAll(async () => {
    const { profesionalLista, crearCuenta, lunes } = await import("../integracion/apoyo");
    const p = await profesionalLista("kinesiologia", "Kati Kinesióloga");
    const otra = await profesionalLista("psicologia", "Pía Psicóloga");
    const a = await crearCuenta({ rol: "paciente", nombre: "Ana Accesible" });
    const r = await a.c.rpc("reservar_cita", { p_servicio: p.servicio, p_inicio: lunes(9).iso });
    await p.c.from("fichas").insert({ profesional_id: p.id, paciente_id: a.id, diagnostico: "Tendinitis rotuliana", alergias: "Penicilina", datos_especialidad: { kinesiologia: { zona: "Rodilla derecha", sesiones_indicadas: 10 } } });
    const { data: f } = await p.c.from("fichas").select("id").eq("paciente_id", a.id).single();
    await p.c.from("atenciones").insert({ ficha_id: f!.id, profesional_id: p.id, paciente_id: a.id, cita_id: r.data.id, motivo: "Evaluación", datos_especialidad: { kinesiologia: { eva: 6 } } });
    await p.c.rpc("derivar_paciente", { p_paciente: a.id, p_a_profesional: otra.id, p_motivo: "Manejo del dolor crónico", p_resumen: null });
    pro = p.email;
    pac = a.email;
    pacId = a.id;
  });

  async function entrar(page: import("@playwright/test").Page, email: string) {
    await page.goto("/ingresar");
    await page.getByLabel("Correo").fill(email);
    await page.getByLabel("Contraseña").fill("clave-segura-123");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"));
  }

  test("panel profesional sin fallas WCAG AA", async ({ page }, info) => {
    await entrar(page, pro);
    for (const ruta of ["/panel", "/panel/pacientes", `/panel/pacientes/${pacId}`, "/panel/derivaciones", "/panel/indicadores", "/panel/perfil", "/panel/servicios"]) {
      await page.goto(ruta);
      if (process.env.CAPTURAS) await page.screenshot({ path: `test-results/capturas/${info.project.name}${ruta.replace(/\//g, "_").replace(/_[0-9a-f-]{36}/, "_ficha")}.png`, fullPage: true });
      const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const graves = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      expect(graves.map((v) => `${ruta} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
    }
  });

  test("vista de paciente sin fallas WCAG AA", async ({ page }, info) => {
    await entrar(page, pac);
    await page.goto("/mis-citas");
    if (process.env.CAPTURAS) await page.screenshot({ path: `test-results/capturas/${info.project.name}_mis-citas.png`, fullPage: true });
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
  });
});
