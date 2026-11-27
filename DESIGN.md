---
name: Agenda Salud
description: Agenda, ficha clínica y recordatorios para matronas independientes. Identidad "Agenda abierta": la pantalla muestra el producto funcionando, no lo describe.
colors:
  noche: "#2b1027"
  ciruela-50: "#f6eef4"
  ciruela-100: "#ead9e5"
  ciruela-200: "#d7b9cf"
  ciruela-600: "#7d3a6e"
  ciruela-700: "#6b2f5e"
  ciruela-800: "#4f2246"
  salvia: "#2f6a52"
  salvia-claro: "#e2efe7"
  alerta: "#9a4a0b"
  alerta-claro: "#fdf1e3"
  tinta: "#1e1520"
  niebla: "#f2f0f3"
  superficie: "#ffffff"
typography:
  familia: "Schibsted Grotesk (next/font), una sola familia"
  pesos: "800 marca, 700 titulares, 600 interfaz y cifras, 400 texto"
  escala: "13, 14, 15, 16, 17, 18, 20, 24, 28, 32, 40, 44, 56, 64 px"
  cifras: "proporcionales. Sin tnum: en Schibsted ensancha los dos puntos y las comas"
  features: "font-feature-settings 'kern' 1 explícito en html; con 'normal' la fuente servida por next/font espacia mal la puntuación"
rounded:
  control: "8px"
  bloque: "6px"
  tarjeta: "12px"
  destacado: "20px"
  insignia: "999px"
---

# Agenda Salud: Agenda abierta

## Por qué cambió

La versión "Consulta clara" (Zilla Slab, crema, esquinas rectas) caía en dos patrones típicos de páginas generadas: serif sobre crema y layout de periódico con filetes. Además coloreaba una palabra del titular, unía datos con puntos medios y ponía flechas en los botones. Esta versión se hizo con las skills `frontend-design`, `impeccable` y `design-taste-frontend`, y parte de una idea concreta: **cada sección es una pieza real del producto**.

## Idea

- La portada muestra una reserva que se puede usar, la grilla de tiempo del panel, la calculadora de FUR y el correo de recordatorio. No hay tarjetas de "beneficios", ni cifras inventadas, ni testimonios.
- El panel de la matrona es una herramienta de trabajo: grilla de tiempo, barra lateral ciruela noche, detalle de la cita a la derecha.
- La ficha abre con el resumen clínico que la matrona mira antes de saludar: fórmula obstétrica, edad gestacional y FPP, último PAP y alergias en color de alerta.

## Color

- **Ciruela noche** (`#2b1027`): estructura. Barra lateral del panel, portada, tarjeta de la próxima hora.
- **Ciruela** (`#6b2f5e`): marca, acciones principales, día elegido, enlaces.
- **Salvia** (`#2f6a52`): todo lo que significa "libre" o "confirmado": horas disponibles, confirmar reserva, la cita "Siguiente".
- **Alerta clínica** (`#9a4a0b` sobre `#fdf1e3`): alergias, PAP vencido, "No asistió", página sin publicar. Nunca decorativo.
- **Niebla** (`#f2f0f3`) de fondo y superficies blancas. Los neutros slate están reteñidos hacia la ciruela en `globals.css`.

## Tipografía

Una sola familia, Schibsted Grotesk, con contraste por peso y tamaño. Titulares 700 con tracking negativo; números importantes (horas, fechas, edad gestacional) en 600 con la clase `.cifra`. Sin mayúsculas sostenidas, sin "eyebrows" sobre los títulos.

## Forma

Jerarquía de radios: 6 px bloques de la grilla, 8 px controles, 12 px paneles, 20 px solo para la pieza destacada de una pantalla. Sin sombras salvo en la tarjeta de reserva de la portada. Bordes de 1 px `slate-200` para separar; listas como filas divididas, no como tarjetas sueltas.

## Reglas

- Sin "→" en botones, sin cadenas "A · B · C", sin palabra destacada en titulares, sin pastillas "Ejemplo".
- Los datos de muestra se dicen en una línea de texto, no en etiquetas.
- Estados de cita: confirmada salvia claro, siguiente salvia sólido, atendida ciruela claro, no asistió alerta, cancelada gris tachada.
- Movimiento: solo el "asentar" de las horas al cambiar de día y el realce del bloque al pasar el mouse. Se respeta `prefers-reduced-motion`.

## Logo

Cuadrado ciruela de 8 px de radio con una hoja de agenda blanca, esquina doblada `#d7b9cf` y un punto salvia. Logotipo "Agenda Salud" en 800, de un solo color (`Marca claro` sobre fondo oscuro). Vive en `src/components/marca.tsx` y `src/app/icon.svg`.
