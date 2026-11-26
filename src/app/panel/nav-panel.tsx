"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ENLACES = [
  { href: "/panel", t: "Agenda" },
  { href: "/panel/pacientes", t: "Pacientes" },
  { href: "/panel/horarios", t: "Horarios" },
  { href: "/panel/servicios", t: "Prestaciones" },
  { href: "/panel/perfil", t: "Mi perfil" },
];

export function NavPanel({ id }: { id: string }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Panel profesional" className="flex flex-wrap items-center gap-1 rounded-xl bg-pro-700 p-1.5 text-[15px] text-white">
      <span className="insignia mx-1.5 size-7 bg-white text-pro-700" aria-hidden="true">M</span>
      {ENLACES.map((e) => {
        const activo = e.href === "/panel" ? ruta === "/panel" : ruta.startsWith(e.href);
        return (
          <Link
            key={e.href}
            href={e.href}
            aria-current={activo ? "page" : undefined}
            className={`rounded-md px-3 py-1.5 font-semibold transition-colors ${activo ? "bg-white text-pro-800" : "text-white/85 hover:bg-white/15 hover:text-white"}`}
          >
            {e.t}
          </Link>
        );
      })}
      <Link href={`/profesionales/${id}`} className="ml-auto rounded-md px-3 py-1.5 font-medium text-white/75 underline-offset-3 hover:text-white hover:underline">
        Ver mi página pública
      </Link>
    </nav>
  );
}
