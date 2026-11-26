---
name: Agenda Salud
description: Agenda, ficha clínica y recordatorios para matronas independientes, con la claridad de la señalética pública.
colors:
  burdeos: "#8e1b3f"
  burdeos-profundo: "#6f1431"
  burdeos-claro: "#f9eef1"
  cobalto: "#1f4fa3"
  cobalto-profundo: "#173c7d"
  cobalto-claro: "#edf2fb"
  amarillo-senal: "#f5b700"
  amarillo-senal-claro: "#fff1c2"
  tinta: "#0e1a2b"
  tinta-suave: "#1b2a40"
  hormigon: "#e9ecf0"
  panel: "#ffffff"
  texto-secundario: "#475263"
  borde: "#d6dce3"
typography:
  display:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "5.75rem"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  cifra:
    fontFamily: "Barlow Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\" 1, \"lnum\" 1"
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  control:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.2
  label:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  insignia: "4px"
  sm: "6px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.burdeos}"
    textColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.burdeos-profundo}"
  button-senal:
    backgroundColor: "{colors.amarillo-senal}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "6px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sm}"
    padding: "20px"
  board:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.panel}"
    rounded: "{rounded.md}"
  line-badge:
    backgroundColor: "{colors.burdeos}"
    textColor: "{colors.panel}"
    rounded: "{rounded.full}"
    size: "28px"
---

# Design System: Agenda Salud

## Overview

**Creative North Star: "La Señal Clara"**

Agenda Salud se lee como la señalética pública chilena: los paneles del Metro y del CESFAM, que dicen dónde ir y a qué hora sin que nadie tenga que preguntar. Paneles blancos esmaltados sobre un suelo de hormigón frío, cabeceras en tinta azul noche, números grandes y tabulares, y un color por "línea": burdeos para la vista de pacientes, cobalto para la vista de matronas y matrones.

La densidad es de información pública: poca decoración, jerarquía evidente, contraste alto. La calidez viene del burdeos y del lenguaje, nunca del rosado maternal ni del teal de clínica, que son los dos clichés que este sistema rechaza.

**Key Characteristics:**
- Un color de línea por vista, aplicado con la variable `--linea`.
- Las horas siempre en numerales grandes y tabulares (Barlow Condensed), como un tablero de salidas.
- El amarillo señal marca solo "lo siguiente": la próxima hora y la acción principal.
- Cabeceras en banda de tinta con texto condensado en mayúsculas, como placas de señalización.
- Recorridos dibujados como líneas de Metro con estaciones.

## Colors

Tinta, dos colores de línea y un amarillo de advertencia, sobre hormigón frío.

