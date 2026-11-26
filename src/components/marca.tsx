/**
 * Identidad de Agenda Salud.
 * El símbolo es una placa de señalética: un punto (dónde estás) y una flecha
 * (a tu hora). Se dibuja en SVG para que sea nítido en cualquier tamaño.
 */

export function Simbolo({ className = "size-8", color = "#8e1b3f" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" fill={color} />
      <circle cx="9" cy="16" r="3.4" fill="#fff" />
      <path d="M14 16h10.5M19.5 10.5 25 16l-5.5 5.5" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="6" y="25" width="20" height="2.4" rx="1.2" fill="#f5b700" />
    </svg>
  );
}

export function Marca({ claro = false, className = "" }: { claro?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Simbolo className="size-8" />
      <span className={`font-senal text-[22px] leading-none font-bold tracking-[-0.01em] ${claro ? "text-white" : "text-tinta"}`}>
        agenda<span className={claro ? "text-senal" : "text-marca-700"}>salud</span>
      </span>
    </span>
  );
}

type IconoProps = { className?: string };
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.25,
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
