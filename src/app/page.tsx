import Link from "next/link";
import { Calendario, Campana, Escudo, Flecha, Ubicacion } from "@/components/marca";

/*
  Portada "Consulta clara", segunda pasada (skills Impeccable + Taste).
  La página es la agenda misma: una hoja de agenda con horas libres en la portada,
  el contraste con el WhatsApp de ida y vuelta, el día de la matrona y la ficha
  escrita en notación de matronería. Todo dato ilustrativo va rotulado "Ejemplo".
*/

const DIAS = [
  { d: "Lun", n: 30 },
  { d: "Mar", n: 1, activo: true },
  { d: "Mié", n: 2 },
  { d: "Jue", n: 3 },
  { d: "Vie", n: 4 },
];

type Bloque = { h: string; e: "reservada" | "libre" | "tuya" };
const HOJA: Bloque[] = [
  { h: "09:00", e: "reservada" },
  { h: "09:45", e: "libre" },
  { h: "10:30", e: "tuya" },
  { h: "11:15", e: "reservada" },
  { h: "12:00", e: "libre" },
];

const CHAT = [
  { de: "p", t: "Hola, ¿tiene hora para control esta semana?", h: "Lun 09:12" },
  { de: "m", t: "Hola. El jueves a las 16:00.", h: "Lun 13:40" },
  { de: "p", t: "Ese día trabajo. ¿Y el viernes en la mañana?", h: "Lun 13:52" },
  { de: "m", t: "El viernes está lleno. ¿Lunes 30 a las 9:45?", h: "Lun 20:31" },
  { de: "p", t: "Ya, el lunes. ¿Me deja anotada?", h: "Mar 08:05" },
  { de: "m", t: "Listo, anotada.", h: "Mar 19:47" },
];

const AGENDA = [
  { h: "09:00", p: "Fernanda Araya", s: "Control prenatal", e: "Atendida", c: "bg-marca-50 text-marca-700" },
  { h: "09:45", p: "Josefa Contreras", s: "Toma de PAP", e: "Siguiente", c: "bg-acento text-white" },
  { h: "10:30", p: "Antonia Silva", s: "Consejería", e: "Confirmada", c: "bg-acento-claro text-acento" },
  { h: "11:15", p: "Hora libre", s: "Visible para reservar", e: "Libre", c: "border border-acento-suave text-acento", libre: true },
];

const PRO = [
  { t: "Publicas tus horarios", d: "Las pacientes reservan solas. Nadie te escribe para preguntar si tienes hora." },
  { t: "Sin dobles citas", d: "Una hora tomada desaparece de la agenda pública en el mismo momento." },
  { t: "Recordatorio automático", d: "Cada paciente recibe un email el día antes de su control." },
];

const FICHA = [
  { v: "G2 P1 A0 C1", l: "Gestas, partos, abortos y cesáreas" },
  { v: "12 abr", l: "Fecha de última regla (FUR)" },
  { v: "32+5", l: "Semanas de edad gestacional, calculadas desde la FUR" },
  { v: "Ago 2026", l: "Último PAP, con su resultado" },
];

const FRASE =
  "Las horas se publican, se reservan y se recuerdan solas. La libreta, el Excel y el WhatsApp de ida y vuelta se quedan fuera de la consulta.";

