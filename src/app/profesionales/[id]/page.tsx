import Link from "next/link";
import { iniciales } from "@/lib/iniciales";
import { notFound } from "next/navigation";
import { cargarProfesional } from "@/lib/consultas";
import { DIAS, formatoPrecio } from "@/lib/fechas";
import { Flecha, Reloj, Ubicacion } from "@/components/marca";

export default async function PerfilProfesional({ params }: PageProps<"/profesionales/[id]">) {
  const { id } = await params;
  const pro = await cargarProfesional(id);
  if (!pro) notFound();
  const servicios = pro.servicios.filter((s) => s.activo);
  const horarios = [...pro.horarios].sort((a, b) => ((a.dia_semana + 6) % 7) - ((b.dia_semana + 6) % 7) || a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
      <div className="space-y-8">
        <div className="flex items-start gap-4">
          <span className="insignia size-14 text-2xl">{iniciales(pro.perfil?.nombre)}</span>
          <div>
            <h1 className="titulo">{pro.perfil?.nombre}</h1>
            <p className="mt-1 text-lg font-medium text-marca-700">{pro.titulo || "Matrona"}</p>
            {pro.registro_sis && <p className="mt-1 text-sm text-slate-600">Registro Superintendencia de Salud: <span className="cifra text-base">{pro.registro_sis}</span></p>}
          </div>
        </div>
        {pro.bio && <p className="max-w-[65ch] text-lg whitespace-pre-line text-slate-700">{pro.bio}</p>}
        <section>
          <h2 className="mb-3 font-senal text-2xl font-bold">Elige una prestación</h2>
          {servicios.length === 0 ? (
            <p className="tarjeta text-slate-600">Esta profesional aún no tiene prestaciones disponibles.</p>
          ) : (
            <ul className="tarjeta divide-y divide-tinta/10 p-0">
              {servicios.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-semibold">{s.nombre}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-slate-600">
                      <span className="inline-flex items-center gap-1"><Reloj className="size-4" />{s.duracion_min} min</span>
                      {s.precio != null && <span className="cifra text-base text-tinta">{formatoPrecio(s.precio)}</span>}
                    </p>
                    {s.descripcion && <p className="mt-1 text-slate-600">{s.descripcion}</p>}
                  </div>
                  <Link href={`/profesionales/${pro.id}/reservar?servicio=${s.id}`} className="btn">
                    Reservar <Flecha className="size-4" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
      <aside className="tarjeta h-fit overflow-hidden p-0 text-[15px]">
        <p className="bg-tinta px-5 py-2.5 font-senal text-lg font-bold tracking-wide text-white uppercase">Consulta</p>
        <div className="space-y-5 p-5">
          {(pro.direccion || pro.comuna) && (
            <div>
              <p className="flex items-center gap-1.5 font-semibold"><Ubicacion className="size-4" />Dirección</p>
              <p className="mt-1 text-slate-700">{[pro.direccion, pro.comuna].filter(Boolean).join(", ")}</p>
            </div>
          )}
          <div>
            <p className="flex items-center gap-1.5 font-semibold"><Reloj className="size-4" />Horario de atención</p>
            {horarios.length === 0 ? (
              <p className="mt-1 text-slate-700">Sin horario publicado.</p>
            ) : (
              <ul className="mt-1 divide-y divide-tinta/10">
                {horarios.map((h, i) => (
                  <li key={i} className="flex justify-between gap-3 py-1.5">
                    <span className="text-slate-700">{DIAS[h.dia_semana]}</span>
                    <span className="cifra text-base">{h.hora_inicio.slice(0, 5)}–{h.hora_fin.slice(0, 5)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

