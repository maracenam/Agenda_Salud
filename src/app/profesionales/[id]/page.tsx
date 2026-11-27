import Link from "next/link";
import { iniciales } from "@/lib/iniciales";
import { notFound } from "next/navigation";
import { cargarProfesional } from "@/lib/consultas";
import { DIAS, formatoPrecio } from "@/lib/fechas";
import { Ubicacion } from "@/components/marca";

export default async function PerfilProfesional({ params }: PageProps<"/profesionales/[id]">) {
  const { id } = await params;
  const pro = await cargarProfesional(id);
  if (!pro) notFound();
  const servicios = pro.servicios.filter((s) => s.activo);
  // Lunes primero; las franjas de un mismo día se juntan en una línea.
  const porDia = new Map<number, string[]>();
  for (const h of [...pro.horarios].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))) {
    porDia.set(h.dia_semana, [...(porDia.get(h.dia_semana) ?? []), `${h.hora_inicio.slice(0, 5)} a ${h.hora_fin.slice(0, 5)}`]);
  }
  const dias = [1, 2, 3, 4, 5, 6, 0];

  return (
    <>
      <div className="border-b border-slate-200 bg-white">
        <div className="contenedor flex flex-wrap items-center gap-5 py-8 sm:py-10">
          <span className="insignia size-16 text-xl sm:size-20 sm:text-2xl">{iniciales(pro.perfil?.nombre)}</span>
          <div className="min-w-0">
            <h1 className="titulo sm:text-[40px] sm:leading-[1.05]">{pro.perfil?.nombre}</h1>
            <p className="mt-1 text-lg text-slate-700">{pro.titulo || "Matrona"}</p>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[15px] text-slate-600">
              {pro.comuna && <span className="flex items-center gap-1 font-medium"><Ubicacion className="size-4" />{pro.comuna}</span>}
              {pro.registro_sis && <span>Registro en la Superintendencia de Salud <span className="cifra text-tinta">{pro.registro_sis}</span></span>}
            </div>
          </div>
        </div>
      </div>

      <div className="contenedor grid gap-8 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <section>
            <h2 className="subtitulo text-xl">Elige qué necesitas</h2>
            {servicios.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-slate-600">Todavía no publica prestaciones. Vuelve en unos días.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {servicios.map((s) => (
                  <li key={s.id} className="group relative flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 transition-colors hover:bg-marca-50/50 sm:px-6">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[17px] font-semibold">
                        <Link href={`/profesionales/${pro.id}/reservar?servicio=${s.id}`} className="after:absolute after:inset-0">{s.nombre}</Link>
                      </h3>
                      {s.descripcion && <p className="mt-0.5 text-[15px] text-slate-600">{s.descripcion}</p>}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="cifra text-[15px] text-slate-600">{s.duracion_min} min</span>
                      <span className="cifra w-24 text-right text-lg">{s.precio != null ? formatoPrecio(s.precio) : ""}</span>
                      <span className="btn pointer-events-none">Ver horas</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {pro.bio && (
            <section>
              <h2 className="subtitulo text-xl">Sobre {pro.perfil?.nombre.split(" ")[0]}</h2>
              <p className="mt-3 max-w-[65ch] text-[17px] leading-relaxed whitespace-pre-line text-slate-700">{pro.bio}</p>
            </section>
          )}
        </div>

        <aside className="space-y-6 lg:pt-1">
          {(pro.direccion || pro.comuna) && (
            <div>
              <h2 className="font-bold">Consulta</h2>
              <p className="mt-1 text-[15px] text-slate-700">{[pro.direccion, pro.comuna].filter(Boolean).join(", ")}</p>
            </div>
          )}
          <div>
            <h2 className="font-bold">Horario de atención</h2>
            {porDia.size === 0 ? (
              <p className="mt-1 text-[15px] text-slate-700">Sin horario publicado.</p>
            ) : (
              <dl className="mt-2 divide-y divide-slate-200 border-y border-slate-200 text-[15px]">
                {dias.map((d) => (
                  <div key={d} className="flex justify-between gap-4 py-2">
                    <dt className={porDia.has(d) ? "font-medium" : "text-slate-400"}>{DIAS[d]}</dt>
                    <dd className={`text-right ${porDia.has(d) ? "" : "text-slate-400"}`}>
                      {porDia.has(d) ? porDia.get(d)!.map((t) => <span key={t} className="block">{t}</span>) : "No atiende"}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
