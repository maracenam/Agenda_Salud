import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { registrar } from "../acciones";

export const metadata = { title: "Crear cuenta" };

export default async function Registro({ searchParams }: PageProps<"/registro">) {
  const sp = await searchParams;
  const rol = sp.rol === "profesional" ? "profesional" : "paciente";
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "";
  return (
    <div className="mx-auto max-w-md">
      <h1 className="titulo mb-2">Crear cuenta</h1>
      <p className="mb-6 text-sm text-slate-600">Elige cómo vas a usar Agenda Salud.</p>
      <Aviso error={sp.error} />
      <form action={registrar} className="tarjeta space-y-4">
        <input type="hidden" name="siguiente" value={siguiente} />
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="etiqueta">Soy</legend>
          {[
            { v: "paciente", t: "Paciente", d: "Quiero reservar horas", c: "" },
            { v: "profesional", t: "Matrona / Matrón", d: "Quiero recibir reservas", c: "linea-pro" },
          ].map((o) => (
            <label key={o.v} className={`${o.c} flex cursor-pointer flex-col rounded-lg border-2 border-tinta/15 p-3 has-checked:border-marca-700 has-checked:bg-marca-50`}>
              <span className="flex items-center gap-2 text-sm font-medium">
                <input type="radio" name="rol" value={o.v} defaultChecked={rol === o.v} />
                {o.t}
              </span>
              <span className="mt-1 text-xs text-slate-500">{o.d}</span>
            </label>
          ))}
        </fieldset>
        <div>
          <label className="etiqueta" htmlFor="nombre">Nombre completo</label>
          <input className="campo" id="nombre" name="nombre" required autoComplete="name" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input className="campo" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="telefono">Teléfono (opcional)</label>
          <input className="campo" id="telefono" name="telefono" type="tel" placeholder="+56 9 1234 5678" autoComplete="tel" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="password">Contraseña</label>
          <input className="campo" id="password" name="password" type="password" minLength={8} required autoComplete="new-password" />
          <p className="mt-1 text-xs text-slate-500">Mínimo 8 caracteres.</p>
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" name="acepta" required className="mt-0.5" />
          Acepto que mis datos personales y de salud se usen solo para gestionar mis atenciones, según la Ley 21.719.
        </label>
        <button className="btn w-full">Crear cuenta</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿Ya tienes cuenta? <Link className="enlace" href="/ingresar">Ingresar</Link>
      </p>
    </div>
  );
}
