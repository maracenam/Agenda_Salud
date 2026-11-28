/**
 * Módulos por especialidad (CU-02, CU-03, CU-07, CU-08).
 * Cada especialidad define los campos propios de su ficha, lo que se mide en cada
 * atención, sus prestaciones habituales y las tarjetas del resumen clínico.
 * Una especialidad sin módulo propio usa el módulo general.
 */
import { edadGestacional, imc, mesesDesde, presionElevada } from "@/lib/calculos";

export type Campo =
  | { clave: string; etiqueta: string; tipo: "numero"; min: number; max: number; paso?: number; unidad?: string }
  | { clave: string; etiqueta: string; tipo: "fecha" }
  | { clave: string; etiqueta: string; tipo: "texto"; filas?: number; max?: number }
  | { clave: string; etiqueta: string; tipo: "opcion"; opciones: string[] };

export type Valor = string | number;
export type Datos = Record<string, Valor>;

export type Tarjeta = { titulo: string; valor: string; detalle?: string; alerta?: boolean };

export type Modulo = {
  slug: string;
  /** Título del bloque propio de la especialidad en la ficha. */
  tituloFicha: string;
  ficha: Campo[];
  /** Lo que se registra en cada atención, además de motivo, diagnóstico e indicaciones. */
  atencion: Campo[];
  prestaciones: { nombre: string; duracion: number }[];
  ejemplos: { titulo: string; bio: string; motivo: string };
  /** Tarjetas del resumen clínico, a partir de la ficha y de las atenciones (la más reciente primero). */
  resumen: (ficha: Datos, atenciones: Datos[], hoy: string) => Tarjeta[];
};

const num = (v: Valor | undefined) => (typeof v === "number" ? v : null);
const str = (v: Valor | undefined) => (typeof v === "string" && v.trim() ? v : null);
const fechaCorta = (f: string) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(f + "T12:00:00Z"),
  );
const ultimo = (atenciones: Datos[], clave: string) => atenciones.find((a) => a[clave] != null && a[clave] !== "")?.[clave];

const GENERAL: Modulo = {
  slug: "general",
  tituloFicha: "Datos de la especialidad",
  ficha: [],
  atencion: [],
  prestaciones: [
    { nombre: "Primera consulta", duracion: 45 },
    { nombre: "Control", duracion: 30 },
  ],
  ejemplos: { titulo: "Profesional de la salud", bio: "Tu experiencia y en qué te enfocas.", motivo: "Por ejemplo, primera consulta" },
  resumen: (_f, atenciones) => [
    { titulo: "Atenciones", valor: String(atenciones.length), detalle: atenciones.length ? undefined : "Sin atenciones todavía" },
  ],
};

