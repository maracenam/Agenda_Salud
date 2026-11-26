---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/panel/page.tsx","src/components/selector-bloques.tsx"]
---

# Agenda Salud: identidad y superficies principales

Scope: landing (Persuade), reserva y perfil público (Persuade/Operate), panel de la matrona (Operate). Una sola identidad para la vista de paciente y la vista profesional.

Audiencia: matronas independientes en Chile (vista profesional) y pacientes que reservan desde el celular (vista paciente). Acción principal de la landing: buscar matrona por comuna y ver horas; secundaria: crear agenda profesional.

Restricciones: sin testimonios, cifras de clientes ni precios inventados. Español de Chile.

## Direction contract

THESIS: Agenda Salud se lee primero como software de agenda de salud confiable ("Consulta clara"), no como anuncio. La reserva misma es la protagonista. Rechaza la landing SaaS genérica en teal y la estética de señalética de transporte (ronda 1, descartada por el usuario).

OWN-WORLD: ciruela #66305a (marca, acciones, día elegido) y salvia #3F6B55 (disponible, confirmar, siguiente) sobre blanco tibio #F6F5F3, tinta ciruela #261A23, neutros reteñidos a ciruela. Figtree 400-700, cifras tabulares. Esquinas 10/14px, bordes de 1px, sombras suaves.

STORY: la paciente ve una reserva real en la portada (profesional, días, horas libres, confirmación) y busca por comuna; la matrona ve su día ordenado en una banda ciruela y crea su agenda.

FIRST VIEWPORT: izquierda, titular "Tu hora con la matrona, sin llamadas." con buscador por comuna (botón salvia) y tres señales de confianza. Derecha, tarjeta de reserva rotulada "Ejemplo".

FORM: registro seguro, re-roll 1 sobre seed:4479ea3102dc9a4a. Movimiento firma: las horas se asientan (translateY 6px, 420ms, escalonado), sin movimiento con prefers-reduced-motion.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
