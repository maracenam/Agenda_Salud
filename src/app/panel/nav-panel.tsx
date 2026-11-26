"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendario, Ficha, Reloj } from "@/components/marca";

function IconoPerfil({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function IconoLista({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" aria-hidden="true">
      <path d="M9 6.5h11M9 12h11M9 17.5h11" />
      <circle cx="4.75" cy="6.5" r="1" fill="currentColor" />
      <circle cx="4.75" cy="12" r="1" fill="currentColor" />
      <circle cx="4.75" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

const ENLACES = [
  { href: "/panel", t: "Agenda", I: Calendario },
  { href: "/panel/pacientes", t: "Pacientes", I: Ficha },
  { href: "/panel/horarios", t: "Horarios", I: Reloj },
  { href: "/panel/servicios", t: "Prestaciones", I: IconoLista },
  { href: "/panel/perfil", t: "Mi perfil", I: IconoPerfil },
];

export function NavPanel({ id }: { id: string }) {
  const ruta = usePathname();
  return (
    <nav aria-label="Panel profesional" className="min-w-0 lg:sticky lg:top-6">
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
        {ENLACES.map(({ href, t, I }) => {
          const activo = href === "/panel" ? ruta === "/panel" : ruta.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={activo ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-semibold whitespace-nowrap transition-colors ${
                  activo ? "bg-marca-700 text-white" : "text-slate-700 hover:bg-white hover:text-tinta"
                }`}
              >
                <I className="size-5 shrink-0" />
                {t}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href={`/profesionales/${id}`} className="enlace mt-3 hidden px-3 text-sm lg:block">
        Ver mi página pública
      </Link>
    </nav>
  );
}
