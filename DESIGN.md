---
name: Agenda Salud
description: Agenda, ficha clínica y recordatorios para matronas independientes. Identidad "Consulta clara": serena, legible y con la reserva como protagonista.
colors:
  ciruela-50: "#f7eff5"
  ciruela-100: "#ecdae7"
  ciruela-600: "#7b3a6c"
  ciruela-700: "#66305a"
  ciruela-800: "#4f2446"
  salvia: "#3f6b55"
  salvia-claro: "#e4efe8"
  salvia-suave: "#cfe2d6"
  tinta: "#261a23"
  tinta-suave: "#3a2b36"
  fondo: "#f6f5f3"
  panel: "#ffffff"
  texto-secundario: "#574d53"
  borde: "#e4dfe1"
typography:
  display:
    fontFamily: "Zilla Slab, ui-serif, Georgia, serif"
    fontSize: "5.25rem"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Zilla Slab, ui-serif, Georgia, serif"
    fontSize: "2.375rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Rethink Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  cifra:
    fontFamily: "Rethink Sans, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  control: "4px"
  tarjeta: "2px"
  hoja: "3px"
  etiqueta: "2px"
---

# Agenda Salud: Consulta clara

## Idea

Software de agenda de salud que se lee primero como herramienta clínica confiable y después como marca. Nada de anuncio: la portada muestra **la reserva misma** (profesional, día, horas libres, confirmación). La identidad sale de dos colores con oficio:

- **Ciruela** (`#66305a`): marca, navegación, acciones principales, día elegido. Cálida y propia, lejos del azul hospital genérico.
- **Salvia** (`#3f6b55`): todo lo que significa "disponible" o "listo": horas libres, hora elegida, confirmar, "Siguiente".
- **Tinta ciruela** (`#261a23`) sobre **blanco tibio** (`#f6f5f3`). Los neutros (slate de Tailwind) están reteñidos hacia la ciruela en `globals.css`.

## Logo

Cuadrado ciruela redondeado con una hoja de agenda blanca: esquina doblada de libreta, línea de encabezado y un punto salvia, la hora marcada. Vive en `src/components/marca.tsx` (`Simbolo`, `Marca`) y en `src/app/icon.svg`. Logotipo: "Agenda **Salud**" en Zilla Slab bold, con "Salud" en ciruela.

## Tipografía

Desde el 27-11-2026 (a pedido de Matías, Figtree no convencía): **Zilla Slab** (500 a 700) para titulares y el logotipo, la letra de una agenda impresa; **Rethink Sans** para texto, botones y cifras. Las horas usan cifras tabulares de Rethink Sans (`.cifra`); los titulares en Zilla fuerzan cifras alineadas (`lining-nums`). Cuerpo mínimo de 16 px.

## Forma

Esquinas de papel, casi rectas (2 a 6 px en toda la escala de Tailwind, redefinida en `globals.css`). Nada de tarjetas redondeadas con sombra: las superficies son hojas planas con borde fino y una línea superior de tinta (`.tarjeta`), o secciones separadas por reglas de 2 px. Las etiquetas de estado son rectángulos, no pastillas. Solo la hoja de agenda de la portada tiene sombra, porque es un papel. El logo también pasó a esquinas rectas.

## Dos vistas, un sistema

- **Paciente**: cabecera blanca, búsqueda por comuna, tarjetas de profesional con iniciales, selector de día y hora en dos pasos numerados.
- **Profesional**: el mismo color; cambia la estructura. Barra lateral con íconos (horizontal y desplazable en móvil), agenda del día con horas grandes, vista semana con el día de hoy resaltado y ficha clínica con encabezado ciruela claro.

## Estados de cita

Etiquetas rectangulares con punto: Confirmada (salvia), Atendida (ciruela), No asistió (ámbar), Cancelada (gris, hora tachada). "Siguiente" es una etiqueta salvia sólida y la fila se tiñe de salvia claro.

## Componentes (`globals.css`)

`.btn` (ciruela), `.btn-acento` (salvia, para avanzar con una hora), `.btn-sec`, `.btn-peligro`, `.campo`, `.etiqueta`, `.tarjeta`, `.titulo`, `.enlace`, `.cifra`, `.insignia` (iniciales en círculo ciruela claro), `.mayus` (solo la primera letra en mayúscula).

## Portada (segunda pasada, con Impeccable y Taste)

La portada dejó la plantilla "titular + tarjeta + lista de íconos" y ahora cuenta la agenda misma:

- **Hoja de agenda** (`.hoja`, `.hoja-sombra`, `.pliegue`): la tarjeta de reserva es el logo en grande. Hora en el margen, renglones punteados, bloques Reservada (gris), Libre (salvia claro) y Tu hora (salvia sólida), y la esquina doblada en ciruela claro abajo a la derecha. Radio 3px.
- **Frase que se escribe** (`.frase`): el único momento de la página. Las palabras pasan de gris a tinta con el scroll (CSS `animation-timeline: view()`); sin soporte o con movimiento reducido se ve entera en tinta.
- **Antes y ahora**: el WhatsApp de ida y vuelta (burbujas grises) frente a tres toques en Agenda Salud.
- **Banda ciruela única**: la vista profesional, con horas grandes en cifras tabulares y la fila "Siguiente" teñida de salvia.
- **Ficha en notación**: G2 P1 A0 C1, FUR, edad gestacional y PAP escritos en grande, en ciruela.
- **Cierre tipográfico**: "¿Necesitas hora?" en grande y el mismo buscador, sin caja.
- **Movimiento**: entrada única de la portada (`.entra`, parte visible y se asienta), botones que bajan 1px al presionar.

## Reglas

- Táctiles de al menos 44 px; contraste AA como mínimo.
- Movimiento solo para asentar las horas (`.tablero-cifra`), desactivado con `prefers-reduced-motion`.
- Datos ilustrativos siempre rotulados "Ejemplo".
- Sin degradados, sin mayúsculas sostenidas, sin íconos decorativos que no digan nada.
