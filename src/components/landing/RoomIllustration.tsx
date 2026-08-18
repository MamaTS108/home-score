export function RoomIllustration({ variant = "after" }: { variant?: "before" | "after" }) {
  const isAfter = variant === "after";

  const wallTop = isAfter ? "#F1E9DA" : "#E2E0D9";
  const wallBottom = isAfter ? "#E7DCC6" : "#D6D4CC";
  const floor = isAfter ? "#B2895A" : "#C9C5BB";
  const floorShade = isAfter ? "#8F6C42" : "#B6B2A8";
  const sofa = isAfter ? "#1F4D3A" : "#ACA9A0";
  const sofaShade = isAfter ? "#16382A" : "#95928A";

  const gradId = `wall-${variant}`;
  const floorGradId = `floor-${variant}`;
  const lightId = `light-${variant}`;

  return (
    <svg viewBox="0 0 480 340" className="w-full h-full" role="img" aria-label={`Aperçu de pièce — ${variant}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallTop} />
          <stop offset="100%" stopColor={wallBottom} />
        </linearGradient>
        <linearGradient id={floorGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={floor} />
          <stop offset="100%" stopColor={floorShade} />
        </linearGradient>
        <radialGradient id={lightId} cx="72%" cy="10%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isAfter ? 0.35 : 0.12} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* wall */}
      <rect width="480" height="340" fill={`url(#${gradId})`} />
      {/* ambient light wash */}
      <rect width="480" height="340" fill={`url(#${lightId})`} />

      {/* floor */}
      <rect y="228" width="480" height="112" fill={`url(#${floorGradId})`} />
      {isAfter && (
        <g opacity="0.35" stroke="#5C4324" strokeWidth="1">
          <line x1="0" y1="255" x2="480" y2="255" />
          <line x1="0" y1="285" x2="480" y2="285" />
          <line x1="0" y1="313" x2="480" y2="313" />
        </g>
      )}

      {/* window */}
      <rect x="332" y="36" width="112" height="150" rx="4" fill="#FBFAF7" stroke="#171717" strokeOpacity="0.18" strokeWidth="2" />
      <rect x="332" y="36" width="112" height="150" rx="4" fill="#BFD9E8" opacity={isAfter ? 0.35 : 0.5} />
      <line x1="388" y1="36" x2="388" y2="186" stroke="#171717" strokeOpacity="0.18" strokeWidth="2" />
      <line x1="332" y1="111" x2="444" y2="111" stroke="#171717" strokeOpacity="0.18" strokeWidth="2" />

      {/* wall art (after only) */}
      {isAfter && (
        <rect x="252" y="52" width="46" height="60" rx="3" fill="#FBFAF7" stroke="#171717" strokeOpacity="0.12" strokeWidth="1.5" />
      )}

      {/* shelving unit (after only) */}
      {isAfter && (
        <g>
          <rect x="212" y="58" width="76" height="128" rx="4" fill="#FBFAF7" stroke="#171717" strokeOpacity="0.1" strokeWidth="1" />
          <line x1="212" y1="96" x2="288" y2="96" stroke={wallBottom} strokeWidth="4" />
          <line x1="212" y1="134" x2="288" y2="134" stroke={wallBottom} strokeWidth="4" />
          <rect x="222" y="66" width="18" height="24" rx="2" fill={sofa} opacity="0.6" />
          <rect x="248" y="104" width="26" height="24" rx="2" fill="#D9C7A3" />
        </g>
      )}

      {/* rug (after only) */}
      {isAfter && <rect x="118" y="248" width="232" height="76" rx="8" fill="#FBFAF7" opacity="0.45" />}

      {/* sofa shadow */}
      <ellipse cx="118" cy="246" rx="90" ry="10" fill="#000000" opacity={isAfter ? 0.12 : 0.08} />

      {/* sofa */}
      <rect x="34" y="182" width="168" height="62" rx="12" fill={sofaShade} />
      <rect x="34" y="164" width="168" height="34" rx="12" fill={sofa} />
      <rect x="40" y="196" width="34" height="30" rx="8" fill={sofaShade} opacity="0.6" />
      <rect x="128" y="196" width="34" height="30" rx="8" fill={sofaShade} opacity="0.6" />

      {/* cushions (after only) */}
      {isAfter && (
        <>
          <rect x="52" y="176" width="26" height="26" rx="5" fill="#D9C7A3" transform="rotate(-6 65 189)" />
          <rect x="86" y="178" width="24" height="24" rx="5" fill="#8C6A44" transform="rotate(4 98 190)" />
        </>
      )}
    </svg>
  );
}
