/**
 * Identidad "Cinta lustre" de Agenda Salud.
 * El símbolo es una pulsera de papel lustre cerrada: un aro lila, una solapa
 * rosa pegada con un leve giro y el broche blanco que la convierte en pulsera.
 * En fondo oscuro el aro pasa a blanco y la solapa a amarillo.
 */

export function Simbolo({ className = "size-8", claro = false }: { className?: string; claro?: boolean }) {
  const aro = claro ? "#ffffff" : "#6a4ff0";
  const solapa = claro ? "#ffc629" : "#ec4a7c";
  const broche = claro ? "#26214a" : "#ffffff";
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="30" cy="31" r="19" fill="none" stroke={aro} strokeWidth="11" />
      <path d="M34 37 L59 33 L61 49 L36 53 Z" fill={solapa} />
      <circle cx="51" cy="43" r="5.2" fill={broche} stroke={aro} strokeWidth="2.4" />
    </svg>
  );
}

export function Marca({ claro = false, className = "" }: { claro?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Simbolo className="size-9" claro={claro} />
      <span className={`marca-texto text-[23px] leading-none ${claro ? "text-white" : "text-tinta"}`}>agenda salud</span>
    </span>
  );
}

type IconoProps = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function Flecha({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

export function FlechaAtras({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M20 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function Reloj({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function Lupa({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15 15 5 5" />
    </svg>
  );
}

export function Ubicacion({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </svg>
  );
}

export function Calendario({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function Campana({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15Z" />
      <path d="M10 20.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export function Ficha({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <rect x="5" y="3.5" width="14" height="17" rx="2.5" />
      <path d="M9 3.5V5h6V3.5M9 10h6M9 14h6M9 18h3" />
    </svg>
  );
}

export function Escudo({ className = "size-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...base}>
      <path d="M12 3.5 5 6v5.5c0 4.2 3 7.6 7 9 4-1.4 7-4.8 7-9V6Z" />
      <path d="m9 12 2 2 4-4.5" />
    </svg>
  );
}
