import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";

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
    <div>
      <h1 className="titulo mb-2">Matronas disponibles</h1>
      <p className="mb-6 text-sm text-slate-600">Elige una profesional y reserva tu hora en línea.</p>
      <form className="mb-6 flex gap-2">
        <input className="campo max-w-xs" name="q" defaultValue={q} placeholder="Filtrar por comuna" />
        <button className="btn-sec">Buscar</button>
      </form>
      {lista.length === 0 ? (
        <p className="tarjeta text-sm text-slate-600">Todavía no hay profesionales publicadas{q ? " en esa comuna" : ""}.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lista.map((p) => (
            <li key={p.id} className="tarjeta flex flex-col">
              <h2 className="font-semibold text-slate-900">{p.perfil?.nombre}</h2>
              <p className="text-sm text-marca-700">{p.titulo || p.especialidad?.nombre}</p>
              {p.comuna && <p className="text-sm text-slate-500">{p.comuna}</p>}
              {p.bio && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{p.bio}</p>}
              <div className="mt-4 flex-1 content-end">
                <Link href={`/profesionales/${p.id}`} className="btn">
                  Ver horas ({p.servicios.length} {p.servicios.length === 1 ? "prestación" : "prestaciones"})
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
