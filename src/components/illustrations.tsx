/**
 * Original FridgeMatch illustrations, drawn as inline SVG in the warm
 * cream/brown palette of the UI draft. Decorative only (aria-hidden).
 */

const C = {
  sand: "#F1E6D8",
  sandDeep: "#E9DAC6",
  line: "#D7C2A8",
  accent: "#D9B38C",
  brown: "#8B6A4E",
  dark: "#5B3D28",
  paper: "#FFF8EC",
};

export function MotionDashes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" fill="none">
      <g stroke={C.brown} strokeWidth="3.5" strokeLinecap="round">
        <path d="M6 10 L20 4" />
        <path d="M6 20 L24 20" />
        <path d="M6 30 L20 36" />
      </g>
    </svg>
  );
}

/** Logo mark: three short "fresh" dashes next to the wordmark. */
export function LogoDashes({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <g stroke={C.accent} strokeWidth="3" strokeLinecap="round">
        <path d="M4 7 L18 3" />
        <path d="M4 12 L20 12" />
        <path d="M4 17 L18 21" />
      </g>
    </svg>
  );
}

export function FridgeIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 300" className={className} aria-hidden="true" fill="none">
      {/* floor shadow */}
      <ellipse cx="130" cy="288" rx="100" ry="8" fill={C.sandDeep} />
      {/* body */}
      <rect x="45" y="14" width="160" height="272" rx="26" fill={C.sandDeep} />
      <rect x="45" y="14" width="150" height="272" rx="26" fill="#EFE2D1" />
      <path d="M45 104 H195" stroke={C.line} strokeWidth="3" />
      {/* handles */}
      <rect x="62" y="44" width="9" height="40" rx="4.5" fill={C.brown} />
      <rect x="62" y="124" width="9" height="60" rx="4.5" fill={C.brown} />
      {/* sticky note */}
      <g transform="rotate(6 150 150)">
        <rect x="104" y="112" width="88" height="86" rx="4" fill={C.paper} stroke={C.line} strokeWidth="1.5" />
        <rect x="136" y="104" width="26" height="12" rx="2" fill={C.accent} opacity="0.8" />
        <text x="148" y="140" textAnchor="middle" fontFamily="Chewy, cursive" fontSize="13" fill={C.dark}>
          Less
        </text>
        <text x="148" y="156" textAnchor="middle" fontFamily="Chewy, cursive" fontSize="13" fill={C.dark}>
          food waste.
        </text>
        <text x="148" y="172" textAnchor="middle" fontFamily="Chewy, cursive" fontSize="13" fill={C.dark}>
          More good meals.
        </text>
        <path d="M143 181 c-4-5 3-9 5-4 c2-5 9-1 5 4 l-5 5 z" fill={C.brown} />
      </g>
      {/* plant */}
      <g transform="translate(206 208)">
        <path d="M10 76 C8 50 12 30 26 6" stroke={C.brown} strokeWidth="3" strokeLinecap="round" />
        <path d="M22 18 C36 10 44 14 44 14 C40 26 30 28 22 18 Z" fill={C.accent} />
        <path d="M16 34 C2 26 -6 30 -6 30 C-2 42 8 44 16 34 Z" fill={C.accent} />
        <path d="M13 52 C26 44 36 48 36 48 C32 60 20 62 13 52 Z" fill={C.brown} opacity="0.7" />
      </g>
    </svg>
  );
}

export function VeggiesIllustration({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 180 150" className={className} aria-hidden="true" fill="none">
      {/* carrot */}
      <g transform="rotate(-35 80 70)">
        <path d="M70 30 C86 30 92 40 90 52 L78 132 C76 138 72 138 71 132 L58 52 C56 40 60 30 70 30 Z" fill={C.accent} />
        <g stroke={C.brown} strokeWidth="2.5" strokeLinecap="round">
          <path d="M64 60 L72 60" />
          <path d="M70 80 L80 80" />
          <path d="M66 100 L74 100" />
        </g>
        <g stroke={C.brown} strokeWidth="4" strokeLinecap="round">
          <path d="M72 30 L66 8" />
          <path d="M74 30 L80 6" />
          <path d="M76 30 L90 12" />
        </g>
      </g>
      {/* tomato */}
      <circle cx="120" cy="102" r="30" fill={C.sandDeep} stroke={C.brown} strokeWidth="2.5" />
      <path d="M110 76 L120 82 L130 76 L124 86 L120 84 L116 86 Z" fill={C.brown} />
      <path d="M104 96 C106 90 110 88 114 88" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      {/* seeds / dots */}
      <circle cx="160" cy="136" r="4" fill={C.accent} />
      <circle cx="150" cy="60" r="3" fill={C.accent} />
      <g stroke={C.brown} strokeWidth="3" strokeLinecap="round">
        <path d="M20 40 L34 46" />
        <path d="M16 56 L32 58" />
        <path d="M22 72 L34 68" />
      </g>
    </svg>
  );
}

/** Placeholder picture for recipes without a photo. */
export function BowlArt({ className = "", seed = 0 }: { className?: string; seed?: number }) {
  const variant = seed % 3;
  return (
    <svg viewBox="0 0 120 90" className={className} aria-hidden="true" fill="none">
      {variant === 1 ? (
        // pan
        <g>
          <ellipse cx="54" cy="52" rx="34" ry="14" fill={C.brown} opacity="0.35" />
          <path d="M20 50 C20 66 88 66 88 50" fill={C.accent} />
          <ellipse cx="54" cy="50" rx="34" ry="11" fill={C.sandDeep} stroke={C.brown} strokeWidth="2" />
          <circle cx="44" cy="48" r="4" fill={C.accent} />
          <circle cx="58" cy="52" r="3.5" fill={C.brown} opacity="0.6" />
          <circle cx="64" cy="46" r="3" fill={C.accent} />
          <path d="M88 48 L112 38" stroke={C.brown} strokeWidth="6" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {variant === 2 && (
            <g stroke={C.brown} strokeWidth="2.5" strokeLinecap="round" opacity="0.7">
              <path d="M48 20 c-4 -6 4 -8 0 -14" />
              <path d="M60 20 c-4 -6 4 -8 0 -14" />
              <path d="M72 20 c-4 -6 4 -8 0 -14" />
            </g>
          )}
          <ellipse cx="60" cy="40" rx="40" ry="10" fill={C.sandDeep} stroke={C.brown} strokeWidth="2" />
          <circle cx="46" cy="38" r="6" fill={C.accent} />
          <circle cx="62" cy="36" r="5" fill={C.brown} opacity="0.55" />
          <circle cx="74" cy="40" r="5" fill={C.accent} />
          <circle cx="56" cy="42" r="4" fill={C.paper} />
          <path d="M20 40 C22 70 98 70 100 40 Z" fill={C.accent} />
          <path d="M44 72 H76" stroke={C.brown} strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

export function JarIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 56" className={className} aria-hidden="true" fill="none">
      <rect x="10" y="4" width="28" height="9" rx="3" fill={C.brown} />
      <path d="M8 18 C8 14 12 13 14 13 H34 C36 13 40 14 40 18 V48 C40 52 36 54 32 54 H16 C12 54 8 52 8 48 Z" fill={C.sandDeep} stroke={C.brown} strokeWidth="2.5" />
      <rect x="14" y="26" width="20" height="14" rx="2" fill={C.paper} stroke={C.line} />
    </svg>
  );
}
