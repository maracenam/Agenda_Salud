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
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.125rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  cifra:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontWeight: 600
    fontFeature: "tnum"
rounded:
  control: "10px"
  tarjeta: "14px"
  banda: "24px"
  pastilla: "9999px"
---

# Agenda Salud: Consulta clara

## Idea

Software de agenda de salud que se lee primero como herramienta clínica confiable y después como marca. Nada de anuncio: la portada muestra **la reserva misma** (profesional, día, horas libres, confirmación). La identidad sale de dos colores con oficio:

- **Ciruela** (`#66305a`): marca, navegación, acciones principales, día elegido. Cálida y propia, lejos del azul hospital genérico.
- **Salvia** (`#3f6b55`): todo lo que significa "disponible" o "listo": horas libres, hora elegida, confirmar, "Siguiente".
- **Tinta ciruela** (`#261a23`) sobre **blanco tibio** (`#f6f5f3`). Los neutros (slate de Tailwind) están reteñidos hacia la ciruela en `globals.css`.

## Logo

Cuadrado ciruela redondeado con una hoja de agenda blanca: esquina doblada de libreta, línea de encabezado y un punto salvia, la hora marcada. Vive en `src/components/marca.tsx` (`Simbolo`, `Marca`) y en `src/app/icon.svg`. Logotipo: "Agenda **Salud**" en Figtree bold, con "Salud" en ciruela.

## Tipografía

Una sola familia, **Figtree** (400 a 700). Cifras tabulares en todo el sitio (`.cifra`) para que las horas se alineen como en una agenda. Cuerpo mínimo de 16 px.

## Dos vistas, un sistema

- **Paciente**: cabecera blanca, búsqueda por comuna, tarjetas de profesional con iniciales, selector de día y hora en dos pasos numerados.
- **Profesional**: el mismo color; cambia la estructura. Barra lateral con íconos (horizontal y desplazable en móvil), agenda del día con horas grandes, vista semana con el día de hoy resaltado y ficha clínica con encabezado ciruela claro.

## Estados de cita

Pastillas redondeadas con punto: Confirmada (salvia), Atendida (ciruela), No asistió (ámbar), Cancelada (gris, hora tachada). "Siguiente" es una pastilla salvia sólida y la fila se tiñe de salvia claro.

## Componentes (`globals.css`)

`.btn` (ciruela), `.btn-acento` (salvia, para avanzar con una hora), `.btn-sec`, `.btn-peligro`, `.campo`, `.etiqueta`, `.tarjeta`, `.titulo`, `.enlace`, `.cifra`, `.insignia` (iniciales en círculo ciruela claro), `.mayus` (solo la primera letra en mayúscula).

## Reglas

- Táctiles de al menos 44 px; contraste AA como mínimo.
- Movimiento solo para asentar las horas (`.tablero-cifra`), desactivado con `prefers-reduced-motion`.
- Datos ilustrativos siempre rotulados "Ejemplo".
- Sin degradados, sin mayúsculas sostenidas, sin íconos decorativos que no digan nada.
