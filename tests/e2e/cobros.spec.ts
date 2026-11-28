import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * CU-12 y CU-13 en el navegador: atendida y cobrada en un toque con el bono propuesto,
 * cierre del día de varias citas juntas, Mis ingresos, boleta emitida y exportar a Excel.
 */
test.describe.configure({ mode: "serial" });

let pro = "";
let citas: string[] = [];

test.beforeAll(async () => {
  const { admin, crearCuenta, lunes, profesionalLista } = await import("../integracion/apoyo");
  const p = await profesionalLista("matroneria", "Mía Matrona");
  await p.c.from("profesionales").update({ recibe_bono_fonasa: true }).eq("id", p.id);
  const ana = await crearCuenta({ rol: "paciente", nombre: "Ana Fonasa" });
  await ana.c.from("perfiles").update({ prevision: "fonasa" }).eq("id", ana.id);
  const bea = await crearCuenta({ rol: "paciente", nombre: "Bea Particular" });
  await bea.c.from("perfiles").update({ prevision: "particular" }).eq("id", bea.id);
  const caro = await crearCuenta({ rol: "paciente", nombre: "Caro Ausente" });
  citas = [];
  for (const [i, pac] of [ana, bea, caro].entries()) {
    const r = await pac.c.rpc("reservar_cita", { p_servicio: p.servicio, p_inicio: lunes(9 + i).iso });
    if (r.error) throw r.error;
    citas.push(r.data.id);
  }
  // Las tres citas fueron hoy, hace unas horas.
  const base = Date.now() - 4 * 3600e3;
  for (const [i, id] of citas.entries()) {
    const inicio = new Date(base + i * 40 * 60e3);
    await admin().from("citas").update({ inicio: inicio.toISOString(), fin: new Date(inicio.getTime() + 30 * 60e3).toISOString() }).eq("id", id);
  }
  pro = p.email;
});

async function entrar(page: Page) {
  await page.context().clearCookies();
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(pro);
  await page.getByLabel("Contraseña").fill("clave-segura-123");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"));
}

const axe = async (page: Page, ruta: string) => {
  const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${ruta} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`)).toEqual([]);
};

test("un toque: atendida y cobrada con el bono Fonasa propuesto", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "una sola vez");
  await entrar(page);
  await page.goto(`/panel?cita=${citas[0]}`);
  const panel = page.getByRole("region", { name: "Cita elegida" });
  await expect(panel.getByLabel("Medio de pago")).toHaveValue("bono_fonasa");
  await expect(panel.getByLabel("Monto")).toHaveValue("25000");
  await panel.getByLabel(/Folio del bono/).fill("998877");
  await panel.getByRole("button", { name: "Atendida y cobrada" }).click();
  await expect(page.getByText("Cobro de $25.000 registrado")).toBeVisible();
  await expect(page.getByRole("region", { name: "Cita elegida" })).toContainText("Cobrado $25.000 · Bono Fonasa");
});

test("cierre del día: una atendida en transferencia y una inasistencia", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "una sola vez");
  await entrar(page);
  await page.goto("/panel");
  await page.getByRole("link", { name: "Cerrar el día" }).click();
  await expect(page.getByRole("heading", { name: "Cierre del día" })).toBeVisible();
  await axe(page, "/panel/cierre");
  const filaBea = page.getByRole("listitem").filter({ hasText: "Bea Particular" });
  await expect(filaBea.getByLabel("Medio de pago")).toHaveValue("transferencia");
  const filaCaro = page.getByRole("listitem").filter({ hasText: "Caro Ausente" });
  await filaCaro.getByText("No asistió").click();
  await page.getByRole("button", { name: "Cerrar el día" }).click();
  await expect(page.getByText("Día cerrado: 1 atendida y 1 sin asistir.")).toBeVisible();
  await expect(page.getByText("No hay citas por cerrar este día.")).toBeVisible();
});

test("Mis ingresos: total, retención, boleta y exportar", async ({ page }, info) => {
  await entrar(page);
  await page.goto("/panel/ingresos");
  if (info.project.name !== "escritorio") {
    // En celular el beforeAll crea otra profesional sin cobros: solo accesibilidad y captura.
    await axe(page, "/panel/ingresos");
    if (process.env.CAPTURAS) await page.screenshot({ path: `test-results/capturas/${info.project.name}_ingresos.png`, fullPage: true });
    return;
  }
  const resumen = page.getByRole("region", { name: "Resumen del mes" });
  await expect(resumen).toContainText("$50.000");
  await expect(resumen).toContainText("Retención estimada (15,25%)");
  await expect(resumen).toContainText("$7.625");
  await expect(resumen).toContainText("$42.375");
  await axe(page, "/panel/ingresos");
  if (process.env.CAPTURAS) await page.screenshot({ path: `test-results/capturas/${info.project.name}_ingresos.png`, fullPage: true });

  const descarga = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar a Excel" }).click();
  const archivo = await descarga;
  expect(archivo.suggestedFilename()).toMatch(/^ingresos-\d{4}-\d{2}\.csv$/);

  await page.getByLabel("Elegir cobro de Ana Fonasa").check();
  await page.getByLabel(/N° de boleta/).fill("51");
  await page.getByRole("button", { name: "Marcar con boleta emitida" }).click();
  await expect(page.getByText("1 atención quedó con boleta emitida.")).toBeVisible();
  await expect(page.getByText("Emitida N° 51")).toBeVisible();
});
