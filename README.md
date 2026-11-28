# Agenda Salud

Agenda online, ficha clínica y recordatorios para profesionales de la salud independientes en Chile: matronas, médicos generales, psicólogas, nutricionistas, kinesiólogos, dentistas, fonoaudiólogas, terapeutas ocupacionales, enfermeras y podólogos.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Auth + Postgres con RLS) · Vercel · Resend (emails).

## Qué incluye (RF-01 a RF-09 del Informe Diagnóstico y red de derivación)

| Req. | Funcionalidad | Dónde |
|---|---|---|
| RF-01 | Registro e ingreso con dos roles: paciente y profesional | `/registro`, `/ingresar` |
| RF-02 | 10 especialidades activas, directorio por especialidad y comuna, perfil público | `/profesionales`, `/panel/perfil` |
| RF-03 | Reserva online por prestación y bloque libre. **Sin dobles citas**: lo garantiza la base de datos (`exclude using gist`) | `/profesionales/[id]/reservar` |
| RF-04 | Cambiar hora y cancelar (paciente o profesional), con anticipación mínima configurable | `/mis-citas`, `/panel` |
| RF-05 | Agenda diaria y semanal de la profesional; marcar atendida / no asistió | `/panel` |
| RF-06 | Ficha clínica común más un módulo por especialidad (FUR y FPP en matronería, IMC en nutrición, EVA en kinesiología, etc.) | `/panel/pacientes/[id]` |
| RF-07 | Historial cronológico de atenciones | `/panel/pacientes/[id]` |
| RF-08 | Emails de confirmación, cambio, cancelación y recordatorio el día anterior (Vercel Cron) | `src/lib/email.ts`, `/api/cron/recordatorios` |

| RF-09 | Indicadores: citas, realizadas, inasistencia, cancelaciones, fichas completas | `/panel/indicadores` |
| CU-11 | Derivar una paciente a una colega de otra especialidad | `/panel/derivaciones`, ficha |

Detalle por sprint en [`docs/SPRINTS.md`](docs/SPRINTS.md). Queda para después: pacientes sin cuenta / importar desde Excel.

## Seguridad de los datos

- Toda tabla tiene RLS. Cada profesional ve solo sus fichas y atenciones; la paciente ve solo sus citas.
- Las citas no se escriben directo: pasan por funciones (`reservar_cita`, `cancelar_cita`, `reprogramar_cita`, `marcar_cita`) que validan horario, bloqueos y permisos.
- El rol de un usuario no se puede cambiar desde el navegador.
- Las fichas y atenciones no se borran (retención de 15 años), cada cambio de ficha guarda su versión y hay una bitácora de auditoría.
- Pentest, ZAP y hallazgos corregidos: [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md).

## Pruebas

```bash
npx supabase start && npx supabase db reset   # base local, nunca la de producción
npm run test:db          # pgTAP, una por RF
npm test                 # unitarias (Vitest)
npm run test:integracion # integrales del sistema
npm run test:e2e         # navegador, escritorio y celular, con axe
npm run build && npx next start -p 3100 & npm run test:seguridad   # pentest
```

## Desarrollo local

```bash
cp .env.example .env.local   # completar las claves
npm install
npm run dev
```

## Base de datos

Proyecto Supabase `ntcrpowefqgcmrszwiwx` (São Paulo). Las migraciones están en `supabase/migrations/`. Las de multiespecialidad, indicadores/derivaciones y endurecimiento (`20261128*`) aún no se aplican en producción.

## Despliegue en Vercel

1. Importar el repositorio en Vercel.
2. Variables de entorno: ver `.env.example` (`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`).
3. En Supabase > Authentication > URL Configuration: poner la URL de Vercel como *Site URL* y agregar `https://<tu-dominio>/auth/callback` a *Redirect URLs*.
4. El recordatorio corre todos los días a las 13:00 UTC (10:00 en Chile en verano) según `vercel.json`.
