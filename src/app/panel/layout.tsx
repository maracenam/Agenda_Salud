import Link from "next/link";
import { requerirProfesional } from "@/lib/sesion";

const ENLACES = [
  { href: "/panel", t: "Agenda" },
  { href: "/panel/pacientes", t: "Pacientes" },
  { href: "/panel/horarios", t: "Horarios" },
  { href: "/panel/servicios", t: "Prestaciones" },
  { href: "/panel/perfil", t: "Mi perfil" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { id, supabase } = await requerirProfesional();
  const { data: pro } = await supabase.from("profesionales").select("publicado").eq("id", id).single();
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 text-sm">
        {ENLACES.map((e) => (
          <Link key={e.href} href={e.href} className="rounded-lg px-3 py-1.5 hover:bg-marca-50 hover:text-marca-800">
            {e.t}
          </Link>
        ))}
        <Link href={`/profesionales/${id}`} className="ml-auto rounded-lg px-3 py-1.5 text-slate-500 hover:bg-slate-50">
          Ver mi página pública
        </Link>
      </nav>
      {!pro?.publicado && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu página aún no está publicada, así que nadie puede reservar contigo. Agrega al menos una prestación y un horario, y luego publícala en{" "}
          <Link href="/panel/perfil" className="font-medium underline">Mi perfil</Link>.
        </p>
      )}
      {children}
    </div>
  );
}
