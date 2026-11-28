import Link from "next/link";
import { formatoDia, hoyChile } from "@/lib/fechas";
import { calcularIndicadores, rangoPeriodo, type Conteos } from "@/lib/indicadores";
import { requerirProfesional } from "@/lib/sesion";

export const metadata = { title: "Indicadores" };

const PERIODOS = [
  { clave: "mes", t: "Este mes" },
  { clave: "mes-anterior", t: "Mes anterior" },
  { clave: "90", t: "Últimos 90 días" },
];

function Cifra({ titulo, valor, detalle, alerta }: { titulo: string; valor: string; detalle?: string; alerta?: boolean }) {
  return (
    <div className={`p-5 ${alerta ? "bg-alerta-claro" : ""}`}>
      <p className={`text-sm font-semibold ${alerta ? "text-alerta" : "text-slate-600"}`}>{titulo}</p>
      <p className="cifra mt-2 text-3xl">{valor}</p>
      {detalle && <p className={`mt-1 text-sm ${alerta ? "font-semibold text-alerta" : "text-slate-600"}`}>{detalle}</p>}
    </div>
  );
}

export default async function Indicadores({ searchParams }: PageProps<"/panel/indicadores">) {
  const sp = await searchParams;
  const { supabase } = await requerirProfesional();
  const rango = rangoPeriodo(typeof sp.periodo === "string" ? sp.periodo : undefined, hoyChile());
  const { data, error } = await supabase.rpc("indicadores_profesional", { p_desde: rango.desde, p_hasta: rango.hasta });
  const vacio: Conteos = { agendadas: 0, confirmadas: 0, completadas: 0, canceladas: 0, no_asistio: 0, pacientes_atendidos: 0, fichas_completas: 0 };
  const i = calcularIndicadores((data as Conteos | null) ?? vacio);
  const p = (n: number | null) => (n == null ? "–" : `${n}%`);
  const total = i.completadas + i.canceladas + i.no_asistio + i.confirmadas;
  const barras = [
    { k: "Atendidas", n: i.completadas, c: "bg-marca-700" },
    { k: "Por atender", n: i.confirmadas, c: "bg-acento" },
    { k: "No asistió", n: i.no_asistio, c: "bg-alerta" },
    { k: "Canceladas", n: i.canceladas, c: "bg-slate-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="titulo">Indicadores</h1>
          <p className="mt-1 text-[15px] text-slate-600">
            <span className="mayus">{formatoDia(rango.desde, { weekday: undefined })}</span> al {formatoDia(rango.hasta, { weekday: undefined })}
          </p>
        </div>
        <nav aria-label="Periodo" className="flex flex-wrap gap-2">
          {PERIODOS.map((x) => (
            <Link key={x.clave} href={`/panel/indicadores?periodo=${x.clave}`} aria-current={rango.clave === x.clave ? "page" : undefined} className={`chip ${rango.clave === x.clave ? "chip-activo" : ""}`}>
              {x.t}
            </Link>
          ))}
        </nav>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[15px] text-red-900">No pudimos calcular los indicadores. Intenta de nuevo.</p>}

      <section aria-label="Resumen del periodo" className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4 [&>*]:border-slate-200 [&>*]:max-lg:border-b sm:[&>*:nth-child(odd)]:border-r lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0">
        <Cifra titulo="Citas agendadas" valor={String(i.agendadas)} detalle={`${i.pacientes_atendidos} ${i.pacientes_atendidos === 1 ? "paciente atendido" : "pacientes atendidos"}`} />
        <Cifra titulo="Realizadas" valor={p(i.tasaRealizadas)} detalle={`${i.completadas} de ${i.completadas + i.canceladas + i.no_asistio} ya ocurridas`} />
        <Cifra titulo="Inasistencia" valor={p(i.tasaInasistencia)} detalle={`${i.no_asistio} sin aviso`} alerta={(i.tasaInasistencia ?? 0) >= 20} />
        <Cifra titulo="Fichas completas" valor={p(i.completitudFichas)} detalle="Con diagnóstico y atención registrada" alerta={i.completitudFichas != null && i.completitudFichas < 50} />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="subtitulo">Estado de las citas</h2>
        {total === 0 ? (
          <p className="mt-3 text-[15px] text-slate-600">No hay citas en este periodo.</p>
        ) : (
          <>
            <div className="mt-4 flex h-4 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={barras.map((b) => `${b.k}: ${b.n}`).join(", ")}>
              {barras.filter((b) => b.n > 0).map((b) => (
                <span key={b.k} className={b.c} style={{ width: `${(b.n / total) * 100}%` }} />
              ))}
            </div>
            <ul className="mt-4 grid gap-2 text-[15px] sm:grid-cols-4">
              {barras.map((b) => (
                <li key={b.k} className="flex items-center gap-2">
                  <span className={`size-3 rounded-full ${b.c}`} aria-hidden="true" />
                  {b.k} <span className="cifra ml-auto sm:ml-0">{b.n}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <p className="text-sm text-slate-600">Las tasas solo cuentan citas que ya ocurrieron o se cancelaron. Las que siguen confirmadas aún no suman.</p>
    </div>
  );
}