const MODULOS: Record<string, Modulo> = {
  matroneria: {
    slug: "matroneria",
    tituloFicha: "Gineco-obstétrico",
    ficha: [
      { clave: "gestas", etiqueta: "Gestas", tipo: "numero", min: 0, max: 30 },
      { clave: "partos", etiqueta: "Partos", tipo: "numero", min: 0, max: 30 },
      { clave: "abortos", etiqueta: "Abortos", tipo: "numero", min: 0, max: 30 },
      { clave: "cesareas", etiqueta: "Cesáreas", tipo: "numero", min: 0, max: 30 },
      { clave: "fur", etiqueta: "FUR", tipo: "fecha" },
      { clave: "ultimo_pap", etiqueta: "Último PAP", tipo: "fecha" },
      { clave: "metodo_anticonceptivo", etiqueta: "Método anticonceptivo", tipo: "texto", filas: 1, max: 200 },
    ],
    atencion: [
      { clave: "peso", etiqueta: "Peso", tipo: "numero", min: 20, max: 250, paso: 0.1, unidad: "kg" },
      { clave: "presion", etiqueta: "Presión arterial", tipo: "texto", filas: 1, max: 10 },
      { clave: "altura_uterina", etiqueta: "Altura uterina", tipo: "numero", min: 0, max: 50, unidad: "cm" },
      { clave: "lcf", etiqueta: "Latidos cardiofetales", tipo: "numero", min: 0, max: 220, unidad: "lpm" },
    ],
    prestaciones: [
      { nombre: "Control prenatal", duracion: 45 },
      { nombre: "Control ginecológico", duracion: 30 },
      { nombre: "Toma de PAP", duracion: 30 },
      { nombre: "Consejería en anticoncepción", duracion: 30 },
      { nombre: "Asesoría de lactancia", duracion: 60 },
      { nombre: "Control de puerperio", duracion: 45 },
    ],
    ejemplos: {
      titulo: "Matrona, Universidad de Chile",
      bio: "Tu experiencia y en qué te enfocas: control prenatal, ginecología, lactancia.",
      motivo: "Por ejemplo, control de embarazo de 12 semanas",
    },
    resumen: (f, _a, hoy) => {
      const g = (k: string) => (num(f[k]) ?? "–").toString();
      const eg = edadGestacional(str(f.fur), hoy);
      const pap = str(f.ultimo_pap);
      const meses = mesesDesde(pap, hoy);
      return [
        { titulo: "Fórmula obstétrica", valor: `G${g("gestas")} P${g("partos")} A${g("abortos")} C${g("cesareas")}` },
        eg
          ? { titulo: "Edad gestacional", valor: `${eg.semanas}+${eg.dias} semanas`, detalle: `Parto probable el ${fechaCorta(eg.fpp)}` }
          : { titulo: "Edad gestacional", valor: "–", detalle: "Sin FUR registrada" },
        pap
          ? {
              titulo: "Último PAP",
              valor: fechaCorta(pap),
              detalle: meses != null && meses >= 12 ? `Hace ${meses} meses, toca repetirlo` : meses === 0 ? "Este mes" : `Hace ${meses} ${meses === 1 ? "mes" : "meses"}`,
              alerta: meses != null && meses >= 12,
            }
          : { titulo: "Último PAP", valor: "–", detalle: "Sin registro" },
      ];
    },
  },

  "medicina-general": {
    slug: "medicina-general",
    tituloFicha: "Antecedentes médicos",
    ficha: [
      { clave: "enfermedades_cronicas", etiqueta: "Enfermedades crónicas", tipo: "texto", filas: 2, max: 500 },
      { clave: "habitos", etiqueta: "Hábitos (tabaco, alcohol, actividad física)", tipo: "texto", filas: 2, max: 500 },
      { clave: "talla", etiqueta: "Talla", tipo: "numero", min: 40, max: 230, unidad: "cm" },
      { clave: "grupo_sanguineo", etiqueta: "Grupo sanguíneo", tipo: "opcion", opciones: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    ],
    atencion: [
      { clave: "presion", etiqueta: "Presión arterial", tipo: "texto", filas: 1, max: 10 },
      { clave: "peso", etiqueta: "Peso", tipo: "numero", min: 1, max: 300, paso: 0.1, unidad: "kg" },
      { clave: "temperatura", etiqueta: "Temperatura", tipo: "numero", min: 30, max: 45, paso: 0.1, unidad: "°C" },
      { clave: "saturacion", etiqueta: "Saturación", tipo: "numero", min: 50, max: 100, unidad: "%" },
    ],
    prestaciones: [
      { nombre: "Consulta de medicina general", duracion: 20 },
      { nombre: "Control de enfermedad crónica", duracion: 30 },
      { nombre: "Certificado médico", duracion: 15 },
    ],
    ejemplos: { titulo: "Médica cirujana, Universidad de Concepción", bio: "Medicina general, controles crónicos y salud preventiva.", motivo: "Por ejemplo, control de presión" },
    resumen: (f, atenciones) => {
      const pa = str(ultimo(atenciones, "presion"));
      const elevada = presionElevada(pa);
      const i = imc(num(ultimo(atenciones, "peso")), num(f.talla));
      return [
        { titulo: "Presión arterial", valor: pa ?? "–", detalle: pa ? (elevada ? "Elevada, sobre 140/90" : "Última registrada") : "Sin registro", alerta: !!elevada },
        { titulo: "IMC", valor: i ? String(i.valor).replace(".", ",") : "–", detalle: i ? i.categoria : "Falta peso o talla", alerta: i?.alerta },
        { titulo: "Crónicas", valor: str(f.enfermedades_cronicas) ? "Sí" : "No registradas", detalle: str(f.enfermedades_cronicas) ?? undefined },
      ];
    },
  },

  psicologia: {
    slug: "psicologia",
    tituloFicha: "Proceso terapéutico",
    ficha: [
      { clave: "motivo_consulta", etiqueta: "Motivo de consulta inicial", tipo: "texto", filas: 2, max: 1000 },
      { clave: "enfoque", etiqueta: "Enfoque", tipo: "opcion", opciones: ["Cognitivo-conductual", "Sistémico", "Psicodinámico", "Humanista", "Integrativo", "Otro"] },
      { clave: "red_apoyo", etiqueta: "Red de apoyo", tipo: "texto", filas: 2, max: 500 },
      { clave: "inicio_proceso", etiqueta: "Inicio del proceso", tipo: "fecha" },
    ],
    atencion: [
      { clave: "animo", etiqueta: "Ánimo de la sesión (1 a 10)", tipo: "numero", min: 1, max: 10 },
      { clave: "riesgo", etiqueta: "Riesgo", tipo: "opcion", opciones: ["Sin riesgo", "Bajo", "Medio", "Alto"] },
    ],
    prestaciones: [
      { nombre: "Primera sesión", duracion: 60 },
      { nombre: "Sesión de psicoterapia", duracion: 50 },
      { nombre: "Terapia de pareja", duracion: 60 },
    ],
    ejemplos: { titulo: "Psicóloga clínica, PUC", bio: "Psicoterapia para adultos: ansiedad, duelo y estrés laboral.", motivo: "Por ejemplo, ansiedad en el trabajo" },
    resumen: (f, atenciones) => {
      const riesgo = str(ultimo(atenciones, "riesgo"));
      const animo = num(ultimo(atenciones, "animo"));
      return [
        { titulo: "Sesiones", valor: String(atenciones.length), detalle: str(f.enfoque) ?? "Enfoque sin indicar" },
        { titulo: "Ánimo", valor: animo != null ? `${animo}/10` : "–", detalle: animo != null ? "Última sesión" : "Sin registro" },
        { titulo: "Riesgo", valor: riesgo ?? "–", detalle: riesgo ? "Última sesión" : "Sin evaluar", alerta: riesgo === "Medio" || riesgo === "Alto" },
      ];
    },
  },

  nutricion: {
    slug: "nutricion",
    tituloFicha: "Evaluación nutricional",
    ficha: [
      { clave: "talla", etiqueta: "Talla", tipo: "numero", min: 40, max: 230, unidad: "cm" },
      { clave: "peso_meta", etiqueta: "Peso meta", tipo: "numero", min: 2, max: 300, paso: 0.1, unidad: "kg" },
      { clave: "objetivo", etiqueta: "Objetivo", tipo: "opcion", opciones: ["Bajar de peso", "Subir de peso", "Mantener", "Deportivo", "Patología"] },
      { clave: "restricciones", etiqueta: "Restricciones alimentarias", tipo: "texto", filas: 2, max: 500 },
    ],
    atencion: [
      { clave: "peso", etiqueta: "Peso", tipo: "numero", min: 2, max: 300, paso: 0.1, unidad: "kg" },
      { clave: "cintura", etiqueta: "Cintura", tipo: "numero", min: 30, max: 200, unidad: "cm" },
      { clave: "grasa", etiqueta: "Grasa corporal", tipo: "numero", min: 2, max: 70, paso: 0.1, unidad: "%" },
    ],
    prestaciones: [
      { nombre: "Evaluación nutricional", duracion: 60 },
      { nombre: "Control nutricional", duracion: 30 },
      { nombre: "Plan de alimentación", duracion: 45 },
    ],
    ejemplos: { titulo: "Nutricionista, Universidad de Chile", bio: "Nutrición clínica y deportiva, sin dietas extremas.", motivo: "Por ejemplo, quiero bajar de peso" },
    resumen: (f, atenciones) => {
      const peso = num(ultimo(atenciones, "peso"));
      const primero = num([...atenciones].reverse().find((a) => typeof a.peso === "number")?.peso);
      const i = imc(peso, num(f.talla));
      const cambio = peso != null && primero != null && atenciones.length > 1 ? Math.round((peso - primero) * 10) / 10 : null;
      return [
        { titulo: "Peso", valor: peso != null ? `${String(peso).replace(".", ",")} kg` : "–", detalle: cambio != null ? `${cambio > 0 ? "+" : ""}${String(cambio).replace(".", ",")} kg desde el inicio` : "Último control" },
        { titulo: "IMC", valor: i ? String(i.valor).replace(".", ",") : "–", detalle: i ? i.categoria : "Falta peso o talla", alerta: i?.alerta },
        { titulo: "Objetivo", valor: str(f.objetivo) ?? "–", detalle: num(f.peso_meta) != null ? `Meta ${String(f.peso_meta).replace(".", ",")} kg` : undefined },
      ];
    },
  },

  kinesiologia: {
    slug: "kinesiologia",
    tituloFicha: "Evaluación kinésica",
    ficha: [
      { clave: "zona", etiqueta: "Zona tratada", tipo: "texto", filas: 1, max: 200 },
      { clave: "diagnostico_medico", etiqueta: "Diagnóstico médico de derivación", tipo: "texto", filas: 2, max: 500 },
      { clave: "sesiones_indicadas", etiqueta: "Sesiones indicadas", tipo: "numero", min: 1, max: 100 },
    ],
    atencion: [
      { clave: "eva", etiqueta: "Dolor EVA (0 a 10)", tipo: "numero", min: 0, max: 10 },
      { clave: "rango", etiqueta: "Rango articular", tipo: "texto", filas: 1, max: 100 },
    ],
    prestaciones: [
      { nombre: "Evaluación kinésica", duracion: 45 },
      { nombre: "Sesión de kinesiología", duracion: 40 },
      { nombre: "Kinesiología respiratoria", duracion: 30 },
    ],
    ejemplos: { titulo: "Kinesiólogo, Universidad de Valparaíso", bio: "Rehabilitación de lesiones deportivas y dolor lumbar.", motivo: "Por ejemplo, dolor de rodilla al correr" },
    resumen: (f, atenciones) => {
      const eva = num(ultimo(atenciones, "eva"));
      const indicadas = num(f.sesiones_indicadas);
      return [
        { titulo: "Sesiones", valor: indicadas ? `${atenciones.length} de ${indicadas}` : String(atenciones.length), detalle: str(f.zona) ?? "Zona sin indicar" },
        { titulo: "Dolor EVA", valor: eva != null ? `${eva}/10` : "–", detalle: eva != null ? "Última sesión" : "Sin registro", alerta: eva != null && eva >= 7 },
      ];
    },
  },

  odontologia: {
    slug: "odontologia",
    tituloFicha: "Antecedentes dentales",
    ficha: [
      { clave: "ultimo_control", etiqueta: "Último control dental", tipo: "fecha" },
      { clave: "riesgo_caries", etiqueta: "Riesgo de caries", tipo: "opcion", opciones: ["Bajo", "Medio", "Alto"] },
      { clave: "piezas_tratadas", etiqueta: "Piezas tratadas", tipo: "texto", filas: 2, max: 500 },
      { clave: "anestesia", etiqueta: "Reacciones a anestesia", tipo: "texto", filas: 1, max: 200 },
    ],
    atencion: [{ clave: "piezas", etiqueta: "Piezas atendidas", tipo: "texto", filas: 1, max: 200 }],
    prestaciones: [
      { nombre: "Control y diagnóstico", duracion: 30 },
      { nombre: "Limpieza dental", duracion: 45 },
      { nombre: "Tapadura", duracion: 60 },
      { nombre: "Urgencia dental", duracion: 30 },
    ],
    ejemplos: { titulo: "Cirujano dentista, Universidad de los Andes", bio: "Odontología general y preventiva para toda la familia.", motivo: "Por ejemplo, me duele una muela" },
    resumen: (f, _a, hoy) => {
      const u = str(f.ultimo_control);
      const meses = mesesDesde(u, hoy);
      return [
        { titulo: "Último control", valor: u ? fechaCorta(u) : "–", detalle: meses != null && meses >= 12 ? "Hace más de un año" : u ? "Al día" : "Sin registro", alerta: meses != null && meses >= 12 },
        { titulo: "Riesgo de caries", valor: str(f.riesgo_caries) ?? "–", alerta: f.riesgo_caries === "Alto" },
      ];
    },
  },

  fonoaudiologia: {
    slug: "fonoaudiologia",
    tituloFicha: "Evaluación fonoaudiológica",
    ficha: [
      { clave: "area", etiqueta: "Área", tipo: "opcion", opciones: ["Lenguaje", "Habla", "Voz", "Deglución", "Audición"] },
      { clave: "evaluacion", etiqueta: "Resultados de evaluación", tipo: "texto", filas: 3, max: 1000 },
    ],
    atencion: [],
    prestaciones: [
      { nombre: "Evaluación fonoaudiológica", duracion: 60 },
      { nombre: "Sesión de terapia", duracion: 45 },
    ],
    ejemplos: { titulo: "Fonoaudióloga, Universidad de Talca", bio: "Terapia de lenguaje infantil y voz profesional.", motivo: "Por ejemplo, mi hijo no pronuncia la r" },
    resumen: (f, atenciones) => [
      { titulo: "Área", valor: str(f.area) ?? "–" },
      { titulo: "Sesiones", valor: String(atenciones.length) },
    ],
  },

  enfermeria: {
    slug: "enfermeria",
    tituloFicha: "Cuidados de enfermería",
    ficha: [
      { clave: "dependencia", etiqueta: "Dependencia", tipo: "opcion", opciones: ["Autovalente", "Leve", "Moderada", "Severa"] },
      { clave: "heridas", etiqueta: "Heridas o dispositivos", tipo: "texto", filas: 2, max: 500 },
      { clave: "vacunas", etiqueta: "Vacunas al día", tipo: "opcion", opciones: ["Sí", "No", "No sabe"] },
    ],
    atencion: [
      { clave: "presion", etiqueta: "Presión arterial", tipo: "texto", filas: 1, max: 10 },
      { clave: "glicemia", etiqueta: "Glicemia", tipo: "numero", min: 20, max: 600, unidad: "mg/dl" },
    ],
    prestaciones: [
      { nombre: "Curación simple", duracion: 30 },
      { nombre: "Curación avanzada", duracion: 45 },
      { nombre: "Administración de inyectable", duracion: 15 },
    ],
    ejemplos: { titulo: "Enfermera, Universidad Austral", bio: "Curaciones y cuidados en domicilio y consulta.", motivo: "Por ejemplo, curación de herida operatoria" },
    resumen: (f, atenciones) => {
      const g = num(ultimo(atenciones, "glicemia"));
      return [
        { titulo: "Dependencia", valor: str(f.dependencia) ?? "–" },
        { titulo: "Glicemia", valor: g != null ? `${g} mg/dl` : "–", detalle: g != null ? "Última registrada" : "Sin registro", alerta: g != null && (g < 70 || g > 180) },
      ];
    },
  },

  podologia: {
    slug: "podologia",
    tituloFicha: "Evaluación podológica",
    ficha: [
      { clave: "pie_diabetico", etiqueta: "Pie diabético", tipo: "opcion", opciones: ["No", "Sí, sin lesiones", "Sí, con lesiones"] },
      { clave: "hallazgos", etiqueta: "Hallazgos", tipo: "texto", filas: 2, max: 500 },
    ],
    atencion: [],
    prestaciones: [
      { nombre: "Atención podológica", duracion: 45 },
      { nombre: "Atención pie diabético", duracion: 60 },
    ],
    ejemplos: { titulo: "Podóloga clínica", bio: "Atención podológica y pie diabético.", motivo: "Por ejemplo, uña encarnada" },
    resumen: (f) => [{ titulo: "Pie diabético", valor: str(f.pie_diabetico) ?? "–", alerta: f.pie_diabetico === "Sí, con lesiones" }],
  },

  "terapia-ocupacional": {
    ...GENERAL,
    slug: "terapia-ocupacional",
    tituloFicha: "Desempeño ocupacional",
    ficha: [
      { clave: "objetivos", etiqueta: "Objetivos de intervención", tipo: "texto", filas: 3, max: 1000 },
      { clave: "ayudas_tecnicas", etiqueta: "Ayudas técnicas", tipo: "texto", filas: 1, max: 200 },
    ],
    prestaciones: [
      { nombre: "Evaluación de terapia ocupacional", duracion: 60 },
      { nombre: "Sesión de terapia ocupacional", duracion: 45 },
    ],
    ejemplos: { titulo: "Terapeuta ocupacional, UNAB", bio: "Integración sensorial infantil y rehabilitación.", motivo: "Por ejemplo, evaluación de integración sensorial" },
  },
};

export function moduloDe(slug: string | null | undefined): Modulo {
  return (slug && MODULOS[slug]) || { ...GENERAL };
}

export const SLUGS_CON_MODULO = Object.keys(MODULOS);

/**
 * Lee y valida los campos de un módulo desde un formulario. Solo acepta las claves
 * definidas por el módulo; descarta vacíos. Devuelve un error legible si algo no calza.
 */
export function leerCampos(campos: Campo[], form: FormData, prefijo = ""): { datos: Datos } | { error: string } {
  const datos: Datos = {};
  for (const c of campos) {
    const crudo = String(form.get(prefijo + c.clave) ?? "").trim();
    if (crudo === "") continue;
    if (c.tipo === "numero") {
      const n = Number(crudo.replace(",", "."));
      if (!Number.isFinite(n) || n < c.min || n > c.max) return { error: `${c.etiqueta}: debe estar entre ${c.min} y ${c.max}.` };
      datos[c.clave] = Math.round(n * 10) / 10;
    } else if (c.tipo === "fecha") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(crudo) || Number.isNaN(Date.parse(crudo))) return { error: `${c.etiqueta}: fecha no válida.` };
      datos[c.clave] = crudo;
    } else if (c.tipo === "opcion") {
      if (!c.opciones.includes(crudo)) return { error: `${c.etiqueta}: opción no válida.` };
      datos[c.clave] = crudo;
    } else {
      datos[c.clave] = crudo.slice(0, c.max ?? 2000);
    }
  }
  return { datos };
}

/** Saca los datos del módulo de un objeto datos_especialidad guardado. */
export function datosDelModulo(guardado: unknown, slug: string): Datos {
  if (!guardado || typeof guardado !== "object" || Array.isArray(guardado)) return {};
  const d = (guardado as Record<string, unknown>)[slug];
  if (!d || typeof d !== "object" || Array.isArray(d)) return {};
  const limpio: Datos = {};
  for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
    if (typeof v === "string" || typeof v === "number") limpio[k] = v;
  }
  return limpio;
}
