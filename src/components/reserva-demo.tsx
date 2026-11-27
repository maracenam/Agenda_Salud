"use client";

import Link from "next/link";
import { useState } from "react";

/*
  Reserva de muestra en la portada. Se puede usar: eliges día y hora y el pie
  cambia. Los datos son de ejemplo y el texto lo dice; el botón lleva al buscador real.
*/

const DIAS = [
  { id: "lun", corto: "Lun", n: 30, largo: "Lunes 30 de noviembre", horas: ["09:00", "09:45", "11:15", "12:00", "15:00", "15:45", "17:15"] },
  { id: "mar", corto: "Mar", n: 1, largo: "Martes 1 de diciembre", horas: ["09:45", "10:30", "12:00", "16:30", "18:00"] },
  { id: "mie", corto: "Mié", n: 2, largo: "Miércoles 2 de diciembre", horas: ["09:00", "10:30", "11:15"] },
  { id: "jue", corto: "Jue", n: 3, largo: "Jueves 3 de diciembre", horas: [] },
  { id: "vie", corto: "Vie", n: 4, largo: "Viernes 4 de diciembre", horas: ["09:00", "09:45", "10:30", "15:00", "17:15", "18:00"] },
];

export function ReservaDemo() {
  const [dia, setDia] = useState(1);
  const [hora, setHora] = useState<string | null>("10:30");
  const d = DIAS[dia];

  return (
    <div className="rounded-3xl bg-white text-tinta shadow-[0_2px_4px_rgb(43_16_39/0.2),0_30px_60px_-20px_rgb(0_0_0/0.55)]">
      <div className="flex items-center gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
        <span className="insignia size-12 text-base">CR</span>
        <div className="min-w-0">
          <p className="text-lg leading-tight font-bold">Camila Rojas</p>
          <p className="text-[15px] text-slate-600">Matrona en Ñuñoa, control prenatal de 45 minutos</p>
        </div>
      </div>

      <fieldset className="mt-5 px-5 sm:px-6">
        <legend className="mb-2 text-sm font-semibold text-slate-600">Día</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {DIAS.map((x, i) => {
            const activo = i === dia;
            const vacio = x.horas.length === 0;
            return (
              <button
                key={x.id}
                type="button"
                disabled={vacio}
                aria-pressed={activo}
                onClick={() => {
                  setDia(i);
                  setHora(null);
                }}
                className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed ${
                  activo
                    ? "border-marca-700 bg-marca-700 text-white"
                    : vacio
                      ? "border-transparent bg-slate-100 text-slate-400"
                      : "border-slate-200 hover:border-marca-600"
                }`}
              >
                <span className={`text-xs font-medium ${activo ? "text-marca-100" : ""}`}>{x.corto}</span>
                <span className={`cifra text-xl leading-tight ${vacio ? "line-through decoration-slate-300" : ""}`}>{x.n}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-5 px-5 sm:px-6">
        <legend className="mb-2 text-sm font-semibold text-slate-600">Horas libres</legend>
        <div key={d.id} className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {d.horas.map((h, i) => {
            const activa = h === hora;
            return (
              <button
                key={h}
                type="button"
                aria-pressed={activa}
                onClick={() => setHora(h)}
                className={`cifra flex min-h-11 cursor-pointer items-center justify-center rounded-lg text-[15px] transition-colors ${
                  activa ? "bg-acento text-white" : "bg-acento-claro text-acento hover:bg-acento-suave"
                }`}
              >
                <span className="tablero-cifra" style={{ "--i": i } as React.CSSProperties}>{h}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <p aria-live="polite" className="text-[15px]">
          {hora ? (
            <>
              <span className="block font-bold">{d.largo}</span>
              <span className="text-slate-600">a las {hora}, en Av. Irarrázaval</span>
            </>
          ) : (
            <span className="text-slate-600">Elige una hora</span>
          )}
        </p>
        <Link href="/profesionales" className={`btn-acento min-h-11 px-4 text-[15px] ${hora ? "" : "pointer-events-none opacity-40"}`} aria-disabled={!hora}>
          Reservar esta hora
        </Link>
      </div>
    </div>
  );
}
