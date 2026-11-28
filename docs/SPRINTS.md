# Iteración multiespecialidad: un sprint por caso de uso

Objetivo: abrir Agenda Salud a todas las profesiones de la salud, no solo a matronas, sin perder lo que ya funcionaba para matronería. Cada sprint cerró con su integración verificada (pruebas automáticas que pasan contra Supabase local) antes de empezar el siguiente.

## Especialidades activas

Matronería, Medicina general, Psicología, Nutrición, Kinesiología, Odontología, Fonoaudiología, Terapia ocupacional, Enfermería y Podología. Cada una tiene un **módulo** en `src/lib/especialidades.ts` con:

- campos propios de la ficha clínica (por ejemplo FUR y fórmula obstétrica en matronería, peso y talla con IMC en nutrición, zona tratada y EVA en kinesiología, piezas tratadas y riesgo de caries en odontología);
- mediciones que se registran en cada atención;
- prestaciones sugeridas y ejemplos de motivo de consulta;
- tarjetas del resumen clínico (edad gestacional, IMC, sesiones realizadas, etc.).

Los datos propios se guardan en `datos_especialidad` (jsonb, un objeto por módulo). Si una profesional cambia de especialidad, lo anterior no se pierde. Los campos gineco-obstétricos existentes se migraron a `datos_especialidad.matroneria` sin pérdida.

Agregar una especialidad nueva = una fila en `especialidades` + un módulo en `especialidades.ts`. Sin un módulo, la especialidad usa la ficha general.

## Sprints

| Sprint | Caso de uso | RF | Qué cambió | Cómo se verificó la integración |
|---|---|---|---|---|
| 1 | CU-01 Registrarse como profesional de cualquier especialidad | RF-01 | Selector de especialidad en `/registro`, validado en servidor y en el trigger `crear_perfil` | pgTAP `rf01`, unitarias `rf01`, E2E alta de nutricionista y kinesiólogo |
| 2 | CU-02 Buscar profesional por especialidad y comuna | RF-02 | Directorio con chips por especialidad, búsqueda con comodines escapados | pgTAP `rf02`, unitarias `rf02`, pentest (comodines) |
| 3 | CU-03 Configurar perfil y especialidad | RF-02 | `/panel/perfil`: especialidad (solo activas), teléfono de consulta público separado del personal | pgTAP `rf02` (política con check) |
| 4 | CU-04 Definir prestaciones | RF-03 | Sugerencias de prestaciones según el módulo | E2E (prestación creada por cada profesional) |
| 5 | CU-05 Reservar hora | RF-03 | Textos generales; límite de 180 días y de reservas pendientes | pgTAP `rf03`, integrales, E2E reserva |
| 6 | CU-06 Cambiar o cancelar hora | RF-04 | Textos generales en reprogramar y cancelar | pgTAP `rf04`, E2E |
| 7 | CU-07 Ficha clínica por especialidad | RF-06 | Ficha dinámica según el módulo, validación por lista blanca | pgTAP `rf06`, unitarias `rf06`, E2E ficha con IMC |
| 8 | CU-08 Registrar atención e historial | RF-05, RF-07 | Mediciones por atención; la cita debe ser de la misma paciente y profesional | pgTAP `rf05`, `rf07`, unitarias `rf07` |
| 9 | CU-09 Avisos por correo | RF-08 | Correos con la especialidad; dueño de la cita verificado antes de leer con la clave de servidor | pgTAP `rf08`, unitarias `rf08` (escape de HTML y asunto) |
| 10 | CU-10 Indicadores de la profesional | RF-09 | `/panel/indicadores`: agendadas, realizadas, inasistencia, cancelaciones, fichas completas | pgTAP `rf09`, unitarias `rf09`, E2E |
| 11 | CU-11 Derivar a una colega | Red de derivación | Tabla `derivaciones`, funciones `derivar_paciente` y `responder_derivacion`, pantallas y correos | pgTAP `cu11`, integrales, E2E derivación |
| 12 | CU-12 Registrar el pago al atender | Cobros | Previsión de la paciente (al reservar o en su cuenta), bonos que recibe la profesional, tabla `pagos`, `registrar_pago` (atendida + cobro en un toque) y cierre del día | pgTAP `cu12`, unitarias `cu12`, integrales, pentest, E2E cobros |
| 13 | CU-13 Mis ingresos | Cobros | `/panel/ingresos`: cobrado del mes por medio, boletas pendientes con acceso al SII, retención estimada (Ley 21.133), exportar a Excel (CSV) | unitarias `cu12`, E2E cobros |

## Pruebas

| Nivel | Herramienta | Cantidad | Comando |
|---|---|---|---|
| Unitarias de base de datos, una por RF | pgTAP | 125 | `npm run test:db` |
| Unitarias de la aplicación, una por RF | Vitest | 99 | `npm test` |
| Integrales del sistema (Auth + API + funciones + RLS) | Vitest | 15 | `npm run test:integracion` |
| Pentest automatizado | Vitest contra la app y la API | 27 | `npm run test:seguridad` |
| E2E en navegador, escritorio y celular, con accesibilidad (axe, WCAG 2.1 AA) | Playwright | 27 | `npm run test:e2e` |

Todas necesitan Supabase local: `npx supabase start` y `npx supabase db reset`. La app se levanta sola en el puerto 3100 para E2E; el pentest necesita `npm run build && npx next start -p 3100`.

## Lo que queda fuera

- Medicina veterinaria: el modelo asume pacientes personas (RUT, edad).
- Anticipación del recordatorio configurable: el cron corre una vez al día.
- CAPTCHA en registro: necesita una cuenta externa (Turnstile o hCaptcha).
