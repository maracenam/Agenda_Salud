import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarProfesional } from "@/lib/consultas";
import { DIAS, formatoPrecio } from "@/lib/fechas";

export default async function PerfilProfesional({ params }: PageProps<"/profesionales/[id]">) {
  const { id } = await params;
  const pro = await cargarProfesional(id);
  if (!pro) notFound();
  const servicios = pro.servicios.filter((s) => s.activo);
  const horarios = [...pro.horarios].sort((a, b) => ((a.dia_semana + 6) % 7) - ((b.dia_semana + 6) % 7) || a.hora_inicio.localeCompare(b.hora_inicio));

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-2 space-y-4">
        <div>
          <h1 className="titulo">{pro.perfil?.nombre}</h1>
          <p className="text-marca-700">{pro.titulo || "Matrona"}</p>
          {pro.registro_sis && <p className="text-xs text-slate-500">Registro Superintendencia de Salud: {pro.registro_sis}</p>}
        </div>
        {pro.bio && <p className="whitespace-pre-line text-slate-700">{pro.bio}</p>}
        <h2 className="pt-2 text-lg font-semibold">Elige una prestación</h2>
        {servicios.length === 0 ? (
          <p className="tarjeta text-sm text-slate-600">Esta profesional aún no tiene prestaciones disponibles.</p>
        ) : (
          <ul className="space-y-3">
            {servicios.map((s) => (
              <li key={s.id} className="tarjeta flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{s.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {s.duracion_min} min{s.precio != null ? ` · ${formatoPrecio(s.precio)}` : ""}
                  </p>
                  {s.descripcion && <p className="mt-1 text-sm text-slate-600">{s.descripcion}</p>}
                </div>
                <Link href={`/profesionales/${pro.id}/reservar?servicio=${s.id}`} className="btn">Reservar</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <aside className="tarjeta h-fit space-y-3 text-sm">
        {(pro.direccion || pro.comuna) && (
          <div>
            <p className="font-medium">Dirección</p>
            <p className="text-slate-600">{[pro.direccion, pro.comuna].filter(Boolean).join(", ")}</p>
          </div>
        )}
        <div>
          <p className="font-medium">Horario de atención</p>
          {horarios.length === 0 ? (
            <p className="text-slate-600">Sin horario publicado.</p>
          ) : (
            <ul className="text-slate-600">
              {horarios.map((h, i) => (
                <li key={i}>{DIAS[h.dia_semana]}: {h.hora_inicio.slice(0, 5)} a {h.hora_fin.slice(0, 5)}</li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
