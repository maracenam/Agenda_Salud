import { defineConfig, devices } from "@playwright/test";

/**
 * Pruebas de extremo a extremo (E2E) contra la aplicación compilada y Supabase local.
 * Antes: npx supabase start, y un .env.local apuntando a http://127.0.0.1:54321.
 */
// Datos de prueba únicos por corrida, compartidos por los dos proyectos.
process.env.E2E_SUFIJO ??= Math.random().toString(36).slice(2, 7);

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:3100", trace: "off", locale: "es-CL", timezoneId: "America/Santiago" },
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"] } },
    { name: "celular", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
