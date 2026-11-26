import Link from "next/link";
import { Flecha, Lupa } from "@/components/marca";

// Horas de muestra para ilustrar el tablero. Se rotulan como ejemplo en pantalla.
const HORAS_EJEMPLO = [
  { h: "09:30", s: "Control prenatal", m: "Camila Rojas", c: "Ñuñoa" },
  { h: "10:15", s: "Toma de PAP", m: "Javiera Muñoz", c: "Providencia" },
  { h: "11:00", s: "Consejería en anticoncepción", m: "Camila Rojas", c: "Ñuñoa" },
  { h: "12:30", s: "Control ginecológico", m: "Daniela Soto", c: "Maipú" },
];

const LINEAS = [
  {
    clase: "",
    nombre: "Pacientes",
    letra: "P",
    estaciones: ["Busca tu matrona", "Elige día y hora", "Recibe el recordatorio", "Llega a tu control"],
    cta: { href: "/profesionales", t: "Buscar hora" },
  },
  {
    clase: "linea-pro",
    nombre: "Matronas y matrones",
    letra: "M",
    estaciones: ["Publica tus horarios", "Recibe reservas solas", "Atiende con la ficha", "Cierra el día ordenado"],
    cta: { href: "/registro?rol=profesional", t: "Crear mi agenda" },
  },
];

const FICHA = [
  { c: "GO", t: "Antecedentes gineco-obstétricos", d: "Gestas, partos, cesáreas y abortos, siempre a la vista." },
  { c: "FUR", t: "Fecha de última regla", d: "Registrada en cada control, con la edad gestacional a mano." },
  { c: "PAP", t: "Último PAP y resultado", d: "Para saber quién está al día y a quién recordarle." },
  { c: "CTL", t: "Historial de controles", d: "Cada atención queda escrita, con fecha y prestación." },
];

