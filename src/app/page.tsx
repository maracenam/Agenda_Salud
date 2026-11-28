import Link from "next/link";
import { CalculadoraFur } from "@/components/calculadora-fur";
import { ReservaDemo } from "@/components/reserva-demo";
import { Ubicacion } from "@/components/marca";
import { cargarEspecialidades } from "@/lib/consultas";

/*
  Portada con la identidad "Cinta lustre". Cada sección muestra una pieza real del producto:
  la reserva (se puede usar), el día de una profesional en su grilla de tiempo,
  la ficha que cambia según la especialidad (con la cuenta de FUR de matronería) y el recordatorio.
*/

// Día de muestra del panel. Minutos desde las 09:00; 1 hora = 56 px.
const DIA_PANEL = [
  { ini: 0, dur: 45, h: "09:00", p: "Fernanda Araya", s: "Control prenatal", e: "hecha" },
  { ini: 45, dur: 30, h: "09:45", p: "Isidora Fuentes", s: "Toma de PAP", e: "falta" },
  { ini: 90, dur: 45, h: "10:30", p: "Valentina Muñoz", s: "Control prenatal", e: "hecha" },
  { ini: 150, dur: 30, h: "11:30", p: "Josefa Contreras", s: "Toma de PAP", e: "siguiente" },
  { ini: 195, dur: 30, h: "12:15", p: "Antonia Silva", s: "Control ginecológico", e: "confirmada" },
  { ini: 360, dur: 60, h: "15:00", p: "Catalina Pérez", s: "Asesoría de lactancia", e: "confirmada" },
  { ini: 495, dur: 45, h: "17:15", p: "Fernanda Araya", s: "Control prenatal", e: "confirmada" },
];
const ESTILO_BLOQUE: Record<string, string> = {
  hecha: "bg-slate-100 text-slate-600 border-slate-200",
  falta: "bg-alerta-claro text-alerta border-[#f3d6b4]",
  siguiente: "bg-marca-700 text-white border-marca-700",
  confirmada: "bg-menta text-tinta border-menta-oscura",
};
const PX_MIN = 56 / 60;

function Buscador({ id }: { id: string }) {
  return (
    <form action="/profesionales" className="flex max-w-lg items-center gap-2 rounded-full border-2 border-tinta bg-white p-1.5 pl-5 focus-within:outline-3 focus-within:outline-offset-3 focus-within:outline-amarillo">
      <label htmlFor={id} className="sr-only">Comuna</label>
      <Ubicacion className="size-5 shrink-0 text-marca-700" />
      <input
        id={id}
        name="q"
        placeholder="Tu comuna, ej. Ñuñoa"
        className="min-w-0 flex-1 bg-transparent py-2 text-[17px] text-tinta placeholder:text-slate-500 focus:outline-none"
      />
      <button className="btn-acento min-h-12 shrink-0 px-5 text-[16px]"><span>Buscar<span className="hidden sm:inline"> hora</span></span></button>
    </form>
  );
}

function VistaPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_1px_2px_rgb(38_33_74/0.06),0_24px_48px_-28px_rgb(38_33_74/0.35)]" aria-label="Vista de la agenda de una matrona, con datos de ejemplo" role="img">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
        <p className="font-titulo text-xl">Viernes 27 de noviembre</p>
        <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
          <span className="rounded-full bg-white px-3 py-1 shadow-sm">Día</span>
          <span className="px-3 py-1 text-slate-600">Semana</span>
        </div>
      </div>
      <div className="grid md:grid-cols-[1fr_17rem]">
        <div className="relative grid grid-cols-[3.25rem_1fr] px-3 py-4 sm:px-5">
          <ol className="text-right text-xs text-slate-500">
            {["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((h) => (
              <li key={h} className="cifra h-14 pr-3 font-medium -translate-y-2">{h}</li>
            ))}
          </ol>
          <div className="relative h-[504px] border-l border-slate-200" style={{ backgroundImage: "linear-gradient(to bottom, var(--color-slate-200) 1px, transparent 1px)", backgroundSize: "100% 56px" }}>
            <div className="absolute inset-x-0 top-[130px] z-10 flex items-center" aria-hidden="true">
              <span className="-ml-1 size-2 rounded-full bg-marca-700" />
              <span className="h-0.5 flex-1 bg-marca-700" />
            </div>
            {DIA_PANEL.map((c) => (
              <div
                key={c.h + c.p}
                className={`absolute inset-x-2 overflow-hidden rounded-lg border px-3 py-1.5 text-[13px] leading-tight ${ESTILO_BLOQUE[c.e]}`}
                style={{ top: c.ini * PX_MIN + 2, height: c.dur * PX_MIN - 4 }}
              >
                <p className="truncate font-semibold">
                  <span className="cifra">{c.h}</span> {c.p}
                </p>
                {c.dur >= 60 && <p className="truncate opacity-80">{c.s}</p>}
              </div>
            ))}
          </div>
        </div>
        <aside className="border-t border-slate-200 bg-marca-50 p-5 md:border-t-0 md:border-l">
          <p className="text-sm font-semibold text-marca-700">Siguiente</p>
          <p className="cifra mt-1 text-[40px] leading-none tracking-[-0.03em]">11:30</p>
          <p className="mt-3 text-lg font-bold">Josefa Contreras</p>
          <p className="text-slate-600">Toma de PAP, 30 minutos</p>
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[15px] text-slate-700">“Me toca el PAP anual”</p>
          <span className="btn mt-4 w-full">Abrir ficha</span>
          <dl className="mt-6 grid grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-center">
            <div><dt className="text-xs text-slate-500">Atendidas</dt><dd className="cifra text-xl">2</dd></div>
            <div><dt className="text-xs text-slate-500">Por atender</dt><dd className="cifra text-xl">4</dd></div>
            <div><dt className="text-xs text-slate-500">No asistió</dt><dd className="cifra text-xl">1</dd></div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function CorreoRecordatorio() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white" role="img" aria-label="Email de recordatorio que recibe la paciente un día antes">
      <div className="space-y-1 bg-menta px-5 py-4 text-[15px]">
        <p><span className="text-slate-600">De</span> agenda salud</p>
        <p><span className="text-slate-600">Asunto</span> <span className="font-semibold">Mañana tienes hora con Camila Rojas</span></p>
      </div>
      <div className="px-6 py-7 sm:px-8">
        <p className="font-titulo text-[28px] leading-tight">Te esperamos mañana</p>
        <span className="cinta mt-5 [animation:none]">
          <span className="truncate">Lun 30 nov, 10:30, Camila Rojas</span>
          <span className="cinta-broche" aria-hidden="true" />
        </span>
        <div className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-[15px]">
          <span className="text-slate-500">Qué</span>
          <span>Control prenatal</span>
          <span className="text-slate-500">Dónde</span>
          <span>Av. Irarrázaval 2401, oficina 304, Ñuñoa</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="inline-flex min-h-10 items-center rounded-full bg-marca-700 px-4 text-sm font-semibold text-white">Ver mi cita</span>
          <span className="inline-flex min-h-10 items-center rounded-full border-2 border-tinta px-4 text-sm font-semibold">Cambiar hora</span>
        </div>
      </div>
    </div>
  );
}

const FICHAS = [
  { esp: "Matronería", campos: "FUR, edad gestacional, fórmula obstétrica y último PAP" },
  { esp: "Nutrición", campos: "Peso por control, IMC y avance hacia la meta" },
  { esp: "Kinesiología", campos: "Dolor EVA por sesión y sesiones indicadas" },
  { esp: "Psicología", campos: "Ánimo y riesgo de cada sesión, enfoque del proceso" },
  { esp: "Medicina general", campos: "Presión arterial, IMC y enfermedades crónicas" },
];

