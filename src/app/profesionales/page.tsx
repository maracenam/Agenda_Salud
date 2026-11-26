import Link from "next/link";
import { iniciales } from "@/lib/iniciales";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Flecha, Lupa, Ubicacion } from "@/components/marca";

export const metadata = { title: "Buscar matrona" };

type Fila = {
  id: string;
  titulo: string | null;
  comuna: string | null;
  bio: string | null;
  perfil: { nombre: string } | null;
  especialidad: { nombre: string } | null;
  servicios: { id: string }[];
};

export default async function Profesionales({ searchParams }: PageProps<"/profesionales">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("profesionales")
    .select("id, titulo, comuna, bio, perfil:perfiles!profesionales_id_fkey(nombre), especialidad:especialidades(nombre), servicios(id)")
    .eq("publicado", true)
    .eq("servicios.activo", true)
    .order("creado_en");
  if (q) consulta = consulta.ilike("comuna", `%${q}%`);
  const { data } = await consulta;
  const lista = (data ?? []) as unknown as Fila[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="titulo">Matronas disponibles</h1>
          <p className="mt-2 text-lg text-slate-700">Elige una profesional y reserva tu hora en línea.</p>
        </div>
        <form className="flex w-full max-w-md gap-2">
          <label htmlFor="q" className="sr-only">Comuna</label>
          <div className="relative flex-1">
            <Lupa className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500" />
            <input className="campo pl-10" id="q" name="q" defaultValue={q} placeholder="Filtrar por comuna" />
          </div>
          <button className="btn-sec">Buscar</button>
        </form>
      </div>
      {lista.length === 0 ? (
        <div className="tarjeta text-center">
          <p className="font-senal text-2xl font-bold">Sin matronas publicadas{q ? ` en ${q}` : " todavía"}</p>
          <p className="mt-1 text-slate-600">{q ? "Prueba con otra comuna o quita el filtro." : "Vuelve pronto: las profesionales están armando sus agendas."}</p>
          {q && <Link href="/profesionales" className="btn-sec mt-4">Ver todas</Link>}
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id} className="tarjeta flex flex-col gap-4 overflow-hidden p-0">
              <p className="flex items-center gap-1.5 bg-marca-700 px-5 py-2 font-senal text-[17px] font-bold tracking-wide text-white uppercase">
                <Ubicacion className="size-4" />
                {p.comuna || "Sin comuna"}
              </p>
              <div className="flex items-start gap-4 px-5">
                <span className="insignia size-12 text-xl">{iniciales(p.perfil?.nombre)}</span>
                <div className="min-w-0">
                  <h2 className="font-senal text-2xl leading-tight font-bold">{p.perfil?.nombre}</h2>
                  <p className="font-medium text-marca-700">{p.titulo || p.especialidad?.nombre}</p>
                </div>
              </div>
              {p.bio && <p className="line-clamp-3 px-5 text-slate-700">{p.bio}</p>}
              <div className="mt-auto flex items-center justify-between gap-3 border-t border-tinta/10 px-5 py-3">
                <span className="text-sm font-medium text-slate-600">
                  {p.servicios.length} {p.servicios.length === 1 ? "prestación" : "prestaciones"}
                </span>
                <Link href={`/profesionales/${p.id}`} className="btn">
                  Ver horas <Flecha className="size-4" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

