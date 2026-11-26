import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { obtenerSesion } from "@/lib/sesion";
import { cerrarSesion } from "@/app/(auth)/acciones";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Agenda Salud", template: "%s · Agenda Salud" },
  description: "Agenda online, ficha clínica y recordatorios para matronas independientes.",
};

async function Encabezado() {
  const sesion = await obtenerSesion();
  const esPro = sesion?.perfil.rol === "profesional";
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-marca-700">
          Agenda Salud
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/profesionales" className="hover:text-marca-700">Buscar matrona</Link>
          {sesion ? (
            <>
              {esPro ? (
                <Link href="/panel" className="hover:text-marca-700">Mi agenda</Link>
              ) : (
                <Link href="/mis-citas" className="hover:text-marca-700">Mis citas</Link>
              )}
              <Link href="/cuenta" className="hover:text-marca-700">{sesion.perfil.nombre.split(" ")[0]}</Link>
              <form action={cerrarSesion}>
                <button className="text-slate-500 hover:text-slate-800 cursor-pointer">Salir</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/ingresar" className="hover:text-marca-700">Ingresar</Link>
              <Link href="/registro" className="btn">Crear cuenta</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Encabezado />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          Agenda Salud · Datos clínicos protegidos conforme a la Ley 21.719
        </footer>
      </body>
    </html>
  );
}
