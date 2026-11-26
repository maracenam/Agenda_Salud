/** Iniciales para la insignia de una profesional: "Camila Rojas" → "CR". */
export function iniciales(nombre?: string | null) {
  if (!nombre) return "·";
  const partes = nombre.trim().split(/\s+/);
  return ((partes[0]?.[0] ?? "") + (partes[1]?.[0] ?? "")).toUpperCase();
}
