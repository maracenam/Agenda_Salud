import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seguridad de los datos",
  description: "Cómo Agenda Salud protege los datos clínicos de tus pacientes: acceso exclusivo, bitácora, conservación por 15 años y cumplimiento de la ley chilena.",
};

/*
  Página de seguridad pensada para la profesional que evalúa la plataforma.
  Solo afirma lo que ya existe en el código (ver docs/SEGURIDAD.md). No menciona
  2FA, cierre por inactividad, CAPTCHA, límite de intentos ni IP en la bitácora
  hasta que estén implementados.
*/

const QUIEN_VE = [
  { quien: "Tú", ve: "Las fichas, atenciones y citas de tus pacientes. Solo las tuyas." },
  { quien: "Otra profesional o profesional", ve: "Nada de tus pacientes. Si derivas a alguien, quien lo recibe ve sus datos de contacto y el motivo que escribiste, no tu ficha." },
  { quien: "Tu paciente", ve: "Sus propias citas y los datos de su cuenta." },
  { quien: "Cualquier visitante", ve: "Solo tu perfil público: nombre, especialidad, prestaciones, horas libres y teléfono de consulta." },
];

const LEYES = [
  { ley: "Ley 20.584", pide: "Que la ficha sea reservada y se conserve al menos 15 años.", hace: "Solo tú accedes a tus fichas, y la plataforma no permite borrar fichas ni atenciones, ni siquiera al eliminar una cuenta." },
  { ley: "Decreto 41 de 2012", pide: "Que cada registro tenga autor y fecha, y que una corrección no borre lo anterior.", hace: "La base de datos pone tu identidad y la hora en cada registro. Las atenciones no se sobrescriben y cada corrección de la ficha guarda la versión anterior." },
  { ley: "Ley 21.719", pide: "Medidas de seguridad para los datos sensibles, y que quien los procesa por ti lo haga solo para ese fin.", hace: "Tú eres responsable de los datos; Agenda Salud los procesa por cuenta tuya, solo para darte el servicio." },
];

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-slate-200 py-10 sm:py-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <h2 id={id} className="font-titulo text-[26px] leading-tight text-balance sm:text-[30px]">{titulo}</h2>
      <div className="max-w-[64ch] space-y-4 text-[17px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function Filas({ filas }: { filas: { a: string; b: string }[] }) {
  return (
    <dl className="divide-y divide-slate-200 border-y border-slate-200">
      {filas.map((x) => (
        <div key={x.a} className="grid gap-1 py-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
          <dt className="font-semibold text-tinta">{x.a}</dt>
          <dd className="text-[16px]">{x.b}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Seguridad() {
  return (
    <div className="contenedor py-12 sm:py-16">
      <h1 className="max-w-[17ch] text-[40px] leading-[1.05] text-balance sm:text-[60px]">Los datos de tus pacientes, protegidos</h1>
      <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-slate-700 sm:text-xl">
        Una ficha clínica es un dato sensible, y como profesional respondes por ella. Aquí está, sin letra chica, cómo la resguarda Agenda Salud y qué parte de la ley cubre por ti.
      </p>

      <div className="mt-12">
        <Bloque id="quien" titulo="Solo tú ves tus fichas">
          <Filas filas={QUIEN_VE.map((x) => ({ a: x.quien, b: x.ve }))} />
          <p>
            Estas reglas no dependen de la pantalla: están escritas en la propia base de datos. Aunque alguien intentara pedir los datos por fuera de la página, la base le respondería sin filas.
          </p>
        </Bloque>

        <Bloque id="ley" titulo="La ley chilena, cubierta">
          <div className="space-y-5">
            {LEYES.map((l) => (
              <div key={l.ley} className="border-l-4 border-marca-200 pl-4">
                <p className="font-semibold text-tinta">{l.ley}</p>
                <p className="mt-1 text-[16px] text-slate-600">Pide: {l.pide}</p>
                <p className="mt-1 text-[16px]">Aquí: {l.hace}</p>
              </div>
            ))}
          </div>
          <p className="text-[15px] text-slate-600">
            La plataforma te da las herramientas; el uso que hagas de ellas sigue siendo tu responsabilidad profesional.
          </p>
        </Bloque>

        <Bloque id="bitacora" titulo="Cada acceso queda registrado">
          <p>
            Cada vez que se abre una ficha, se registra una atención, se corrige un dato, se cambia una cita o se deriva a una paciente, queda una línea en la bitácora con quién lo hizo y a qué hora.
          </p>
          <p>Esa bitácora solo crece: nadie puede editarla ni borrar líneas desde la plataforma.</p>
        </Bloque>

        <Bloque id="pacientes" titulo="Si eres paciente">
          <p>
            La Ley 21.719 te permite pedir acceso a tus datos, que se corrijan, que se dejen de usar o que se eliminen, y la Ley 20.584 te da derecho a una copia de tu ficha. Pídeselo a tu profesional, que es responsable de tu ficha. Lo único que no se puede eliminar es la ficha mientras corre el plazo legal de 15 años.
          </p>
        </Bloque>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-10">
        <Link href="/registro?rol=profesional" className="btn min-h-12 px-5 text-base">Crear mi agenda</Link>
        <p className="text-[15px] text-slate-600">Configuras prestaciones y horarios en minutos.</p>
      </div>
    </div>
  );
}
