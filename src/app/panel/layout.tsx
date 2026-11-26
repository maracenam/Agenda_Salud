import Link from "next/link";
import { requerirProfesional } from "@/lib/sesion";
import { NavPanel } from "./nav-panel";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { id, supabase } = await requerirProfesional();
  const { data: pro } = await supabase.from("profesionales").select("publicado").eq("id", id).single();
  return (
    <div className="linea-pro space-y-6">
      <NavPanel id={id} />
      {!pro?.publicado && (
        <p className="rounded-lg border-2 border-senal bg-senal-claro px-4 py-3 text-[15px] text-tinta">
          <strong className="font-semibold">Tu página aún no está publicada</strong>, así que nadie puede reservar contigo. Agrega al menos una prestación y un horario, y luego publícala en{" "}
          <Link href="/panel/perfil" className="font-semibold underline">Mi perfil</Link>.
        </p>
      )}
      {children}
    </div>
  );
}