function Ejemplo({ oscuro = false }: { oscuro?: boolean }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${oscuro ? "border-white/20 text-marca-100" : "border-slate-200 bg-slate-50 text-slate-500"}`}
    >
      Ejemplo
    </span>
  );
}

function Check({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

function Buscador({ id }: { id: string }) {
  return (
    <form action="/profesionales" className="buscador flex max-w-xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-2 sm:flex-row">
      <label htmlFor={id} className="sr-only">Comuna</label>
      <div className="relative flex-1">
        <Ubicacion className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-marca-700" />
        <input
          id={id}
          name="q"
          placeholder="¿En qué comuna? Ej: Ñuñoa"
          className="block min-h-12 w-full rounded-lg bg-transparent pr-3 pl-10 text-base text-tinta placeholder:text-slate-500 focus:outline-none"
        />
      </div>
      <button className="btn-acento">
        Buscar matrona <Flecha />
      </button>
    </form>
  );
}

/** La hoja de agenda de la portada: el mismo dibujo del logo, en grande. */
function HojaAgenda() {
  return (
    <div className="hoja-sombra relative">
    <figure className="hoja relative" aria-label="Ejemplo de reserva: agenda de una matrona con sus horas libres">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="insignia size-11 text-base">CR</span>
          <div>
            <p className="font-semibold">Camila Rojas</p>
            <p className="text-sm text-slate-600">Matrona · Ñuñoa · Control prenatal</p>
          </div>
        </div>
        <Ejemplo />
      </div>

      <div className="grid grid-cols-5 gap-1.5 border-y border-slate-200 bg-slate-50/70 px-5 py-3 sm:px-6">
        {DIAS.map((d) => (
          <span
            key={d.n}
            className={`flex flex-col items-center rounded-lg py-1.5 ${d.activo ? "bg-marca-700 text-white" : "text-tinta"}`}
          >
            <span className={`text-xs font-medium ${d.activo ? "text-marca-100" : "text-slate-500"}`}>{d.d}</span>
            <span className="cifra text-lg leading-tight">{d.n}</span>
          </span>
        ))}
      </div>

      {/* Renglones de la libreta: la hora en el margen, el bloque en el renglón. */}
      <ol className="px-5 py-2 sm:px-6">
        {HOJA.map((b, i) => (
          <li key={b.h} className="grid grid-cols-[3.25rem_1fr] items-center gap-3 border-b border-dashed border-slate-200 py-2 last:border-b-0">
            <span className={`cifra text-[15px] ${b.e === "tuya" ? "text-acento" : "text-slate-500"}`}>{b.h}</span>
            {b.e === "reservada" && (
              <span className="flex min-h-11 items-center rounded-lg bg-slate-100 px-3 text-sm text-slate-500">Reservada</span>
            )}
            {b.e === "libre" && (
              <span className="flex min-h-11 items-center justify-between rounded-lg bg-acento-claro px-3 text-sm font-semibold text-acento">
                Libre <span style={{ "--i": i } as React.CSSProperties} className="tablero-cifra font-normal">45 min</span>
              </span>
            )}
            {b.e === "tuya" && (
              <span className="flex min-h-11 items-center justify-between rounded-lg bg-acento px-3 text-sm font-semibold text-white shadow-[0_6px_16px_-8px_rgb(63_107_85/0.8)]">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-white" aria-hidden="true" />
                  Tu hora
                </span>
                <Check />
              </span>
            )}
          </li>
        ))}
      </ol>

      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-4 pr-12 pl-5 sm:pl-6">
        <span className="text-[15px]">
          <span className="font-semibold">Martes 1 de diciembre, 10:30</span>
        </span>
        <span className="inline-flex min-h-10 items-center rounded-lg bg-acento px-4 text-sm font-semibold text-white">Confirmar hora</span>
      </figcaption>
    </figure>
    <span className="pliegue" aria-hidden="true" />
    </div>
  );
}

export default function Inicio() {
  return (
    <div className="space-y-24 sm:space-y-32">
      {/* 1. Portada: el titular y el buscador; a la derecha, la hoja de agenda. */}
      <section data-enter className="grid items-center gap-10 pt-2 sm:pt-6 lg:min-h-[calc(100svh-9rem)] lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        <div>
          <h1 className="entra max-w-[13ch] font-titulo text-[44px] leading-[1.02] font-bold tracking-[-0.035em] text-balance text-tinta sm:text-7xl">
            Tu hora con la matrona, <span className="text-marca-700">sin llamadas.</span>
          </h1>
          <p className="entra mt-6 max-w-[46ch] text-lg leading-relaxed text-slate-600 [--d:1]">
            Matronas y matrones independientes publican aquí sus horas libres. Eliges día y hora, y el día antes te llega un recordatorio por email.
          </p>
          <div className="entra mt-8 [--d:2]">
            <Buscador id="comuna" />
          </div>
          <ul className="entra mt-7 flex flex-wrap gap-x-6 gap-y-2.5 text-[15px] text-slate-700 [--d:3]">
            <li className="flex items-center gap-2"><Calendario className="size-5 shrink-0 text-acento" />Cambia o cancela en línea</li>
            <li className="flex items-center gap-2"><Escudo className="size-5 shrink-0 text-acento" />Datos protegidos, Ley 21.719</li>
          </ul>
        </div>

        <div className="entra [--d:2]">
          <HojaAgenda />
        </div>
      </section>

      {/* 2. Momento: la frase se escribe a medida que se lee. */}
      <section aria-label="Lo que cambia" className="mx-auto max-w-5xl">
        <p className="frase font-titulo text-[30px] leading-[1.18] font-bold tracking-[-0.025em] text-balance sm:text-5xl lg:text-[3.5rem]">
          {FRASE.split(" ").map((p, i) => (
            <span key={i}>{p} </span>
          ))}
        </p>
      </section>

      {/* 3. Antes y ahora: el WhatsApp de ida y vuelta frente a tres toques. */}
      <section aria-labelledby="antes" className="space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="antes" className="titulo max-w-[20ch] text-balance sm:text-5xl">Pedir hora, antes y ahora.</h2>
          <Ejemplo />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-100 p-5 sm:p-7">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">Por WhatsApp</span>
              <span className="cifra text-slate-500">6 mensajes · 2 días</span>
            </p>
            <ol className="mt-5 space-y-2.5">
              {CHAT.map((m) => (
                <li key={m.h} className={`flex ${m.de === "p" ? "justify-end" : "justify-start"}`}>
                  <span
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug ${m.de === "p" ? "rounded-br-md bg-white text-tinta" : "rounded-bl-md bg-slate-200/80 text-tinta"}`}
                  >
                    {m.t}
                    <span className="cifra ml-2 align-baseline text-[11px] font-medium text-slate-500">{m.h}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col rounded-3xl border border-acento-suave bg-white p-5 sm:p-7">
            <p className="flex items-baseline justify-between gap-3">
              <span className="font-semibold">En Agenda Salud</span>
              <span className="cifra text-acento">3 toques</span>
            </p>
            <ol className="mt-5 flex flex-1 flex-col justify-between gap-5">
              <li className="toque">
                <span className="toque-n">Buscas tu comuna</span>
                <span className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 px-3 text-tinta">
                  <Ubicacion className="size-5 text-marca-700" /> Ñuñoa
                </span>
              </li>
              <li className="toque">
                <span className="toque-n">Tocas una hora libre</span>
                <span className="flex gap-2">
                  <span className="cifra flex min-h-12 flex-1 items-center justify-center rounded-xl bg-acento-claro text-acento">09:45</span>
                  <span className="cifra flex min-h-12 flex-1 items-center justify-center rounded-xl bg-acento text-white">10:30</span>
                  <span className="cifra flex min-h-12 flex-1 items-center justify-center rounded-xl bg-acento-claro text-acento">12:00</span>
                </span>
              </li>
              <li className="toque">
                <span className="toque-n">Confirmas</span>
                <span className="flex min-h-12 items-center justify-between rounded-xl bg-marca-50 px-4 text-marca-800">
                  <span className="font-semibold">Martes 1, 10:30</span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-acento"><Campana className="size-4" />Te avisamos el lunes</span>
                </span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* 4. Vista profesional: la única banda de color de la página. */}
      <section aria-labelledby="pro" className="overflow-hidden rounded-[28px] bg-marca-800 text-white">
        <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:p-14">
          <div>
            <h2 id="pro" className="max-w-[16ch] font-titulo text-[34px] leading-[1.08] font-bold tracking-[-0.025em] text-balance sm:text-5xl">
              Para matronas: tu día entero, de un vistazo.
            </h2>
            <dl className="mt-8 divide-y divide-white/15 border-y border-white/15">
              {PRO.map((f) => (
                <div key={f.t} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <dt className="font-semibold">{f.t}</dt>
                  <dd className="text-marca-100">{f.d}</dd>
                </div>
              ))}
            </dl>
            <Link
              href="/registro?rol=profesional"
              className="boton-claro mt-8 inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-5 font-semibold text-marca-800 transition-[background-color,transform] duration-150 hover:bg-marca-50 active:translate-y-px"
            >
              Crear mi agenda gratis <Flecha />
            </Link>
          </div>

          <div className="rounded-2xl bg-white p-5 text-tinta shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-semibold">
                Hoy <span className="font-normal text-slate-600">· lunes 30</span>
              </p>
              <Ejemplo />
            </div>
            <ul className="mt-3">
              {AGENDA.map((a) => (
                <li
                  key={a.h}
                  className={`grid grid-cols-[4rem_1fr_auto] items-center gap-3 border-b border-slate-200 py-4 last:border-b-0 sm:grid-cols-[6.5rem_1fr_auto] ${a.e === "Siguiente" ? "-mx-3 rounded-xl border-transparent bg-acento-claro px-3" : ""}`}
                >
                  <span className={`cifra text-xl sm:text-[2rem] ${a.libre ? "text-slate-400" : ""}`}>{a.h}</span>
                  <span className="min-w-0">
                    <span className={`block truncate font-semibold ${a.libre ? "text-slate-500" : ""}`}>{a.p}</span>
                    <span className="block truncate text-sm text-slate-600">{a.s}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.c}`}>{a.e}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Ficha: la notación de la especialidad, en grande. */}
      <section aria-labelledby="ficha" className="space-y-10">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr] md:items-end">
          <h2 id="ficha" className="titulo max-w-[14ch] text-balance sm:text-5xl">Una ficha que habla matronería.</h2>
          <p className="max-w-[46ch] text-lg text-slate-700 md:justify-self-end">
            No es un software médico genérico con campos de más. Cada control queda escrito con los datos que de verdad revisas.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:px-8">
            <p>
              <span className="font-semibold">Valentina Muñoz</span> <span className="text-slate-600">· 31 años · Control prenatal</span>
            </p>
            <Ejemplo />
          </div>
          <dl className="grid sm:grid-cols-2 lg:grid-cols-[1.45fr_1fr_1fr_1fr]">
            {FICHA.map((f, i) => (
              <div
                key={f.l}
                className={`flex flex-col-reverse justify-end gap-2 border-slate-200 px-5 py-7 sm:px-8 ${i > 0 ? "border-t sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l" : ""} ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
              >
                <dt className="max-w-[24ch] text-[15px] text-slate-600">{f.l}</dt>
                <dd className="cifra text-[2.5rem] leading-none tracking-[-0.03em] whitespace-nowrap text-marca-700 xl:text-5xl">{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 6. Cierre: la misma búsqueda de la portada, sin caja. */}
      <section aria-labelledby="cierre" className="grid gap-8 border-t border-slate-200 pt-16 sm:pt-20 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h2 id="cierre" className="font-titulo text-[44px] leading-none font-bold tracking-[-0.035em] sm:text-7xl">
            ¿Necesitas hora?
          </h2>
          <p className="mt-4 max-w-[44ch] text-lg text-slate-700">Busca por comuna y reserva en un par de minutos, sin escribirle a nadie.</p>
          <div className="mt-8">
            <Buscador id="comuna-cierre" />
          </div>
        </div>
        <Link href="/registro?rol=profesional" className="enlace inline-flex min-h-12 items-center gap-2 text-lg">
          Soy matrona: crear mi agenda <Flecha />
        </Link>
      </section>
    </div>
  );
}