### Primary
- **Burdeos de línea paciente** (#8e1b3f): color de la vista de pacientes; panel principal de la landing, botones primarios, insignias y enlaces. Variante profunda #6f1431 para hover y claro #f9eef1 para fondos seleccionados.

### Secondary
- **Cobalto de línea profesional** (#1f4fa3): color de la vista de matronas. Dentro de `.linea-pro` reemplaza al burdeos en todos los componentes. Profundo #173c7d, claro #edf2fb.

### Tertiary
- **Amarillo señal** (#f5b700): solo la próxima hora, la acción principal de una pantalla, la selección de texto y el anillo de foco. Claro #fff1c2 para la fila de la cita siguiente y avisos de éxito.

### Neutral
- **Tinta azul noche** (#0e1a2b): texto principal, encabezado y pie, tableros de horas, cabeceras de panel.
- **Tinta suave** (#1b2a40): celdas dentro de un tablero de tinta.
- **Hormigón frío** (#e9ecf0): fondo de página.
- **Panel esmaltado** (#ffffff): superficies de trabajo.
- **Texto secundario** (#475263) y **borde** (#d6dce3): neutros teñidos hacia la tinta; reemplazan el slate de Tailwind.

### Named Rules
**La Regla de la Línea.** Cada vista tiene un solo color de línea. Pacientes en burdeos, profesionales en cobalto; nunca se mezclan en un mismo componente.

**La Regla de lo Siguiente.** El amarillo señal aparece una vez por zona: la próxima hora o la acción principal. Si hay dos cosas amarillas compitiendo, una sobra.

## Typography

**Display Font:** Barlow Condensed (con Barlow, sans-serif)
**Body Font:** Barlow (con ui-sans-serif, system-ui)

**Character:** Barlow nace de la señalización vial; la versión condensada da titulares y numerales de cartel, y la normal mantiene la lectura cómoda en formularios y fichas.

### Hierarchy
- **Display** (700, 44px móvil a 5.75rem escritorio, 0.92): titular de la landing.
- **Headline** (700, 2.25rem, 1): título de cada pantalla (clase `.titulo`).
- **Title** (700, 1.5rem, 1.2): títulos de sección y nombres de profesional.
- **Cifra** (600, 1.5 a 2.25rem, tabular): horas, fechas y códigos en tableros (clase `.cifra`).
- **Body** (400, 1rem a 17px, 1.5): texto corrido, máximo unos 65ch.
- **Control** (600, 15px): texto de botones, navegación y campos.
- **Label** (600, 0.875rem): etiquetas de formulario. Las cabeceras de panel usan Barlow Condensed 700 en mayúsculas con tracking leve.

### Named Rules
**La Regla del Tablero.** Toda hora visible se escribe con `.cifra`: numerales tabulares, condensados, grandes. Nunca una hora en texto corrido pequeño cuando es el dato principal.

## Layout

Contenedor de 72rem (max-w-6xl) con márgenes de 16px. Ritmo vertical: 64 a 80px entre secciones de la landing, 20 a 24px entre bloques de una pantalla de trabajo. Las pantallas de trabajo usan listas en un solo panel con divisores en vez de tarjetas separadas. En móvil, las filas del tablero apilan hora arriba o a la izquierda y los detalles debajo; las líneas de recorrido pasan de horizontales a verticales.

## Elevation & Depth

Sistema casi plano: los paneles se separan del hormigón con un borde de 2px de tinta al 10% y una sombra corta y suave. El panel principal de la landing tiene una sombra más profunda porque es el cartel de la página.

### Shadow Vocabulary
- **Panel** (`box-shadow: 0 1px 2px rgb(14 26 43 / 0.06), 0 4px 12px -6px rgb(14 26 43 / 0.12)`): toda superficie `.tarjeta`.
- **Cartel** (`box-shadow: 0 2px 4px rgb(14 26 43 / 0.1), 0 20px 40px -20px rgb(14 26 43 / 0.45)`): solo el panel principal de la landing.

## Shapes

Esquinas de placa: 6px en controles y paneles, 8px solo en las columnas de la vista semanal, 4px en insignias de estado rectangulares. Las insignias de línea son círculos. Bordes de 2px en controles y botones secundarios, como el filete de un cartel esmaltado. Las líneas de recorrido son trazos de 6px con estaciones circulares de borde grueso.

## Components

### Buttons
- **Shape:** 6px, altura mínima 40px (44px para la acción señal).
- **Primary (`.btn`):** fondo del color de línea, texto blanco 600. Hover al tono profundo.
- **Señal (`.btn-senal`):** amarillo con tinta, 700. Solo una por pantalla o zona.
- **Secondary (`.btn-sec`):** blanco con borde de tinta al 15%, hover a 40%.
- **Peligro (`.btn-peligro`):** blanco con borde rojo claro y texto rojo.
- **Focus:** anillo amarillo señal de 3px con 2px de separación.

### Chips (estado de cita)
- **Style:** rectángulo de 4px con borde, Barlow Condensed 600 en mayúsculas. Confirmada en color de línea, Atendida en tinta sólida, No asistió en ámbar, Cancelada tachada en gris.

### Cards / Containers
- **Corner Style:** 6px. **Background:** blanco. **Border:** 2px tinta al 10%. **Padding:** 20px. Las cabeceras de panel son una banda de tinta con título condensado en mayúsculas.

### Inputs / Fields
- **Style:** blanco, borde de 2px tinta al 15%, 6px, 40px de alto. **Focus:** el borde toma el color de línea. Cursor de texto en color de línea.

### Navigation
- **Encabezado global:** banda de tinta con la marca, enlaces blancos al 80% y "Crear cuenta" como botón blanco; debajo, la franja de líneas burdeos, cobalto y amarillo.
- **Panel profesional:** barra cobalto con insignia "M"; la sección activa es una píldora blanca con texto cobalto.

### Tablero de horas (componente firma)
Panel de tinta con filas o celdas de horas en `.cifra` blanca; la próxima hora o la seleccionada pasa a amarillo señal con texto de tinta. Se usa en la landing (horas de ejemplo), en el selector de reserva y, en versión clara, en la agenda del día.

### Movimiento del tablero
Única animación de autor (`.tablero-cifra`): al cargar, las horas de un tablero suben desde 45% y se enfocan desde un desenfoque de 3px, 700ms con `cubic-bezier(0.16, 1, 0.3, 1)` y 70ms de desfase entre filas. El texto es visible desde el primer cuadro y la animación se apaga con `prefers-reduced-motion`.

### Línea de recorrido
Trazo del color de línea con estaciones circulares blancas y la última en amarillo. Explica secuencias (pasos de la paciente, pasos de la matrona, historial de atenciones).

### Marca
Placa burdeos de esquinas de 6px con un punto y una flecha blancos (de dónde estás a tu hora) y una barra amarilla. Logotipo "agendasalud" en Barlow Condensed 700, "salud" en burdeos o amarillo sobre tinta.

## Do's and Don'ts

### Do:
- **Do** usar `.linea-pro` en todo contenedor de la vista profesional para que los componentes pasen a cobalto.
- **Do** escribir horas, fechas y códigos clínicos (FUR, PAP) con `.cifra`.
- **Do** dibujar íconos en SVG de trazo 2.25 y puntas redondeadas, como los de `src/components/marca.tsx`.
- **Do** rotular como ejemplo cualquier dato de muestra.

### Don't:
- **Don't** usar rosado pastel ni teal de clínica: son los clichés que este sistema reemplazó.
- **Don't** usar el amarillo señal como decoración o en más de un elemento compitiendo por zona.
- **Don't** usar glifos de texto (←, ×) como íconos.
- **Don't** armar páginas con grillas de tarjetas iguales de ícono, título y texto.
