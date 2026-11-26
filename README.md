# Agenda Salud

Agenda online, ficha clínica y recordatorios para matronas independientes en Chile.

**Stack:** Next.js 16 (App Router, Server Actions) · Supabase (Auth + Postgres con RLS) · Vercel · Resend (emails).

## Qué incluye (MVP, RF-01 a RF-08 del Informe Diagnóstico)

| Req. | Funcionalidad | Dónde |
|---|---|---|
| RF-01 | Registro e ingreso con dos roles: paciente y profesional | `/registro`, `/ingresar` |
| RF-02 | Especialidades (Matronería activa) y perfil público de la profesional | `/profesionales`, `/panel/perfil` |
| RF-03 | Reserva online por prestación y bloque libre. **Sin dobles citas**: lo garantiza la base de datos (`exclude using gist`) | `/profesionales/[id]/reservar` |
| RF-04 | Cambiar hora y cancelar (paciente o profesional), con anticipación mínima configurable | `/mis-citas`, `/panel` |
| RF-05 | Agenda diaria y semanal de la profesional; marcar atendida / no asistió | `/panel` |
| RF-06 | Ficha clínica con datos gineco-obstétricos (GPAC, FUR con edad gestacional y FPP, PAP, anticoncepción) | `/panel/pacientes/[id]` |
| RF-07 | Historial cronológico de atenciones | `/panel/pacientes/[id]` |
| RF-08 | Emails de confirmación, cambio, cancelación y recordatorio el día anterior (Vercel Cron) | `src/lib/email.ts`, `/api/cron/recordatorios` |

Queda para después: RF-09 (panel de indicadores), red de derivación entre colegas, pacientes sin cuenta / importar desde Excel.

## Seguridad de los datos

- Toda tabla tiene RLS. Cada profesional ve solo sus fichas y atenciones; la paciente ve solo sus citas.
- Las citas no se escriben directo: pasan por funciones (`reservar_cita`, `cancelar_cita`, `reprogramar_cita`, `marcar_cita`) que validan horario, bloqueos y permisos.
- El rol de un usuario no se puede cambiar desde el navegador.

## Desarrollo local

```bash
cp .env.example .env.local   # completar las claves
npm install
npm run dev
```

## Base de datos

Proyecto Supabase `ntcrpowefqgcmrszwiwx` (São Paulo). Las migraciones están en `supabase/migrations/` y ya están aplicadas.

## Despliegue en Vercel

1. Importar el repositorio en Vercel.
2. Variables de entorno: ver `.env.example` (`SUPABASE_SECRET_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL`).
3. En Supabase > Authentication > URL Configuration: poner la URL de Vercel como *Site URL* y agregar `https://<tu-dominio>/auth/callback` a *Redirect URLs*.
4. El recordatorio corre todos los días a las 13:00 UTC (10:00 en Chile en verano) según `vercel.json`.
