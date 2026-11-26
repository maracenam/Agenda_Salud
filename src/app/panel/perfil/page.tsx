import { Aviso } from "@/components/aviso";
import { requerirProfesional } from "@/lib/sesion";
import { guardarPerfil } from "../acciones";

export const metadata = { title: "Mi perfil profesional" };

export default async function PerfilPro({ searchParams }: PageProps<"/panel/perfil">) {
  const sp = await searchParams;
  const { id, supabase, perfil } = await requerirProfesional();
  const { data: pro } = await supabase.from("profesionales").select("*").eq("id", id).single();
  return (
    <div className="max-w-2xl">
      <h1 className="titulo mb-1">Mi perfil profesional</h1>
      <p className="mb-6 text-sm text-slate-600">Esto es lo que verán tus pacientes al reservar. Tu nombre y teléfono se editan en <a className="enlace" href="/cuenta">Mis datos</a>.</p>
      <Aviso error={sp.error} ok={sp.ok} />
      <form action={guardarPerfil} className="tarjeta space-y-4">
        <p className="text-sm"><span className="font-medium">{perfil.nombre}</span> · {perfil.email}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="titulo">Título que se muestra</label>
            <input className="campo" id="titulo" name="titulo" defaultValue={pro?.titulo ?? ""} placeholder="Matrona, Universidad de Chile" />
          </div>
          <div>
            <label className="etiqueta" htmlFor="registro_sis">N° registro Superintendencia de Salud</label>
            <input className="campo" id="registro_sis" name="registro_sis" defaultValue={pro?.registro_sis ?? ""} />
          </div>
          <div>
            <label className="etiqueta" htmlFor="direccion">Dirección de la consulta</label>
            <input className="campo" id="direccion" name="direccion" defaultValue={pro?.direccion ?? ""} placeholder="Av. Providencia 1234, of. 56" />
          </div>
          <div>
            <label className="etiqueta" htmlFor="comuna">Comuna</label>
            <input className="campo" id="comuna" name="comuna" defaultValue={pro?.comuna ?? ""} placeholder="Providencia" />
          </div>
        </div>
        <div>
          <label className="etiqueta" htmlFor="bio">Presentación</label>
          <textarea className="campo" id="bio" name="bio" rows={4} defaultValue={pro?.bio ?? ""} placeholder="Cuenta tu experiencia y en qué te especializas: control prenatal, ginecología, lactancia..." />
        </div>
        <div className="max-w-xs">
          <label className="etiqueta" htmlFor="horas_min_cambio">Anticipación mínima para cancelar o cambiar (horas)</label>
          <input className="campo" id="horas_min_cambio" name="horas_min_cambio" type="number" min={0} max={72} defaultValue={pro?.horas_min_cambio ?? 2} />
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm">
          <input type="checkbox" name="publicado" defaultChecked={pro?.publicado} />
          <span><b>Publicar mi página</b>: las pacientes podrán encontrarme y reservar.</span>
        </label>
        <button className="btn">Guardar</button>
      </form>
    </div>
  );
}
