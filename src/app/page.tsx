import Link from "next/link";
import { Calendario, Campana, Escudo, Ficha, Flecha, Ubicacion } from "@/components/marca";

// Datos de muestra para ilustrar la reserva. Se rotulan "Ejemplo" en pantalla.
const DIAS = [
  { d: "Lun", n: 30, activo: true },
  { d: "Mar", n: 1 },
  { d: "Mié", n: 2 },
  { d: "Jue", n: 3 },
  { d: "Vie", n: 4 },
];
const HORAS = ["09:00", "09:45", "10:30", "11:15", "12:00", "15:30"];

const AGENDA = [
  { h: "09:00", p: "Fernanda Araya", s: "Control prenatal", e: "Atendida", c: "bg-marca-50 text-marca-700" },
  { h: "09:45", p: "Josefa Contreras", s: "Toma de PAP", e: "Siguiente", c: "bg-acento text-white" },
  { h: "10:30", p: "Antonia Silva", s: "Consejería", e: "Confirmada", c: "bg-acento-claro text-acento" },
];

const CONFIANZA = [
  { i: Campana, t: "Recordatorio por email el día antes" },
  { i: Calendario, t: "Cambia o cancela tu hora en línea" },
  { i: Escudo, t: "Datos protegidos según la Ley 21.719" },
];

const PRO = [
  { i: Calendario, t: "Publica tus horarios y recibe reservas sin coordinar por WhatsApp." },
  { i: Ficha, t: "Ficha gineco-obstétrica de cada paciente, con su historial de controles." },
  { i: Campana, t: "Recordatorios automáticos que bajan las inasistencias." },
];

const FICHA = [
  { c: "GPAC", t: "Antecedentes gineco-obstétricos", d: "Gestas, partos, abortos y cesáreas, siempre a la vista." },
  { c: "FUR", t: "Fecha de última regla", d: "Registrada en cada control, con la edad gestacional a mano." },
  { c: "PAP", t: "Último PAP y resultado", d: "Para saber quién está al día y a quién recordarle." },
  { c: "CTL", t: "Historial de controles", d: "Cada atención queda escrita, con fecha y prestación." },
];

function Ejemplo() {
  return (
    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-500">Ejemplo</span>
  );
}

