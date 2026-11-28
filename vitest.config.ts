import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // server-only lanza error fuera de Next; en pruebas se reemplaza por un módulo vacío.
      "server-only": path.resolve(__dirname, "tests/vacio.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/integracion/**/*.test.ts", "tests/seguridad/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    coverage: { include: ["src/lib/**"], reporter: ["text-summary", "text"] },
  },
});
