import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { ingresar } from "../acciones";

export const metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: PageProps<"/ingresar">) {
  const sp = await searchParams;
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "";
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="titulo mb-6">Ingresar</h1>
      <Aviso error={sp.error} ok={sp.ok} />
      <form action={ingresar} className="tarjeta space-y-4">
        <input type="hidden" name="siguiente" value={siguiente} />
        <div>
          <label className="etiqueta" htmlFor="email">Email</label>
          <input className="campo" id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <label className="etiqueta" htmlFor="password">Contraseña</label>
          <input className="campo" id="password" name="password" type="password" required autoComplete="current-password" />
        </div>
        <button className="btn w-full">Ingresar</button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link className="enlace" href={`/registro${siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : ""}`}>Crear cuenta</Link>
      </p>
    </div>
  );
}
