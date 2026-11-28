import { expect, test, type Page } from "@playwright/test";

/**
 * Recorrido completo en el navegador, con una especialidad distinta de matronería
 * (nutrición): registro profesional, configuración, publicación, reserva de una paciente,
 * ficha con datos de la especialidad, atención, indicadores y derivación.
 */
// El sufijo lo fija playwright.config.ts para que ambos proyectos (escritorio y celular) compartan datos.
const s = process.env.E2E_SUFIJO ?? "local";
const pro = { nombre: `Nina Nutri ${s}`, email: `nina-${s}@prueba.test` };
const kine = { nombre: `Kevin Kine ${s}`, email: `kevin-${s}@prueba.test` };
const pac = { nombre: `Paula Paciente ${s}`, email: `paula-${s}@prueba.test` };
const CLAVE = "clave-segura-123";

function proximoLunes() {
  const hoy = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date()) + "T12:00:00Z");
  const dow = hoy.getUTCDay();
  hoy.setUTCDate(hoy.getUTCDate() + ((8 - dow) % 7 || 7) + 7);
  return hoy.toISOString().slice(0, 10);
}

async function registrar(page: Page, p: { nombre: string; email: string }, especialidad?: string) {
  await page.goto(especialidad ? "/registro?rol=profesional" : "/registro");
  if (especialidad) await page.getByLabel("Tu especialidad").selectOption(especialidad);
  await page.getByLabel("Nombre completo").fill(p.nombre);
  await page.getByLabel("Correo").fill(p.email);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByText("Acepto que mis datos").click();
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/registro"));
}

async function ingresar(page: Page, email: string) {
  await page.context().clearCookies();
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(CLAVE);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/ingresar"));
}

async function configurarYPublicar(page: Page) {
  await page.goto("/panel/servicios");
  await page.locator("form button", { hasText: /Evaluación|Atención|Sesión|Control/ }).first().click();
  await expect(page.getByText("Prestación guardada.")).toBeVisible();
  await page.goto("/panel/horarios");
  await page.getByRole("button", { name: "Agregar franja" }).click();
  await expect(page.getByText("Horario agregado.")).toBeVisible();
  await page.goto("/panel/perfil");
  await page.getByLabel("Comuna").fill("Ñuñoa");
  await page.getByText("Publicar mi página").click();
  await page.getByRole("button", { name: "Guardar perfil" }).click();
  await expect(page.getByText("Tu página está publicada")).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("la profesional de nutrición se registra, configura y publica", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "el alta se hace una vez");
  await registrar(page, pro, "nutricion");
  await expect(page).toHaveURL(/\/panel\/perfil/);
  await expect(page.getByLabel("Especialidad")).toHaveValue(/\d+/);
  await expect(page.getByLabel("Especialidad").locator("option:checked")).toHaveText("Nutrición");
  await configurarYPublicar(page);
  // Una colega de kinesiología, para la derivación
  await page.context().clearCookies();
  await registrar(page, kine, "kinesiologia");
  await configurarYPublicar(page);
});

test("la paciente encuentra a la nutricionista por especialidad y reserva", async ({ page }) => {
  await registrar(page, { ...pac, email: page.viewportSize()!.width < 600 ? `m-${pac.email}` : pac.email });
  await page.goto("/profesionales");
  await page.getByRole("navigation", { name: "Especialidades" }).getByRole("link", { name: "Nutrición" }).click();
  await expect(page).toHaveURL(/especialidad=nutricion/);
  await page.getByRole("link", { name: pro.nombre }).click();
  await expect(page.getByText("Nutricionista").first()).toBeVisible();
  await page.getByRole("link", { name: /Evaluación|Control|Plan/ }).first().click();
  await page.waitForURL(/\/reservar\?servicio=/);
  await page.goto(page.url() + `&fecha=${proximoLunes()}`);
  const hora = page.locator("label:has(input[name=inicio])").first();
  await hora.click();
  await page.getByLabel(/Motivo/).fill("Quiero ordenar mi alimentación");
  await page.getByRole("button", { name: "Confirmar reserva" }).click();
  await expect(page).toHaveURL(/\/mis-citas/);
  await expect(page.getByText("Tu hora quedó reservada")).toBeVisible();
  await expect(page.getByText(pro.nombre).first()).toBeVisible();
});

