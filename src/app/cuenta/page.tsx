import { Aviso } from "@/components/aviso";
import { requerirSesion } from "@/lib/sesion";
import { guardarCuenta } from "./acciones";

export const metadata = { title: "Mi cuenta" };

export default async function Cuenta({ searchParams }: PageProps<"/cuenta">) {
  const sp = await searchParams;
  const { perfil } = await requerirSesion();
  return (
    <div className="contenedor py-8 sm:py-12">
      <div className="mx-auto max-w-[36rem]">
        <h1 className="titulo">Mis datos</h1>
        <p className="mt-1 mb-6 text-[15px] text-slate-600">Tu profesional los ve al atenderte. El RUT y la fecha de nacimiento van a tu ficha.</p>
        <Aviso error={sp.error} ok={sp.ok} />
        <form action={guardarCuenta} className="rounded-xl border border-slate-200 bg-white">
          <div className="space-y-4 p-6">
            <div>
              <p className="etiqueta">Correo</p>
              <p className="text-[15px] text-slate-700">{perfil.email}</p>
            </div>
            <div>
              <label className="etiqueta" htmlFor="nombre">Nombre completo</label>
              <input className="campo" id="nombre" name="nombre" defaultValue={perfil.nombre} required autoComplete="name" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="etiqueta" htmlFor="rut">RUT</label>
                <input className="campo" id="rut" name="rut" defaultValue={perfil.rut ?? ""} placeholder="12.345.678-9" />
              </div>
              <div>
                <label className="etiqueta" htmlFor="telefono">Teléfono</label>
                <input className="campo" id="telefono" name="telefono" type="tel" defaultValue={perfil.telefono ?? ""} autoComplete="tel" />
              </div>
            </div>
            <div className="sm:max-w-[calc(50%-0.5rem)]">
              <label className="etiqueta" htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
              <input className="campo" id="fecha_nacimiento" name="fecha_nacimiento" type="date" defaultValue={perfil.fecha_nacimiento ?? ""} />
            </div>
          </div>
          <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-6 py-4">
            <button className="btn">Guardar cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
}