export default function Inicio() {
  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Portada: titular y buscador a la izquierda, la reserva misma a la derecha. */}
      <section className="grid items-center gap-10 pt-2 sm:pt-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div>
          <h1 className="max-w-[15ch] font-titulo text-[40px] leading-[1.04] font-bold tracking-[-0.03em] text-balance text-tinta sm:text-6xl">
            Tu hora con la matrona, <span className="text-marca-700">sin llamadas.</span>
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg leading-relaxed text-slate-600">
            Matronas y matrones independientes publican aquí sus horas libres. Eliges día y hora, y te llega un recordatorio antes de tu control.
          </p>

          <form action="/profesionales" className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_1px_2px_rgb(38_26_35/0.04),0_12px_32px_-16px_rgb(38_26_35/0.18)] sm:flex-row">
            <label htmlFor="comuna" className="sr-only">Comuna</label>
            <div className="relative flex-1">
              <Ubicacion className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-marca-700" />
              <input
                id="comuna"
                name="q"
                placeholder="¿En qué comuna? Ej: Ñuñoa"
                className="block min-h-12 w-full rounded-lg bg-transparent pr-3 pl-10 text-base text-tinta placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <button className="btn-acento">
              Buscar matrona <Flecha />
            </button>
          </form>

          <ul className="mt-7 grid gap-2.5 text-[15px] text-slate-700 sm:grid-cols-1">
            {CONFIANZA.map(({ i: Icono, t }) => (
              <li key={t} className="flex items-center gap-2.5">
                <Icono className="size-5 shrink-0 text-acento" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Vista previa de la reserva, tal como la ve la paciente. */}
        <div className="tarjeta p-0" aria-label="Ejemplo de reserva">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="insignia size-11 text-base">CR</span>
              <div>
                <p className="font-semibold">Camila Rojas</p>
                <p className="text-sm text-slate-600">Matrona · Control prenatal · 45 min</p>
              </div>
            </div>
            <Ejemplo />
          </div>
          <div className="space-y-5 px-5 py-5">
            <div>
              <p className="etiqueta">Elige el día</p>
              <div className="grid grid-cols-5 gap-2">
                {DIAS.map((d) => (
                  <span
                    key={d.n}
                    className={`flex flex-col items-center rounded-lg border py-2 ${d.activo ? "border-marca-700 bg-marca-700 text-white" : "border-slate-200 bg-white text-tinta"}`}
                  >
                    <span className={`text-xs font-medium ${d.activo ? "text-marca-100" : "text-slate-500"}`}>{d.d}</span>
                    <span className="cifra text-lg">{d.n}</span>
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="etiqueta">Horas libres</p>
              <div className="grid grid-cols-3 gap-2">
                {HORAS.map((h, i) => (
                  <span
                    key={h}
                    className={`cifra flex min-h-11 items-center justify-center rounded-lg text-[15px] ${h === "10:30" ? "bg-acento text-white" : "bg-acento-claro text-acento"}`}
                  >
                    <span style={{ "--i": i } as React.CSSProperties} className="tablero-cifra">{h}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-[15px]">
              <span className="font-semibold">Lunes 30, 10:30</span> <span className="text-slate-600">· Ñuñoa</span>
            </p>
            <span className="text-sm font-semibold text-acento">Lista para confirmar</span>
          </div>
        </div>
      </section>

      {/* Vista profesional. */}
      <section aria-labelledby="pro" className="grid gap-10 overflow-hidden rounded-3xl bg-marca-800 p-6 text-white sm:p-10 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:p-12">
        <div>
          <h2 id="pro" className="max-w-[18ch] font-titulo text-3xl leading-tight font-bold tracking-[-0.02em] text-balance sm:text-4xl">
            Para matronas: tu consulta ordenada, sin libreta ni Excel.
          </h2>
          <ul className="mt-6 space-y-4">
            {PRO.map(({ i: Icono, t }) => (
              <li key={t} className="flex gap-3 text-[17px] text-marca-50/90">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icono className="size-5 text-white" />
                </span>
                {t}
              </li>
            ))}
          </ul>
          <Link
            href="/registro?rol=profesional"
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-5 font-semibold text-marca-800 transition-colors hover:bg-marca-50"
          >
            Crear mi agenda gratis <Flecha />
          </Link>
        </div>

        <div className="rounded-xl bg-white p-5 text-tinta shadow-[0_20px_40px_-20px_rgb(0_0_0/0.5)]">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">
              Hoy <span className="font-normal text-slate-600">· lunes 30</span>
            </p>
            <Ejemplo />
          </div>
          <ul className="mt-4 divide-y divide-slate-200">
            {AGENDA.map((a) => (
              <li key={a.h} className="grid grid-cols-[3.75rem_1fr_auto] items-center gap-3 py-3">
                <span className="cifra text-xl">{a.h}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{a.p}</span>
                  <span className="block truncate text-sm text-slate-600">{a.s}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.c}`}>{a.e}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ficha clínica. */}
      <section aria-labelledby="ficha" className="grid gap-8 md:grid-cols-[1fr_1.4fr] md:items-start">
        <div>
          <h2 id="ficha" className="titulo text-balance">Una ficha que habla matronería.</h2>
          <p className="mt-4 max-w-[46ch] text-lg text-slate-700">
            No es un software médico genérico con campos de más. Cada control de tu paciente queda donde lo buscas, con los datos que de verdad revisas.
          </p>
        </div>
        <ul className="tarjeta divide-y divide-slate-200 p-0">
          {FICHA.map((f) => (
            <li key={f.c} className="grid grid-cols-[4rem_1fr] items-start gap-4 px-5 py-4">
              <span className="cifra rounded-md bg-marca-50 py-1 text-center text-[15px] text-marca-700">{f.c}</span>
              <span>
                <span className="block font-semibold">{f.t}</span>
                <span className="block text-slate-600">{f.d}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Cierre */}
      <section className="flex flex-col gap-6 rounded-2xl bg-marca-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-10">
        <div>
          <h2 className="font-titulo text-3xl font-bold tracking-[-0.02em]">¿Necesitas hora?</h2>
          <p className="mt-2 max-w-[50ch] text-slate-700">Busca por comuna y reserva en un par de minutos.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/profesionales" className="btn-acento">Buscar matrona <Flecha /></Link>
          <Link href="/registro?rol=profesional" className="btn-sec min-h-12">Soy matrona</Link>
        </div>
      </section>
    </div>
  );
}
