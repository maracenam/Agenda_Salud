# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Profesionales de la salud independientes en Chile** (desde 2026-11-28, por decisión de Matías): matronería, medicina general, psicología, nutrición, kinesiología, odontología, fonoaudiología, terapia ocupacional, enfermería y podología. Usuaria de referencia: Paula Verdugo, matrona independiente y cofundadora. Usan la vista profesional: agenda del día y de la semana, fichas clínicas, horarios y prestaciones. La revisan entre consultas, a menudo desde el celular o un computador de consulta.
- **Pacientes** de cualquier edad que buscan una profesional independiente (control de embarazo, psicoterapia, kinesiología, nutrición, etc.). Usan la vista de paciente: buscan profesional, reservan, reprograman o cancelan, casi siempre desde el celular.

Dos vistas confirmadas por Matías (2026-11-26): vista de paciente y vista de profesional de la salud.

## Product Purpose
Reemplazar la libreta, el Excel y el WhatsApp de ida y vuelta de una consulta independiente por una agenda online, ficha clínica digital y recordatorios automáticos. Éxito: la profesional deja de coordinar horas a mano, no tiene dobles citas y baja la inasistencia; la paciente reserva sola en minutos.

## Positioning
Propuesto por Claude y delegado por Matías (pendiente de validar): es la agenda para profesionales de la salud independientes en Chile donde cada ficha habla el idioma de su especialidad (FUR y PAP en matronería, IMC en nutrición, EVA en kinesiología) en vez de un formulario médico genérico, con una red de derivación entre colegas de distintas profesiones. La reserva es tan simple como pedir hora por mensaje.

## Operating Context
- Consulta independiente o centro pequeño (<10 profesionales), en Chile, horario de Chile (America/Santiago).
- RUT como identificador, Registro de la Superintendencia de Salud visible en el perfil público.
- Recordatorio por email el día antes de la cita.
- Datos clínicos protegidos conforme a la Ley 21.719.

## Capabilities and Constraints
- Construido: RF-01 a RF-09 (registro y roles, perfil público, horarios, prestaciones, reserva sin dobles citas, reprogramar y cancelar, ficha clínica con módulo por especialidad, recordatorios, indicadores) y red de derivación entre colegas.
- Pendiente: pacientes sin cuenta, migración desde Excel, 2FA, CAPTCHA.
- Stack existente: Next.js 16 + Supabase + Vercel, Tailwind 4.
- Idioma: español de Chile.

## Brand Commitments
Nombre: Agenda Salud. No hay logo, colores ni tono previos; Matías pidió crear la identidad corporativa desde cero, a la medida de la idea (2026-11-26).

## Evidence on Hand
- Informes y presentaciones del proyecto en /mnt/project-files (pitch v3 de septiembre 2026, Informe Diagnóstico con RF-01..RF-09).
- No hay testimonios, clientes, métricas ni fotos reales. No inventar cifras de clientes, resultados ni testimonios.
- Planes de precio aparecen en documentos de 2025 ($9.990 / $19.990 / $24.990 CLP) pero no están confirmados para la web.

## Product Principles
1. Hecha para cada especialidad: vocabulario y campos propios de cada profesión, no un formulario médico genérico.
2. La paciente reserva sola, desde el celular, sin crear fricción.
3. La profesional ve su día de un vistazo, entre una consulta y otra.
4. Confianza clínica: datos protegidos, información verificable de la profesional.
5. Calidez sin infantilizar: es salud de personas adultas, no una app de juguete.

## Accessibility & Inclusion
Uso frecuente en celular y por pacientes de todas las edades: contraste AA, objetivos táctiles amplios, lenguaje claro. Lenguaje inclusivo donde aplique ("matronas y matrones", "personas gestantes"). Textos neutros a la profesión fuera de cada módulo.
