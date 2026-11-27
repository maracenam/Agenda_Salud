---
name: Agenda Salud
description: Agenda, ficha clínica y recordatorios para matronas independientes. Identidad "Cinta lustre": una pulsera hecha de papel lustre.
colors:
  lila: "#6a4ff0"
  lila-oscuro: "#4a33c9"
  lila-50: "#f3f0ff"
  tinta: "#26214a"
  menta: "#c9f0e0"
  rosa-papel: "#ffd6e3"
  rosa-lustre: "#ec4a7c"
  amarillo: "#ffc629"
  libre: "#17714f"
  alerta: "#9a4a0b"
  alerta-claro: "#fdf1e3"
  fondo: "#faf8ff"
  superficie: "#ffffff"
typography:
  titulos: "Young Serif (next/font), un solo peso 400; jerarquía por tamaño, nunca negrita sintética"
  texto: "Instrument Sans (next/font), 400 texto, 600 interfaz y cifras"
  cifras: "horas, fechas y números siempre en Instrument Sans (.cifra): Young Serif usa números antiguos"
rounded:
  control: "999px (botones y buscador en píldora)"
  bloque: "6px"
  tarjeta: "16px"
  destacado: "28px"
---

# Agenda Salud: Cinta lustre

## Idea

Una pulsera hecha de papel lustre. De la propuesta "Papel lustre" vienen las tiras de papel recortado y los colores planos; de "Pulsera" viene la cinta con broche que identifica a la mamá y a la guagua en la maternidad. Reservar es elegir una hora en una tira de papel, y la reserva queda impresa en una cinta rosa con broche lila.

Tableros de marca: `/mnt/project-files/marca/identidad-cinta-serif.html` (vigente) y `identidad-cinta-lustre.html` (misma marca con Funnel).

## Logo

Símbolo: aro lila (la pulsera), solapa rosa pegada con un leve giro y broche blanco. En fondo oscuro o lila: aro blanco, solapa amarilla, broche tinta. Nombre en minúscula, "agenda salud", en Young Serif. Componentes en `src/components/marca.tsx` (`Simbolo`, `Marca claro`); favicon en `src/app/icon.svg`.

## Color

- **Lila** (`#6a4ff0`): color dueño. Botones, pieza de reserva de la portada, la cita "Siguiente", superficies grandes. Blanco sobre lila cumple AA.
- **Tinta** (`#26214a`): texto, barra lateral del panel y pie de página.
- **Menta** (`#c9f0e0`) y **rosa papel** (`#ffd6e3`): los papeles. Menta para horas libres y citas confirmadas (texto verde `#17714f`); rosa para la cinta y los antecedentes.
- **Amarillo** (`#ffc629`): solo la hora que eligió la paciente y el foco del teclado.
- **Alerta clínica** (`#9a4a0b` sobre `#fdf1e3`): alergias, PAP vencido, "No asistió". Nunca decorativo.
- Citas atendidas en gris lila, para que el día pendiente destaque.

## Tipografía

Young Serif en h1, h2, `.titulo` y la marca: una serif blanda que da calidez sin verse infantil. Tiene un solo peso, así que `font-synthesis-weight: none` evita negritas falsas y la jerarquía sale del tamaño. Todo lo demás en Instrument Sans. Las horas y números van en `.cifra` (Instrument Sans) porque Young Serif dibuja el 1 como una i pequeña.

## Forma

Botones y buscador en píldora, tarjetas de 16 px, la pieza destacada de cada pantalla a 28 px. Las tiras de papel van con un giro de 1 a 2 grados; nada más se gira. La cinta (`.cinta` y `.cinta-broche` en `globals.css`) se cierra con una animación de 550 ms al elegir hora y respeta `prefers-reduced-motion`.

## Reglas

- Sin "→" en botones, sin cadenas "A · B · C", sin palabra destacada en titulares, sin pastillas "Ejemplo".
- Los datos de muestra se dicen en una línea de texto, no en etiquetas.
- Estados de cita: confirmada menta, siguiente lila sólido, atendida gris lila, no asistió alerta, cancelada gris tachada. Hora elegida en amarillo.
- Movimiento: la cinta que se cierra al elegir hora, el "asentar" de las horas al cambiar de día y el realce del bloque al pasar el mouse. Se respeta `prefers-reduced-motion`.

