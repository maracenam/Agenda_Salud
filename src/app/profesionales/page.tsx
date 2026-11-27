import Link from "next/link";
import { iniciales } from "@/lib/iniciales";
import { formatoPrecio } from "@/lib/fechas";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Lupa, Ubicacion } from "@/components/marca";

export const metadata = { title: "Buscar matrona" };

type Fila = {
  id: string;
  titulo: string | null;
  comuna: string | null;
  bio: string | null;
  perfil: { nombre: string } | null;
  especialidad: { nombre: string } | null;
  servicios: { id: string; nombre: string; precio: number | null }[];
};

export default async function Profesionales({ searchParams }: PageProps<"/profesionales">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const supabase = await crearClienteServidor();
  let consulta = supabase
    .from("profesionales")
    .select("id, titulo, comuna, bio, perfil:perfiles!profesionales_id_fkey(nombre), especialidad:especialidades(nombre), servicios(id, nombre, precio)")
    .eq("publicado", true)
    .eq("servicios.activo", true)
    .order("creado_en");
  if (q) consulta = consulta.ilike("comuna", `%${q}%`);
  const { data } = await consulta;
  const lista = (data ?? []) as unknown as Fila[];

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="contenedor py-10 sm:py-12">
          <h1 className="titulo max-w-[20ch] sm:text-[40px] sm:leading-[1.05]">Matronas con hora disponible</h1>
          <form role="search" className="mt-6 flex max-w-xl gap-2">
            <label htmlFor="q" className="sr-only">Comuna</label>
            <div className="relative flex-1">
              <Lupa className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-500" />
              <input className="campo min-h-12 pl-11 text-[17px]" id="q" name="q" type="search" defaultValue={q} placeholder="¿En qué comuna?" />
            </div>
            <button className="btn min-h-12 px-5">Buscar</button>
          </form>
          {q && (
            <p className="mt-3 text-[15px] text-slate-600">
              {lista.length === 1 ? "1 matrona" : `${lista.length} matronas`} en “{q}”.{" "}
              <Link href="/profesionales" className="enlace">Ver todas</Link>
            </p>
          )}
        </div>
      </div>

      <div className="contenedor py-8 sm:py-10">
        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-xl font-bold">{q ? `Aún no hay matronas en ${q}` : "Aún no hay matronas publicadas"}</p>
            <p className="mx-auto mt-2 max-w-[48ch] text-slate-600">
              {q ? "Prueba con una comuna cercana, o mira todas las que atienden hoy." : "Las profesionales están armando sus agendas. Vuelve en unos días."}
            </p>
            {q && <Link href="/profesionales" className="btn-sec mt-5">Ver todas las matronas</Link>}
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {lista.map((p) => {
              const precios = p.servicios.map((s) => s.precio).filter((x): x is number => x != null);
              const desde = precios.length ? Math.min(...precios) : null;
              return (
                <li key={p.id} className="group relative grid gap-x-8 gap-y-4 p-5 transition-colors hover:bg-marca-50/50 sm:p-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                  <div className="flex items-start gap-4">
                    <span className="insignia size-14 text-lg">{iniciales(p.perfil?.nombre)}</span>
                    <div className="min-w-0">
                      <h2 className="text-xl leading-tight font-bold">
                        <Link href={`/profesionales/${p.id}`} className="after:absolute after:inset-0 group-hover:text-marca-700">{p.perfil?.nombre}</Link>
                      </h2>
                      <p className="mt-0.5 text-[15px] text-slate-700">{p.titulo || p.especialidad?.nombre}</p>
                      {p.comuna && (
                        <p className="mt-1.5 flex items-center gap-1 text-[15px] font-medium text-slate-600">
                          <Ubicacion className="size-4" />
                          {p.comuna}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 md:border-l md:border-slate-200 md:pl-8">
                    <p className="text-sm font-semibold text-slate-600">Atiende</p>
                    <p className="mt-0.5 line-clamp-2 text-[15px]">
                      {p.servicios.length ? p.servicios.map((s) => s.nombre).join(", ") : "Sin prestaciones publicadas"}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-6 md:flex-col md:items-end md:gap-2">
                    {desde != null && (
                      <p className="text-[15px] text-slate-600 md:text-right">
                        desde <span className="cifra text-lg text-tinta">{formatoPrecio(desde)}</span>
                      </p>
                    )}
                    <span className="btn relative pointer-events-none">Ver horas</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
