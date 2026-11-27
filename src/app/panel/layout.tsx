import Link from "next/link";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Marca } from "@/components/marca";
import { requerirProfesional } from "@/lib/sesion";
import { NavPanel } from "./nav-panel";

/* El panel tiene su propio marco: barra lateral ciruela noche y área de trabajo clara. */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id, perfil, supabase } = await requerirProfesional();
  const { data: pro } = await supabase
    .from("profesionales")
    .select("publicado")
    .eq("id", id)
    .single();
  return (
    <div className="linea-pro min-h-screen lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside className="bg-noche text-white">
        <div className="lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
          <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-3 lg:px-5 lg:pt-6 lg:pb-8">
            <Link
              href="/panel"
              aria-label="Agenda Salud, mi agenda"
              className="rounded-lg"
            >
              <Marca claro />
            </Link>
            <form action={cerrarSesion} className="lg:hidden">
              <button className="cursor-pointer rounded-lg px-2 py-1.5 text-sm font-medium text-marca-200 hover:text-white">
                Salir
              </button>
            </form>
          </div>
          <NavPanel />
          <div className="mt-auto hidden space-y-4 border-t border-white/10 px-5 py-5 text-sm lg:block">
            <Link
              href={`/profesionales/${id}`}
              className="block font-semibold text-marca-100 hover:text-white hover:underline"
            >
              Ver mi página pública
            </Link>
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/cuenta"
                className="min-w-0 truncate text-marca-200 hover:text-white"
              >
                {perfil.nombre}
              </Link>
              <form action={cerrarSesion}>
                <button className="cursor-pointer rounded-md px-2 py-1 font-medium text-marca-200 hover:bg-white/10 hover:text-white">
                  Salir
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>
      <div className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        {!pro?.publicado && (
          <p className="mb-6 rounded-xl border border-[#f3d6b4] bg-alerta-claro px-4 py-3 text-[15px] text-[#5c2d07]">
            <strong className="font-semibold">
              Tu página aún no está publicada
            </strong>
            , así que nadie puede reservar contigo. Agrega una prestación y un
            horario, y publícala en{" "}
            <Link href="/panel/perfil" className="font-semibold underline">
              Mi perfil
            </Link>
            .
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
