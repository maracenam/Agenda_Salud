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

THESIS: Agenda Salud se lee como la señalética pública chilena (paneles de Metro y CESFAM): saber dónde ir y a qué hora, sin preguntar. Rechaza la landing SaaS de héroe centrado y grilla de tarjetas iguales en teal.

OWN-WORLD: paneles esmaltados blancos sobre suelo gris hormigón frío, banda de tinta azul noche (#0E1A2B) como cabecera de panel, dos colores de línea: burdeos para la vista paciente, cobalto para la vista profesional; amarillo señal (#F5B700) solo para "la próxima hora" y la acción principal. Barlow / Barlow Condensed, numerales tabulares grandes, insignias de línea circulares, flechas pictográficas SVG de trazo grueso. Esquinas de 6px, bordes de 2px.

STORY: la paciente entiende que reserva sola con una matrona real, ve horas y entra a reservar; la matrona entiende que su día queda ordenado y crea su agenda.

FIRST VIEWPORT: a la izquierda, gran panel burdeos con el titular en Barlow Condensed y el buscador por comuna (acción primaria amarilla). A la derecha, un tablero de "Próximas horas" en tinta: filas con hora en numerales grandes, prestación, matrona y comuna (datos de muestra rotulados). Debajo, franja de dos líneas: Paciente (burdeos) y Profesional (cobalto) con su ruta.

FORM: señalética de transporte y salud pública, candidato 4 de 7 de la lista propia; seed:4479ea3102dc9a4a. Movimiento firma: las horas como tablero de salidas, también en el selector de reserva y en la agenda del día.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
