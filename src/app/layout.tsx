import type { Metadata } from "next";
import { Schibsted_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Marca } from "@/components/marca";
import "./globals.css";

// Una sola familia, con pesos marcados: titulares 700-800, texto 400, interfaz 500-600.
const schibsted = Schibsted_Grotesk({ variable: "--font-schibsted", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Agenda Salud", template: "%s | Agenda Salud" },
  description: "Agenda online, ficha clínica y recordatorios para matronas y matrones independientes en Chile.",
};

const enlaceNav = "rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-tinta";

async function Encabezado() {
  const sesion = await obtenerSesion();
  const esPro = sesion?.perfil.rol === "profesional";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="contenedor flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <Link href="/" aria-label="Agenda Salud, inicio" className="rounded-lg">
          <Marca />
        </Link>
        <nav className="-mr-3 flex flex-wrap items-center gap-0.5 text-[15px]">
          <Link href="/profesionales" className={enlaceNav}>Buscar matrona</Link>
          {sesion ? (
            <>
              {esPro ? (
                <Link href="/panel" className={enlaceNav}>Mi agenda</Link>
              ) : (
                <Link href="/mis-citas" className={enlaceNav}>Mis citas</Link>
              )}
              <Link href="/cuenta" className={enlaceNav}>{sesion.perfil.nombre.split(" ")[0]}</Link>
              <form action={cerrarSesion}>
                <button className={`${enlaceNav} cursor-pointer text-slate-500`}>Salir</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/registro?rol=profesional" className={`${enlaceNav} hidden sm:block`}>Soy matrona</Link>
              <Link href="/ingresar" className={enlaceNav}>Ingresar</Link>
              <Link href="/registro" className="btn mr-3 ml-2 min-h-10">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function Pie() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="contenedor grid gap-8 py-10 text-[15px] sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Marca />
          <p className="max-w-[36ch] text-slate-600">Agenda, ficha clínica y recordatorios para matronas y matrones independientes en Chile.</p>
        </div>
        <div>
          <p className="font-semibold">Pacientes</p>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            <li><Link className="hover:text-tinta hover:underline" href="/profesionales">Buscar matrona</Link></li>
            <li><Link className="hover:text-tinta hover:underline" href="/mis-citas">Mis citas</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Matronas</p>
          <ul className="mt-2 space-y-1.5 text-slate-600">
            <li><Link className="hover:text-tinta hover:underline" href="/registro?rol=profesional">Crear mi agenda</Link></li>
            <li><Link className="hover:text-tinta hover:underline" href="/ingresar">Ingresar al panel</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <p className="contenedor py-4 text-sm text-slate-500">Datos clínicos protegidos conforme a la Ley 21.719.</p>
      </div>
    </footer>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ruta = (await headers()).get("x-ruta") ?? "";
  const enPanel = ruta === "/panel" || ruta.startsWith("/panel/");
  return (
    <html lang="es" className={`${schibsted.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {!enPanel && <Encabezado />}
        <main className="flex-1">{children}</main>
        {!enPanel && <Pie />}
      </body>
    </html>
  );
}
