import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { Ubicacion } from "@/components/marca";
import { requerirProfesional } from "@/lib/sesion";
import { cargarEspecialidades } from "@/lib/consultas";
import { moduloDe } from "@/lib/especialidades";
import { guardarPerfil } from "../acciones";

export const metadata = { title: "Mi perfil profesional" };

export default async function PerfilPro({ searchParams }: PageProps<"/panel/perfil">) {
  const sp = await searchParams;
  const { id, supabase, perfil } = await requerirProfesional();
  const [{ data: pro }, especialidades] = await Promise.all([
    supabase.from("profesionales").select("*").eq("id", id).single(),
    cargarEspecialidades(),
  ]);
  const esp = especialidades.find((e) => e.id === pro?.especialidad_id);
  const modulo = moduloDe(esp?.slug);
  const iniciales = perfil.nombre.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="titulo">Mi perfil profesional</h1>
        <p className="mt-1 max-w-[62ch] text-[15px] text-slate-600">
          Es lo que ven tus pacientes antes de reservar. Tu nombre y teléfono se cambian en{" "}
          <Link className="enlace" href="/cuenta">Mis datos</Link>.
        </p>
      </div>
      <Aviso error={sp.error} ok={sp.ok} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form action={guardarPerfil} className="rounded-xl border border-slate-200 bg-white">
          <div className="space-y-6 p-5 sm:p-6">
            <fieldset>
              <legend className="mb-3 font-bold text-marca-800">Cómo te presentas</legend>
              <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="etiqueta" htmlFor="especialidad_id">Especialidad</label>
                <select className="campo" id="especialidad_id" name="especialidad_id" defaultValue={pro?.especialidad_id ?? ""} aria-describedby="esp-ayuda">
                  {especialidades.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>
                <p id="esp-ayuda" className="mt-1.5 text-sm text-slate-600">
                  Define en qué sección del buscador apareces y los campos de tu ficha clínica. Si la cambias, los datos de fichas anteriores se conservan.
                </p>
              </div>
              <div>
                <label className="etiqueta" htmlFor="titulo">Título</label>
                <input className="campo" id="titulo" name="titulo" defaultValue={pro?.titulo ?? ""} placeholder={modulo.ejemplos.titulo} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="registro_sis">Registro en la Superintendencia de Salud</label>
                <input className="campo" id="registro_sis" name="registro_sis" defaultValue={pro?.registro_sis ?? ""} />
              </div>
              <div className="sm:col-span-2">
                <label className="etiqueta" htmlFor="bio">Presentación</label>
                <textarea
                  className="campo"
                  id="bio"
                  name="bio"
                  rows={5}
                  defaultValue={pro?.bio ?? ""}
                  placeholder={modulo.ejemplos.bio}
                />
              </div>
              </div>
            </fieldset>
            <fieldset className="border-t border-slate-200 pt-5">
              <legend className="float-left mb-3 w-full font-bold text-marca-800">Dónde atiendes</legend>
              <div className="clear-both grid gap-4 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className="etiqueta" htmlFor="direccion">Dirección de la consulta</label>
                <input className="campo" id="direccion" name="direccion" defaultValue={pro?.direccion ?? ""} placeholder="Av. Providencia 1234, of. 56" />
              </div>
              <div>
                <label className="etiqueta" htmlFor="comuna">Comuna</label>
                <input className="campo" id="comuna" name="comuna" defaultValue={pro?.comuna ?? ""} placeholder="Providencia" />
              </div>
              </div>
            </fieldset>
            <fieldset className="border-t border-slate-200 pt-5">
              <legend className="float-left mb-3 w-full font-bold text-marca-800">Reglas de reserva</legend>
              <div className="clear-both max-w-sm">
                <label className="etiqueta" htmlFor="horas_min_cambio">Horas mínimas de aviso para cancelar o cambiar</label>
                <input className="campo w-32" id="horas_min_cambio" name="horas_min_cambio" type="number" min={0} max={72} defaultValue={pro?.horas_min_cambio ?? 2} />
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-300 p-4 has-checked:border-acento has-checked:bg-acento-claro">
                <input type="checkbox" name="publicado" defaultChecked={pro?.publicado} className="mt-0.5 size-5 accent-acento" />
                <span>
                  <span className="block font-semibold">Publicar mi página</span>
                  <span className="text-[15px] text-slate-600">Aparecerás en el buscador y se podrá reservar contigo.</span>
                </span>
              </label>
            </fieldset>
          </div>
          <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <button className="btn">Guardar perfil</button>
          </div>
        </form>

        <aside aria-label="Vista previa" className="xl:sticky xl:top-8">
          <p className="mb-2 text-sm font-semibold text-slate-600">Así te ven en el buscador</p>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="insignia size-12 text-base">{iniciales}</span>
              <div className="min-w-0">
                <p className="truncate font-bold">{perfil.nombre}</p>
                <p className="truncate text-sm text-slate-600">{esp?.nombre}{pro?.titulo ? `, ${pro.titulo}` : ""}</p>
              </div>
            </div>
            <p className="mt-4 line-clamp-4 text-[15px] text-slate-700">{pro?.bio || "Aquí aparecerá tu presentación."}</p>
            <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-600">
              <Ubicacion className="size-4 shrink-0" />
              {pro?.comuna || "Comuna sin indicar"}
            </p>
            {pro?.registro_sis && <p className="mt-1 text-sm text-slate-600">Registro SIS {pro.registro_sis}</p>}
          </div>
          <Link href={`/profesionales/${id}`} className="enlace mt-3 inline-block text-[15px]">Abrir mi página pública</Link>
        </aside>
      </div>
    </div>
  );
}
