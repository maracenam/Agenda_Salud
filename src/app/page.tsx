import Link from "next/link";

const BENEFICIOS = [
  { t: "Reserva online 24/7", d: "Tus pacientes eligen su hora desde el celular, sin WhatsApp de ida y vuelta." },
  { t: "Cero dobles citas", d: "El sistema bloquea cualquier hora ya tomada, aunque dos personas reserven al mismo tiempo." },
  { t: "Ficha clínica digital", d: "Antecedentes gineco-obstétricos, FUR, PAP y el historial de cada control en un solo lugar." },
  { t: "Recordatorios automáticos", d: "Cada paciente recibe un email el día antes de su cita. Menos inasistencias." },
];

export default function Inicio() {
  return (
    <div className="space-y-12">
      <section className="py-8 text-center">
        <p className="mb-3 text-sm font-medium text-marca-700">Para matronas y matrones independientes</p>
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-slate-900">
          Tu consulta ordenada: agenda, fichas y recordatorios en un solo lugar
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-600">
          Deja la libreta, el Excel y los mensajes sueltos. Agenda Salud organiza tus horas y tus pacientes por ti.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/registro?rol=profesional" className="btn px-6 py-3 text-base">Soy matrona: crear mi agenda</Link>
          <Link href="/profesionales" className="btn-sec px-6 py-3 text-base">Busco hora con una matrona</Link>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2">
        {BENEFICIOS.map((b) => (
          <div key={b.t} className="tarjeta">
            <h2 className="font-semibold text-slate-900">{b.t}</h2>
            <p className="mt-1 text-sm text-slate-600">{b.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
