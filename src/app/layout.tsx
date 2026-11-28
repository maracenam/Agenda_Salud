import type { Metadata } from "next";
import { Instrument_Sans, Young_Serif } from "next/font/google";
import { headers } from "next/headers";
import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Marca } from "@/components/marca";
import "./globals.css";

// Young Serif para títulos y marca (un solo peso); Instrument Sans para texto, interfaz y horas.
const young = Young_Serif({ variable: "--font-young", subsets: ["latin"], weight: "400" });
const instrument = Instrument_Sans({ variable: "--font-instrument", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Agenda Salud", template: "%s | Agenda Salud" },
  description: "Agenda online, ficha clínica por especialidad y recordatorios para profesionales de la salud independientes en Chile.",
};

const enlaceNav = "rounded-full px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-tinta";

async function Encabezado() {
  const sesion = await obtenerSesion();
  const esPro = sesion?.perfil.rol === "profesional";
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-hormigon/95 backdrop-blur-sm">
      <div className="contenedor flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-1 py-2">
        <Link href="/" aria-label="Agenda Salud, inicio" className="rounded-lg">
          <Marca />
        </Link>
        <nav className="-mr-3 flex flex-wrap items-center gap-0.5 text-[15px]">
          <Link href="/profesionales" className={enlaceNav}>Buscar profesional</Link>
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
              <Link href="/registro?rol=profesional" className={`${enlaceNav} hidden sm:block`}>Soy profesional</Link>
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
    <footer className="bg-noche text-white">
      <div className="contenedor grid gap-8 py-10 text-[15px] sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Marca claro />
          <p className="max-w-[36ch] text-marca-100">Agenda, ficha clínica y recordatorios para profesionales de la salud independientes en Chile.</p>
        </div>
        <div>
          <p className="font-semibold">Pacientes</p>
          <ul className="mt-2 space-y-1.5 text-marca-100">
            <li><Link className="hover:text-white hover:underline" href="/profesionales">Buscar profesional</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/mis-citas">Mis citas</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold">Profesionales</p>
          <ul className="mt-2 space-y-1.5 text-marca-100">
            <li><Link className="hover:text-white hover:underline" href="/registro?rol=profesional">Crear mi agenda</Link></li>
            <li><Link className="hover:text-white hover:underline" href="/ingresar">Ingresar al panel</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="contenedor py-4 text-sm text-marca-200"><Link className="hover:text-white hover:underline" href="/seguridad">Cómo protegemos los datos de tus pacientes</Link></p>
      </div>
    </footer>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const ruta = (await headers()).get("x-ruta") ?? "";
  const enPanel = ruta === "/panel" || ruta.startsWith("/panel/");
  return (
    <html lang="es" className={`${young.variable} ${instrument.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {!enPanel && <Encabezado />}
        <main className="flex-1">{children}</main>
        {!enPanel && <Pie />}
      </body>
    </html>
  );
}
