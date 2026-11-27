import Link from "next/link";
import { Aviso } from "@/components/aviso";
import { ingresar } from "../acciones";

export const metadata = { title: "Ingresar" };

export default async function Ingresar({ searchParams }: PageProps<"/ingresar">) {
  const sp = await searchParams;
  const siguiente = typeof sp.siguiente === "string" ? sp.siguiente : "";
  return (
    <div className="contenedor flex justify-center py-12 sm:py-20">
      <div className="w-full max-w-[26rem]">
        <h1 className="titulo">Ingresar</h1>
        <p className="mt-1 mb-6 text-[15px] text-slate-600">Con el correo con que creaste tu cuenta.</p>
        <Aviso error={sp.error} ok={sp.ok} />
        <form action={ingresar} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <input type="hidden" name="siguiente" value={siguiente} />
          <div>
            <label className="etiqueta" htmlFor="email">Correo</label>
            <input className="campo" id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label className="etiqueta" htmlFor="password">Contraseña</label>
            <input className="campo" id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <button className="btn w-full">Ingresar</button>
        </form>
        <p className="mt-5 text-[15px] text-slate-600">
          ¿Primera vez?{" "}
          <Link className="enlace" href={`/registro${siguiente ? `?siguiente=${encodeURIComponent(siguiente)}` : ""}`}>Crea tu cuenta</Link>
        </p>
      </div>
    </div>
  );
}