export default function Inicio() {
  return (
    <div className="space-y-16 sm:space-y-20">
      {/* Panel principal: titular, buscador y tablero de horas. */}
      <section className="grid overflow-hidden rounded-lg bg-marca-700 text-white lg:grid-cols-[1.15fr_1fr] shadow-[0_2px_4px_rgb(14_26_43/0.1),0_20px_40px_-20px_rgb(14_26_43/0.45)]">
        <div className="flex flex-col justify-center px-5 pt-8 pb-7 sm:px-10 sm:py-12">
          <h1 className="max-w-[16ch] font-senal text-[44px] leading-[0.92] font-bold tracking-[-0.02em] text-balance sm:text-7xl lg:text-[5.25rem]">
            Pide hora con tu matrona sin llamar a nadie.
          </h1>
          <p className="mt-4 max-w-[52ch] text-lg text-marca-50/90">
            Matronas y matrones independientes publican sus horas aquí. Eliges la que te sirve y te llega un recordatorio el día antes.
          </p>
          <form action="/profesionales" className="mt-7 flex max-w-xl flex-col gap-2 sm:flex-row">
            <label htmlFor="comuna" className="sr-only">Comuna</label>
            <div className="relative flex-1">
              <Lupa className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500" />
              <input
                id="comuna"
                name="q"
                placeholder="¿En qué comuna? Ej: Ñuñoa"
                className="block min-h-12 w-full rounded-lg border-2 border-transparent bg-white pr-3 pl-10 text-base text-tinta placeholder:text-slate-500 focus:border-senal focus:outline-none"
              />
            </div>
            <button className="btn-senal min-h-12">
              Ver matronas <Flecha />
            </button>
          </form>
        </div>

        {/* Tablero de próximas horas, como el de una estación. */}
        <div className="flex flex-col bg-tinta">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3 sm:px-10 lg:px-7 lg:py-4">
            <h2 className="font-senal text-lg font-bold tracking-wide text-senal uppercase">Próximas horas</h2>
            <span className="rounded-sm border border-white/25 px-1.5 py-0.5 text-xs font-medium text-white/70">Horas de ejemplo</span>
          </div>
          <ol className="flex flex-1 flex-col divide-y divide-white/10">
            {HORAS_EJEMPLO.map((f, i) => (
              <li key={f.h} className="grid flex-1 grid-cols-[4.5rem_1fr] content-center items-center gap-x-4 px-5 py-3 sm:grid-cols-[6rem_1fr_auto] sm:px-10 lg:grid-cols-[5.5rem_1fr] lg:px-7">
                <span className="row-span-2 overflow-hidden">
                  <span style={{ "--i": i } as React.CSSProperties} className={`cifra tablero-cifra text-3xl sm:text-[42px] ${i === 0 ? "text-senal" : "text-white"}`}>{f.h}</span>
                </span>
                <span className="text-[17px] font-semibold text-white">{f.s}</span>
                <span className="text-sm text-white/65 sm:row-span-2 sm:text-right sm:text-base lg:row-span-1 lg:text-left lg:text-[15px]">{f.m} · {f.c}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Dos líneas, como un plano de Metro. */}
      <section aria-labelledby="lineas">
        <h2 id="lineas" className="titulo max-w-[20ch] text-balance">Dos recorridos, una misma agenda.</h2>
        <div className="mt-8 space-y-5">
          {LINEAS.map((l) => (
            <div key={l.nombre} className={`tarjeta ${l.clase} p-5 sm:p-7`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-3 font-senal text-2xl font-bold">
                  <span className="insignia size-9 text-lg">{l.letra}</span>
                  {l.nombre}
                </p>
                <Link href={l.cta.href} className="btn">
                  {l.cta.t} <Flecha className="size-4" />
                </Link>
              </div>
              <ol className="relative mt-7 grid gap-5 sm:grid-cols-4 sm:gap-3">
                {/* Trazo de la línea */}
                <span aria-hidden="true" className="absolute top-2 bottom-2 left-[9px] w-1.5 rounded-full bg-(--linea) sm:top-[9px] sm:right-[12.5%] sm:bottom-auto sm:left-0 sm:h-1.5 sm:w-auto" />
                {l.estaciones.map((e, i) => (
                  <li key={e} className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-3">
                    <span
                      aria-hidden="true"
                      className={`relative z-10 size-6 shrink-0 rounded-full border-[5px] border-(--linea) ${i === l.estaciones.length - 1 ? "bg-senal" : "bg-white"}`}
                    />
                    <span className="text-[17px] leading-snug font-semibold">{e}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      {/* Directorio de la ficha clínica. */}
      <section aria-labelledby="ficha" className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-start">
        <div>
          <h2 id="ficha" className="titulo text-balance">Una ficha que habla matronería.</h2>
          <p className="mt-4 max-w-[46ch] text-lg text-slate-700">
            No es un software médico genérico con campos de más. Cada control de tu paciente queda donde lo buscas, con los datos que de verdad revisas.
          </p>
        </div>
        <div className="tarjeta linea-pro overflow-hidden p-0">
          <p className="bg-tinta px-5 py-2.5 font-senal text-lg font-bold tracking-wide text-white uppercase">Ficha clínica</p>
          <ul className="divide-y divide-tinta/10">
            {FICHA.map((f) => (
              <li key={f.c} className="grid grid-cols-[3.75rem_1fr] items-start gap-4 px-5 py-4">
                <span className="cifra rounded-md bg-pro-700 py-1 text-center text-lg text-white">{f.c}</span>
                <span>
                  <span className="block font-semibold">{f.t}</span>
                  <span className="block text-slate-600">{f.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cierre */}
      <section className="flex flex-col gap-6 rounded-xl bg-tinta p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div>
          <h2 className="font-senal text-4xl leading-none font-bold text-balance">Tu consulta, sin libreta ni Excel.</h2>
          <p className="mt-3 max-w-[50ch] text-white/75">
            Cero dobles citas, recordatorios automáticos y tu página pública para compartir con tus pacientes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/registro?rol=profesional" className="btn-senal">Soy matrona: crear mi agenda</Link>
          <Link href="/profesionales" className="inline-flex min-h-11 items-center rounded-lg border-2 border-white/30 px-5 font-semibold transition-colors hover:border-white">
            Busco hora
          </Link>
        </div>
      </section>
    </div>
  );
}
