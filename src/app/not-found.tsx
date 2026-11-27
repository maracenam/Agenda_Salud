import Link from "next/link";

export default function NoEncontrada() {
  return (
    <div className="contenedor py-20 sm:py-28">
      <p className="cifra text-[64px] leading-none text-marca-200">404</p>
      <h1 className="titulo mt-4">Esta página no existe</h1>
      <p className="mt-2 max-w-[48ch] text-[17px] text-slate-600">Puede que el enlace esté incompleto o que la matrona ya no publique su agenda.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/profesionales" className="btn">Buscar matrona</Link>
        <Link href="/" className="btn-sec">Ir al inicio</Link>
      </div>
    </div>
  );
}
