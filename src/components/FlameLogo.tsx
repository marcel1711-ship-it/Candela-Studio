interface FlameLogoProps {
  size?: number;
}

export function FlameLogo({ size = 40 }: FlameLogoProps) {
  const id = `fl_${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Large right flame — deep orange to amber */}
        <linearGradient id={`${id}_big`} x1="62" y1="108" x2="62" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#C62A00" />
          <stop offset="30%"  stopColor="#E8490F" />
          <stop offset="65%"  stopColor="#F97B16" />
          <stop offset="100%" stopColor="#FFC74A" />
        </linearGradient>

        {/* Small left flame — slightly cooler red-orange */}
        <linearGradient id={`${id}_small`} x1="32" y1="108" x2="32" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#B52200" />
          <stop offset="50%"  stopColor="#E04B0A" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>

        {/* 3D sheen on big flame */}
        <linearGradient id={`${id}_sheen`} x1="48" y1="20" x2="68" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="white" stopOpacity="0.38" />
          <stop offset="55%"  stopColor="white" stopOpacity="0.08" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* 3D sheen on small flame */}
        <linearGradient id={`${id}_sheen2`} x1="24" y1="48" x2="34" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="white" stopOpacity="0.3" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Radial glow at base */}
        <radialGradient id={`${id}_glow`} cx="55%" cy="100%" r="55%">
          <stop offset="0%"   stopColor="#FF5500" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
        </radialGradient>

        {/* Drop shadow / outer glow */}
        <filter id={`${id}_shadow`} x="-25%" y="-15%" width="150%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#FF4500" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Base glow */}
      <ellipse cx="54" cy="112" rx="36" ry="8" fill={`url(#${id}_glow)`} />

      {/* ── SMALL LEFT FLAME ──
          Firebase-style: starts low-left, curves up and leans right,
          tip points upper-right, base anchored bottom-center  */}
      <path
        d="
          M 38 108
          C 30 108, 18 96, 18 80
          C 18 66, 24 56, 30 50
          C 33 46, 36 44, 36 44
          C 34 54, 36 62, 40 68
          C 44 74, 46 82, 44 92
          C 42 99, 40 104, 38 108
          Z
        "
        fill={`url(#${id}_small)`}
        filter={`url(#${id}_shadow)`}
      />
      {/* Small flame 3D sheen */}
      <path
        d="
          M 30 60
          C 28 68, 28 78, 32 86
          C 34 78, 34 68, 30 60
          Z
        "
        fill={`url(#${id}_sheen2)`}
      />

      {/* ── BIG RIGHT FLAME ──
          Firebase-style: tall central flame, tip leans slightly right,
          right side curves outward, left side more vertical  */}
      <path
        d="
          M 54 108
          C 36 108, 26 94, 26 76
          C 26 60, 34 48, 42 38
          C 46 32, 50 22, 52 10
          C 58 24, 62 36, 62 48
          C 70 40, 74 28, 74 18
          C 82 32, 88 50, 88 68
          C 88 90, 74 108, 54 108
          Z
        "
        fill={`url(#${id}_big)`}
        filter={`url(#${id}_shadow)`}
      />

      {/* Big flame 3D sheen — left specular highlight */}
      <path
        d="
          M 42 42
          C 38 54, 36 66, 38 78
          C 40 86, 44 94, 48 102
          C 46 92, 44 82, 44 72
          C 44 60, 42 50, 42 42
          Z
        "
        fill={`url(#${id}_sheen)`}
      />

      {/* Bright inner core — the hottest part near base */}
      <path
        d="
          M 54 105
          C 44 105, 38 96, 38 84
          C 38 74, 44 66, 50 60
          C 52 72, 54 84, 58 92
          C 62 84, 64 74, 62 64
          C 68 72, 72 82, 72 92
          C 72 100, 64 105, 54 105
          Z
        "
        fill="#FFAA33"
        opacity="0.55"
      />

      {/* Tiny hot-white shimmer at upper tip of big flame */}
      <ellipse
        cx="54"
        cy="22"
        rx="3.5"
        ry="6"
        fill="white"
        opacity="0.22"
        transform="rotate(-5 54 22)"
      />
    </svg>
  );
}
