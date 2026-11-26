import { Aviso } from "@/components/aviso";
import { requerirSesion } from "@/lib/sesion";
import { guardarCuenta } from "./acciones";

export const metadata = { title: "Mi cuenta" };

export default async function Cuenta({ searchParams }: PageProps<"/cuenta">) {
  const sp = await searchParams;
  const { perfil } = await requerirSesion();
  return (
    <div className="mx-auto max-w-md">
      <h1 className="titulo mb-6">Mis datos</h1>
      <Aviso error={sp.error} ok={sp.ok} />
      <form action={guardarCuenta} className="tarjeta space-y-4">
        <div>
          <label className="etiqueta">Email</label>
          <p className="text-sm text-slate-600">{perfil.email}</p>
        </div>
        <div>
          <label className="etiqueta" htmlFor="nombre">Nombre completo</label>
          <input className="campo" id="nombre" name="nombre" defaultValue={perfil.nombre} required />
        </div>
        <div>
          <label className="etiqueta" htmlFor="rut">RUT</label>
          <input className="campo" id="rut" name="rut" defaultValue={perfil.rut ?? ""} placeholder="12.345.678-9" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="telefono">Teléfono</label>
          <input className="campo" id="telefono" name="telefono" defaultValue={perfil.telefono ?? ""} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="fecha_nacimiento">Fecha de nacimiento</label>
          <input className="campo" id="fecha_nacimiento" name="fecha_nacimiento" type="date" defaultValue={perfil.fecha_nacimiento ?? ""} />
        </div>
        <button className="btn">Guardar</button>
      </form>
    </div>
  );
}
