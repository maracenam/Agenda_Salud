"use client";

import Link from "next/link";
import { useState } from "react";

/*
  Reserva de muestra en la portada, con la identidad "Cinta lustre".
  Cada día es una tira de papel con sus horas; al elegir una, la reserva queda
  impresa en una cinta con broche, como la pulsera de la maternidad.
  Los datos son de ejemplo y la portada lo dice; el botón lleva al buscador real.
*/

type Hora = { h: string; tomada?: boolean };
const DIAS: { id: string; corto: string; fecha: string; papel: string; giro: string; horas: Hora[] }[] = [
  { id: "lun", corto: "Lun", fecha: "30 nov", papel: "bg-menta", giro: "-rotate-2", horas: [{ h: "9:00" }, { h: "11:00", tomada: true }, { h: "16:30" }] },
  { id: "mar", corto: "Mar", fecha: "1 dic", papel: "bg-rosa-claro", giro: "rotate-[1.5deg] translate-y-1.5", horas: [{ h: "10:30" }, { h: "12:00" }, { h: "15:00", tomada: true }] },
  { id: "mie", corto: "Mié", fecha: "2 dic", papel: "bg-white", giro: "-rotate-1", horas: [{ h: "9:30", tomada: true }, { h: "11:30" }, { h: "17:00" }] },
  { id: "jue", corto: "Jue", fecha: "3 dic", papel: "bg-menta", giro: "rotate-[2deg] translate-y-1", horas: [{ h: "8:30" }, { h: "13:00" }, { h: "18:00" }] },
];

export function ReservaDemo() {
  const [eleccion, setEleccion] = useState<{ dia: string; fecha: string; h: string } | null>({ dia: "Mar", fecha: "1 dic", h: "10:30" });

  return (
    <div className="rounded-[28px] bg-marca-700 p-5 text-white sm:p-7">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="font-titulo text-[22px] leading-tight">Camila Rojas, matrona</p>
        <p className="text-sm text-marca-100">Ñuñoa, control prenatal de 45 min</p>
      </div>

      <fieldset className="mt-5">
        <legend className="sr-only">Elige día y hora</legend>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {DIAS.map((d) => (
            <div key={d.id} className={`flex flex-col items-center gap-2.5 rounded-md px-1 pt-3 pb-4 text-tinta shadow-[0_2px_0_rgb(38_33_74/0.25)] ${d.papel} ${d.giro}`}>
              <p className="text-center leading-tight">
                <span className="block font-titulo text-[15px]">{d.corto}</span>
                <span className="text-xs text-slate-600">{d.fecha}</span>
              </p>
              {d.horas.map((x) => {
                const activa = eleccion?.dia === d.corto && eleccion.h === x.h;
                return (
                  <button
                    key={x.h}
                    type="button"
                    disabled={x.tomada}
                    aria-pressed={x.tomada ? undefined : activa}
                    aria-label={x.tomada ? `${d.corto} ${x.h}, ocupada` : `${d.corto} ${d.fecha}, ${x.h}`}
                    onClick={() => setEleccion({ dia: d.corto, fecha: d.fecha, h: x.h })}
                    className={`cifra grid size-12 cursor-pointer place-items-center rounded-full border-2 border-tinta text-[13px] transition-[transform,background-color] duration-200 sm:size-14 sm:text-[15px] disabled:cursor-not-allowed disabled:border-dashed disabled:text-slate-500 disabled:line-through disabled:opacity-60 ${
                      activa ? "-rotate-6 scale-110 bg-amarillo" : "hover:bg-white/60"
                    }`}
                  >
                    {x.h}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </fieldset>

      <div className="mt-7 flex min-h-16 flex-wrap items-center gap-3" aria-live="polite">
        {eleccion ? (
          <span key={`${eleccion.dia}${eleccion.h}`} className="cinta">
            <span className="truncate">
              {eleccion.dia} {eleccion.fecha}, {eleccion.h}, Camila Rojas
            </span>
            <span className="cinta-broche" aria-hidden="true" />
          </span>
        ) : (
          <span className="text-[15px] text-marca-100">Elige una hora para ver tu cinta.</span>
        )}
      </div>
      <Link
        href="/profesionales"
        className="mt-4 inline-flex min-h-12 items-center rounded-full bg-white px-6 text-base font-semibold text-tinta transition-colors hover:bg-marca-50"
      >
        Buscar horas reales
      </Link>
    </div>
  );
}
