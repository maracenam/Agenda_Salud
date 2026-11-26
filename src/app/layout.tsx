import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Marca } from "@/components/marca";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const barlowCondensed = Barlow_Condensed({ variable: "--font-barlow-condensed", subsets: ["latin"], weight: ["500", "600", "700"] });

export const metadata: Metadata = {
  title: { default: "Agenda Salud", template: "%s · Agenda Salud" },
  description: "Agenda online, ficha clínica y recordatorios para matronas independientes.",
};

const enlaceNav = "rounded-md px-2.5 py-1.5 font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white";

async function Encabezado() {
  const sesion = await obtenerSesion();
  const esPro = sesion?.perfil.rol === "profesional";
  return (
    <header className="bg-tinta text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="Agenda Salud, inicio" className="rounded-md">
          <Marca claro />
        </Link>
        <nav className="-mx-2.5 flex flex-wrap items-center gap-1 text-[15px]">
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
                <button className={`${enlaceNav} cursor-pointer text-white/60`}>Salir</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/ingresar" className={enlaceNav}>Ingresar</Link>
              <Link href="/registro" className="ml-1.5 rounded-md bg-white px-3 py-1.5 font-semibold text-tinta transition-colors hover:bg-senal">
                Crear cuenta
              </Link>
            </>
          )}
        </nav>
      </div>
      {/* Franja de líneas: burdeos (pacientes) y cobalto (profesionales). */}
      <div className="flex h-1.5" aria-hidden="true">
        <span className="flex-1 bg-marca-700" />
        <span className="flex-1 bg-pro-700" />
        <span className="w-16 bg-senal" />
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Encabezado />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <footer className="bg-tinta text-white/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm">
            <Marca claro className="scale-90 origin-left" />
            <p>Datos clínicos protegidos conforme a la Ley 21.719.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
