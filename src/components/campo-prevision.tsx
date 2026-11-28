import { PREVISIONES, type Prevision } from "@/lib/ingresos";

/** Previsión de la paciente (Fonasa, Isapre o particular). Con conIsapre pide el nombre de la Isapre. */
export function CampoPrevision({ valor, isapre, conIsapre, requerido }: { valor?: Prevision | null; isapre?: string | null; conIsapre?: boolean; requerido?: boolean }) {
  return (
    <fieldset className="group">
      <legend className="etiqueta">¿Cómo te atiendes?</legend>
      <div className="flex flex-wrap gap-2">
        {PREVISIONES.map((p) => (
          <label key={p.valor} className="chip cursor-pointer has-checked:border-marca-700 has-checked:bg-marca-700 has-checked:text-white has-focus-visible:outline-3 has-focus-visible:outline-amarillo">
            <input type="radio" name="prevision" value={p.valor} defaultChecked={valor === p.valor} required={requerido} className="sr-only" />
            {p.t}
          </label>
        ))}
      </div>
      {conIsapre && (
        <div className="mt-3 hidden max-w-xs group-has-[input[value=isapre]:checked]:block">
          <label className="etiqueta" htmlFor="isapre">Nombre de tu Isapre</label>
          <input className="campo" id="isapre" name="isapre" maxLength={60} defaultValue={isapre ?? ""} placeholder="Por ejemplo, Colmena" />
        </div>
      )}
    </fieldset>
  );
}