test("la nutricionista abre la ficha, registra la atención y ve el IMC", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "una sola vez");
  await ingresar(page, pro.email);
  await expect(page).toHaveURL(/\/panel/);
  await page.goto("/panel/pacientes");
  await page.getByRole("link", { name: pac.nombre }).first().click();
  await expect(page.getByRole("heading", { name: pac.nombre })).toBeVisible();
  await expect(page.getByRole("group", { name: "Evaluación nutricional" })).toBeVisible();
  const ficha = page.locator("form", { has: page.getByRole("button", { name: "Guardar ficha" }) });
  await ficha.getByLabel(/^Talla/).fill("165");
  await ficha.getByLabel("Objetivo").selectOption("Bajar de peso");
  await ficha.getByLabel("Diagnóstico", { exact: true }).fill("Sobrepeso");
  await ficha.getByRole("button", { name: "Guardar ficha" }).click();
  await expect(page.getByText("Ficha guardada.")).toBeVisible();
  const atencion = page.locator("form", { has: page.getByRole("button", { name: "Guardar atención" }) });
  await atencion.getByLabel(/^Peso/).fill("72.5");
  await atencion.getByLabel("Notas de evolución").fill("Primera evaluación");
  await page.getByRole("button", { name: "Guardar atención" }).click();
  await expect(page.getByText("Atención registrada en el historial.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Resumen clínico" })).toContainText("26,6");
  await expect(page.getByRole("region", { name: "Resumen clínico" })).toContainText("Sobrepeso");

  // Derivación a kinesiología
  await page.getByText("Derivar a una colega").click();
  await page.getByLabel("Colega", { exact: true }).selectOption({ label: `${kine.nombre}, Kinesiología` });
  await page.getByLabel("Motivo", { exact: true }).fill("Dolor de rodilla al hacer ejercicio");
  await page.getByRole("button", { name: "Enviar derivación" }).click();
  await expect(page.getByText("Derivación enviada.")).toBeVisible();

  await page.goto("/panel/indicadores");
  await expect(page.getByRole("heading", { name: "Indicadores" })).toBeVisible();
  await expect(page.getByText("Citas agendadas")).toBeVisible();
});

test("el kinesiólogo acepta la derivación y la paciente la ve", async ({ page }, info) => {
  test.skip(info.project.name !== "escritorio", "una sola vez");
  await ingresar(page, kine.email);
  await page.goto("/panel/derivaciones");
  await expect(page.getByText(pac.nombre)).toBeVisible();
  await page.getByRole("button", { name: "Aceptar" }).click();
  await expect(page.getByText("Derivación aceptada.")).toBeVisible();
  await ingresar(page, pac.email);
  await page.goto("/mis-citas");
  await expect(page.getByRole("heading", { name: "Te derivaron" })).toBeVisible();
  await expect(page.getByText(kine.nombre)).toBeVisible();
});

test("las páginas no tienen errores de CSP ni de consola", async ({ page }) => {
  const errores: string[] = [];
  page.on("console", (m) => m.type() === "error" && errores.push(m.text()));
  page.on("pageerror", (e) => errores.push(e.message));
  for (const ruta of ["/", "/profesionales", "/registro", "/ingresar"]) {
    await page.goto(ruta);
    await page.waitForLoadState("networkidle");
  }
  expect(errores).toEqual([]);
});

test("sin sesión, el panel redirige a ingresar", async ({ page }) => {
  await page.context().clearCookies();
  await page.goto("/panel/pacientes");
  await expect(page).toHaveURL(/\/ingresar\?siguiente=%2Fpanel%2Fpacientes/);
});
