import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { cargarEspecialidades } from "@/lib/consultas";
import { registrar } from "../acciones";

export const metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: PageProps<"/registro">) {
  const sp = await searchParams;
  const rol = sp.rol === "profesional" ? "profesional" : "paciente";
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "";
  const especialidades = await cargarEspecialidades();
  const elegida = typeof sp.especialidad === "string" ? sp.especialidad : "";
  return (
    <div className="contenedor flex justify-center py-12 sm:py-16">
      <div className="w-full max-w-[30rem]">
        <h1 className="titulo">Crear cuenta</h1>
        <p className="mt-1 mb-6 text-[15px] text-slate-600">Una sola cuenta, sea que reserves o que atiendas.</p>
        <Aviso error={sp.error} />
        <form action={registrar} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <input type="hidden" name="siguiente" value={siguiente} />
          <fieldset>
            <legend className="etiqueta">Voy a usarla para</legend>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "paciente", t: "Reservar horas", d: "Soy paciente" },
                { v: "profesional", t: "Recibir reservas", d: "Soy profesional de la salud" },
              ].map((o) => (
                <label
                  key={o.v}
                  className="flex cursor-pointer flex-col rounded-lg border border-slate-300 p-3.5 transition-colors has-checked:border-marca-700 has-checked:bg-marca-50 has-checked:ring-1 has-checked:ring-marca-700 has-focus-visible:ring-3 has-focus-visible:ring-marca-100"
                >
                  <input type="radio" name="rol" value={o.v} defaultChecked={rol === o.v} className="sr-only" />
                  <span className="font-semibold">{o.t}</span>
                  <span className="mt-0.5 text-sm text-slate-600">{o.d}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {/* Solo se muestra si eligió "Recibir reservas" (CSS :has, sin JavaScript). */}
          <div className="solo-pro">
            <label className="etiqueta" htmlFor="especialidad">Tu especialidad</label>
            <select className="campo" id="especialidad" name="especialidad" defaultValue={elegida}>
              <option value="">Elige tu especialidad</option>
              {especialidades.map((e) => (
                <option key={e.slug} value={e.slug}>{e.nombre}</option>
              ))}
            </select>
            <p className="mt-1.5 text-sm text-slate-600">Define los campos de tu ficha clínica y las prestaciones sugeridas. Puedes cambiarla después.</p>
          </div>
          <div>
            <label className="etiqueta" htmlFor="nombre">Nombre completo</label>
            <input className="campo" id="nombre" name="nombre" required autoComplete="name" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="etiqueta" htmlFor="email">Correo</label>
              <input className="campo" id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <label className="etiqueta" htmlFor="telefono">Teléfono <span className="font-normal text-slate-500">(opcional)</span></label>
              <input className="campo" id="telefono" name="telefono" type="tel" placeholder="+56 9 1234 5678" autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className="etiqueta" htmlFor="password">Contraseña</label>
            <input className="campo" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" aria-describedby="pw-ayuda" />
            <p id="pw-ayuda" className="mt-1.5 text-sm text-slate-600">Al menos 8 caracteres.</p>
          </div>
          <label className="flex items-start gap-3 rounded-lg bg-slate-50 p-3.5 text-sm text-slate-700">
            <input type="checkbox" name="acepta" required className="mt-0.5 size-4 shrink-0 accent-marca-700" />
            Acepto que mis datos personales y de salud se usen solo para gestionar mis atenciones, según la Ley 21.719.
          </label>
          <button className="btn w-full">Crear cuenta</button>
        </form>
        <p className="mt-5 text-[15px] text-slate-600">
          ¿Ya tienes cuenta? <Link className="enlace" href="/ingresar">Ingresar</Link>
        </p>
      </div>
    </div>
  );
}
