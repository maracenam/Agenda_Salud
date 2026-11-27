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

THESIS: "Agenda abierta". La pantalla muestra el producto funcionando en vez de describirlo. Cada sección de la portada es una pieza real: reserva usable, grilla de tiempo del panel, calculadora de FUR y correo de recordatorio. Rechaza la landing SaaS de tarjetas, la señalética de transporte (ronda 1) y el serif sobre crema con filetes de periódico (ronda 2, "Consulta clara").

OWN-WORLD: ciruela noche #2B1027 para estructura (portada, barra lateral del panel, próxima hora), ciruela #6B2F5E para marca y acciones, salvia #2F6A52 para disponible y confirmado, alerta clínica #9A4A0B/#FDF1E3 para alergias y PAP vencido, niebla #F2F0F3 de fondo. Una sola familia, Schibsted Grotesk, con contraste de peso. Radios 6/8/12/20 según jerarquía.

STORY: la paciente prueba una reserva en la portada y busca por comuna; la matrona ve su día en la grilla y la ficha con resumen clínico.

FIRST VIEWPORT: fondo ciruela noche; izquierda, "Reserva tu hora con una matrona." con buscador por comuna; derecha, la tarjeta de reserva interactiva. Una línea de texto aclara que la matrona y las horas son de ejemplo.

FORM: movimiento firma, las horas se asientan al cambiar de día; nada más se anima solo. prefers-reduced-motion respetado.

FINISH: tipos y lint sin errores nuevos, detector de impeccable sin hallazgos (solo avisos de escala, ya documentada en DESIGN.md), copy-lint de Taste sin FAIL, capturas de las 16 pantallas a 1440 y 390.
