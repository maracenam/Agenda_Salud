"use client";

import { useState } from "react";

/*
  La misma cuenta que hace la ficha: edad gestacional y fecha probable de parto
  desde la FUR (regla de Naegele, 280 días). Funciona de verdad.
*/

const DIA = 86_400_000;

function hoyLocal() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function aISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function calcular(fur: string) {
  const f = Date.parse(fur);
  if (Number.isNaN(f)) return null;
  const dias = Math.floor((hoyLocal().getTime() - f) / DIA);
  if (dias < 0 || dias > 300) return null;
  const fpp = new Date(f + 280 * DIA);
  return {
    semanas: Math.floor(dias / 7),
    dias: dias % 7,
    fpp: new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(fpp),
  };
}

export function CalculadoraFur() {
  const [fur, setFur] = useState(() => aISO(new Date(hoyLocal().getTime() - (24 * 7 + 3) * DIA)));
  const r = calcular(fur);

  return (
    <div className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
      <div className="bg-white p-5">
        <label htmlFor="fur-demo" className="text-sm font-semibold text-slate-600">FUR</label>
        <input
          id="fur-demo"
          type="date"
          value={fur}
          max={aISO(hoyLocal())}
          onChange={(e) => setFur(e.target.value)}
          className="campo mt-2 text-[17px]"
        />
      </div>
      <div className="bg-white p-5" aria-live="polite">
        <p className="text-sm font-semibold text-slate-600">Edad gestacional</p>
        <p className="cifra mt-2 text-[40px] leading-none tracking-[-0.03em] text-marca-700">
          {r ? (
            <>
              {r.semanas}
              <span className="text-slate-400">+</span>
              {r.dias}
            </>
          ) : (
            "–"
          )}
        </p>
        <p className="mt-1 text-sm text-slate-600">semanas y días</p>
      </div>
      <div className="bg-white p-5">
        <p className="text-sm font-semibold text-slate-600">Fecha probable de parto</p>
        <p className="mt-2 text-xl leading-snug font-bold">{r ? r.fpp : "Revisa la FUR"}</p>
      </div>
    </div>
  );
}