export default async function Inicio() {
  const especialidades = await cargarEspecialidades();
  return (
    <>
      {/* Portada: la reserva misma, usable, en tiras de papel. */}
      <section>
        <div className="contenedor grid grid-cols-1 items-center gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_31rem] lg:gap-14 lg:py-20">
          <div className="min-w-0">
            <h1 className="max-w-[12ch] text-[46px] text-balance sm:text-[72px] lg:text-[84px]">
              Toma hora con tu profesional de salud.
            </h1>
            <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-slate-700 sm:text-xl">
              Matronas, psicólogas, nutricionistas, kinesiólogos y más profesionales independientes publican aquí sus horas libres. Eliges día y hora en la tira, y tu reserva queda impresa en una cinta.
            </p>
            <div className="mt-9">
              <Buscador id="comuna" />
            </div>
            <nav aria-label="Especialidades" className="mt-6 flex max-w-xl flex-wrap gap-2">
              {especialidades.map((e) => (
                <Link key={e.slug} href={`/profesionales?especialidad=${e.slug}`} className="chip">{e.nombre}</Link>
              ))}
            </nav>
            <p className="mt-5 max-w-[52ch] text-[15px] text-slate-600">
              El día antes te llega un recordatorio por email. Si no puedes ir, cambias o cancelas en línea.
            </p>
          </div>
          <div>
            <ReservaDemo />
            <p className="mt-3 text-center text-sm text-slate-600">Profesional y horas de muestra. Prueba elegir otra hora.</p>
          </div>
        </div>
      </section>

      {/* Vista profesional: el día en su grilla de tiempo. */}
      <section aria-labelledby="pro" className="border-t border-slate-200 py-20 sm:py-28">
        <div className="contenedor">
          <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end">
            <h2 id="pro" className="max-w-[16ch] text-[34px] leading-[1.05] text-balance sm:text-[52px]">
              Para profesionales: tu día completo en una pantalla.
            </h2>
            <p className="max-w-[50ch] text-lg text-slate-700 lg:justify-self-end">
              Cada cita en su hora, la que sigue marcada y lo que falta por cerrar a la vista. Publicas tus horarios una vez y las pacientes reservan solas, sin dobles citas.
            </p>
          </div>
          <div className="mt-12">
            <VistaPanel />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link href="/registro?rol=profesional" className="btn min-h-12 px-5 text-base">Crear mi agenda</Link>
            <p className="text-[15px] text-slate-600">Configuras prestaciones, duración y horarios en minutos.</p>
          </div>
        </div>
      </section>

      {/* Ficha: cambia según la especialidad. La muestra es la cuenta de matronería. */}
      <section aria-labelledby="ficha" className="border-y border-slate-200 bg-white py-20 sm:py-28">
        <div className="contenedor grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <h2 id="ficha" className="max-w-[15ch] text-[34px] leading-[1.05] text-balance sm:text-[52px]">
              Una ficha que habla el idioma de tu especialidad.
            </h2>
            <p className="mt-5 max-w-[46ch] text-lg text-slate-700">
              Cada especialidad trae sus propios campos y su resumen clínico, además de diagnóstico, alergias e historial de atenciones.
            </p>
            <dl className="mt-6 divide-y divide-slate-200 border-y border-slate-200">
              {FICHAS.map((x) => (
                <div key={x.esp} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
                  <dt className="font-semibold">{x.esp}</dt>
                  <dd className="text-[15px] text-slate-700">{x.campos}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 rounded-xl bg-rosa-claro px-5 py-4">
              <span className="text-sm font-semibold text-slate-600">Antecedentes</span>
              <span className="cifra text-[28px] tracking-[-0.02em]">G2 P1 A0 C0</span>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-alerta">Alergia: penicilina</span>
            </div>
            <CalculadoraFur />
            <p className="text-sm text-slate-600">Así se ve en matronería: cambia la FUR para probar la cuenta.</p>
          </div>
        </div>
      </section>

      {/* Recordatorio. */}
      <section aria-labelledby="recordatorio" className="py-20 sm:py-28">
        <div className="contenedor grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <CorreoRecordatorio />
          <div className="lg:order-first">
            <h2 id="recordatorio" className="max-w-[14ch] text-[34px] leading-[1.05] text-balance sm:text-[52px]">
              Un día antes, la paciente recibe esto.
            </h2>
            <p className="mt-5 max-w-[44ch] text-lg text-slate-700">
              Con la hora, el lugar y un enlace para cambiarla. Si cancela, la hora vuelve a quedar libre en tu agenda.
            </p>
          </div>
        </div>
      </section>

      {/* Cierre: dos puertas, una acción cada una. */}
      <section aria-label="Empezar" className="contenedor pb-20 sm:pb-28">
        <div className="grid overflow-hidden rounded-3xl lg:grid-cols-2">
          <div className="bg-menta p-8 sm:p-12">
            <h2 className="text-4xl sm:text-5xl">Busco hora</h2>
            <p className="mt-3 max-w-[40ch] text-lg text-slate-700">Escribe tu comuna y mira quién atiende cerca.</p>
            <div className="mt-8">
              <Buscador id="comuna-cierre" />
            </div>
          </div>
          <div className="bg-marca-700 p-8 text-white sm:p-12">
            <h2 className="text-4xl sm:text-5xl">Atiendo pacientes</h2>
            <p className="mt-3 max-w-[40ch] text-lg text-white">Publica tus horas, recibe reservas, lleva la ficha de cada paciente y deriva a colegas de otras especialidades.</p>
            <Link href="/registro?rol=profesional" className="mt-8 inline-flex min-h-13 items-center rounded-full bg-white px-6 text-[17px] font-semibold text-tinta transition-colors hover:bg-amarillo">
              Crear mi agenda
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
