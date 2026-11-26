import Link from "next/link";
import { requerirProfesional } from "@/lib/sesion";
import { NavPanel } from "./nav-panel";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { id, supabase } = await requerirProfesional();
  const { data: pro } = await supabase.from("profesionales").select("publicado").eq("id", id).single();
  return (
    <div className="linea-pro grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <NavPanel id={id} />
      <div className="min-w-0 space-y-6">
        {!pro?.publicado && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-950">
            <strong className="font-semibold">Tu página aún no está publicada</strong>, así que nadie puede reservar contigo. Agrega al menos una prestación y un horario, y luego publícala en{" "}
            <Link href="/panel/perfil" className="font-semibold underline">Mi perfil</Link>.
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
