/**
 * Identidad de Agenda Salud.
 * El símbolo es una hoja de agenda con una hora marcada: la esquina doblada
 * de la libreta y un punto salvia en el día de la cita.
 */

export function Simbolo({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#66305a" />
      <path d="M9 11.5A2.5 2.5 0 0 1 11.5 9h9A2.5 2.5 0 0 1 23 11.5V19l-4 4h-7.5A2.5 2.5 0 0 1 9 20.5Z" fill="#fff" />
      <path d="M19 23v-2.5a1.5 1.5 0 0 1 1.5-1.5H23" fill="none" stroke="#ecdae7" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 13.6h14" stroke="#66305a" strokeWidth="1.6" />
      <circle cx="16" cy="17.4" r="2.4" fill="#3f6b55" />
    </svg>
  );
}

export function Marca({ claro = false, className = "" }: { claro?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Simbolo className="size-8" />
      <span className={`font-titulo text-[19px] leading-none font-bold tracking-[-0.02em] ${claro ? "text-white" : "text-tinta"}`}>
        Agenda <span className={claro ? "text-marca-100" : "text-marca-700"}>Salud</span>
      </span>
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
