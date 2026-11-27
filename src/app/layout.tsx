import type { Metadata } from "next";
import { Rethink_Sans, Zilla_Slab } from "next/font/google";
import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Marca } from "@/components/marca";
import "./globals.css";

// Titulares en Zilla Slab (la letra de una agenda impresa); texto y cifras en Rethink Sans.
const titulo = Zilla_Slab({ variable: "--font-zilla", subsets: ["latin"], weight: ["500", "600", "700"] });
const texto = Rethink_Sans({ variable: "--font-rethink", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Agenda Salud", template: "%s · Agenda Salud" },
  description: "Agenda online, ficha clínica y recordatorios para matronas independientes.",
};

const enlaceNav = "rounded-lg px-3 py-2 font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-tinta";

async function Encabezado() {
  const sesion = await obtenerSesion();
  const esPro = sesion?.perfil.rol === "profesional";
  return (
    <header className="border-b border-tinta/15 bg-hormigon">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="Agenda Salud, inicio" className="rounded-lg">
          <Marca />
        </Link>
        <nav className="-mx-3 flex flex-wrap items-center gap-0.5 text-[15px]">
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
              <Link href="/ingresar" className={enlaceNav}>Ingresar</Link>
              <Link href="/registro" className="btn ml-2 min-h-10">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${titulo.variable} ${texto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Encabezado />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">{children}</main>
        <footer className="border-t-2 border-tinta bg-hormigon">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-600">
            <Marca />
            <p>Datos clínicos protegidos conforme a la Ley 21.719.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
