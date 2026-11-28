import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seguridad y privacidad",
  description: "Cómo Agenda Salud protege los datos de salud de pacientes y profesionales: quién ve qué, bitácora de accesos, conservación de la ficha y tus derechos.",
};

/*
  Página pública de seguridad de los datos. Solo afirma lo que la plataforma ya hace
  (ver docs/SEGURIDAD.md y docs/requerimientos-no-funcionales.md). Si una protección
  todavía está pendiente, no se menciona aquí hasta que exista.
*/

const QUIEN_VE = [
  { quien: "Tú, como paciente", ve: "Tus citas y los datos de tu cuenta." },
  { quien: "Tu profesional", ve: "Tu ficha, tus atenciones y tus citas con esa profesional o ese profesional. No ve lo que registran otros." },
  { quien: "Otra profesional o profesional", ve: "Nada tuyo. Si tu profesional te deriva, quien te recibe ve tus datos de contacto y el motivo de la derivación, pero no tu ficha." },
  { quien: "Cualquier visitante", ve: "Solo el perfil público de cada profesional: nombre, especialidad, prestaciones, horas libres y teléfono de consulta." },
];

const PROVEEDORES = [
  { nombre: "Supabase", uso: "Base de datos y cuentas de usuario", donde: "São Paulo, Brasil" },
  { nombre: "Vercel", uso: "Servidores de la página", donde: "São Paulo, Brasil" },
  { nombre: "Resend", uso: "Envío de emails de confirmación y recordatorio", donde: "Estados Unidos" },
];

function Bloque({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-4 border-t border-slate-200 py-10 sm:py-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <h2 id={id} className="font-titulo text-[26px] leading-tight text-balance sm:text-[30px]">{titulo}</h2>
      <div className="max-w-[62ch] space-y-4 text-[17px] leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

export default function Seguridad() {
  return (
    <div className="contenedor py-12 sm:py-16">
      <h1 className="max-w-[16ch] text-[40px] leading-[1.05] text-balance sm:text-[60px]">Cómo protegemos tus datos de salud</h1>
      <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-slate-700 sm:text-xl">
        En Agenda Salud se guardan fichas clínicas, y la ley chilena las trata como datos sensibles. Aquí explicamos, sin letra chica, quién puede ver qué y cómo lo resguardamos.
      </p>

      <div className="mt-12">
        <Bloque id="quien" titulo="Quién ve qué">
          <dl className="divide-y divide-slate-200 border-y border-slate-200">
            {QUIEN_VE.map((x) => (
              <div key={x.quien} className="grid gap-1 py-3 sm:grid-cols-[13rem_minmax(0,1fr)]">
                <dt className="font-semibold text-tinta">{x.quien}</dt>
                <dd className="text-[16px]">{x.ve}</dd>
              </div>
            ))}
          </dl>
          <p>
            Estas reglas no dependen solo de la pantalla: están escritas en la propia base de datos. Aunque alguien intentara pedir los datos por fuera de la página, la base le respondería sin filas.
          </p>
        </Bloque>

        <Bloque id="bitacora" titulo="Cada acceso queda registrado">
          <p>
            Cuando una profesional o un profesional abre una ficha, registra una atención, corrige un dato o deriva a una paciente, queda una línea en la bitácora con quién lo hizo y a qué hora.
          </p>
          <p>Esa bitácora solo crece. Nadie, tampoco nuestro equipo desde la aplicación, puede editarla ni borrar líneas.</p>
        </Bloque>

        <Bloque id="ficha" titulo="La ficha no se borra ni se reescribe">
          <p>
            La Ley 20.584 pide conservar la ficha clínica al menos 15 años. Por eso la plataforma no permite borrar fichas ni atenciones, ni siquiera si se elimina una cuenta.
          </p>
          <p>
            Las atenciones ya registradas no se pueden sobrescribir. Si se corrige algo de la ficha, la versión anterior queda guardada con su fecha, para que el historial sea fiel a lo que pasó.
          </p>
        </Bloque>

        <Bloque id="cifrado" titulo="Conexión cifrada y página protegida">
          <p>
            Toda la comunicación con Agenda Salud viaja cifrada por HTTPS, y la base de datos guarda la información cifrada en sus discos.
          </p>
          <p>
            La página usa cabeceras de seguridad que impiden cargar código de terceros, incrustarla en otros sitios o engañar al navegador. No hay publicidad ni rastreadores en las pantallas con datos de pacientes.
          </p>
        </Bloque>

        <Bloque id="pruebas" titulo="Lo ponemos a prueba">
          <p>
            Atacamos nuestra propia plataforma con pruebas basadas en el OWASP Top 10, la lista de fallas de seguridad web más comunes: intentos de leer fichas ajenas, de hacerse pasar por otra cuenta, de inyectar código y de acaparar horas. También probamos cada regla de acceso de la base de datos, por cada tipo de usuario.
          </p>
        </Bloque>

        <Bloque id="donde" titulo="Dónde se guardan los datos">
          <p>Usamos estos proveedores. Cada uno procesa los datos solo para prestar su servicio.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] border-y border-slate-200 text-left text-[16px]">
              <thead>
                <tr className="border-b border-slate-200 text-sm text-slate-600">
                  <th scope="col" className="py-2 pr-4 font-semibold">Proveedor</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Para qué</th>
                  <th scope="col" className="py-2 font-semibold">Dónde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {PROVEEDORES.map((p) => (
                  <tr key={p.nombre}>
                    <th scope="row" className="py-2.5 pr-4 font-semibold text-tinta">{p.nombre}</th>
                    <td className="py-2.5 pr-4">{p.uso}</td>
                    <td className="py-2.5">{p.donde}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Bloque>

        <Bloque id="derechos" titulo="Tus derechos">
          <p>
            Según la Ley 21.719 de protección de datos personales puedes pedir acceso a tus datos, que se corrijan, que se dejen de usar para algo o que se eliminen. La Ley 20.584 te da además derecho a pedir una copia de tu ficha clínica.
          </p>
          <p>
            La responsable de tu ficha es tu profesional: pídeselo directamente. Lo único que no se puede eliminar es la ficha clínica mientras corre el plazo legal de 15 años.
          </p>
        </Bloque>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-10">
        <Link href="/profesionales" className="btn">Buscar profesional</Link>
        <Link href="/registro?rol=profesional" className="btn-sec">Crear mi agenda</Link>
      </div>
    </div>
  );
}
