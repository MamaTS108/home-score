/**
 * Kitchen "before/after" illustration.
 *
 * IMPORTANT: every structural element (wall, window position and size,
 * cabinet layout, countertop line) uses the EXACT SAME coordinates in both
 * variants. Only colors/materials change — this mirrors the real product's
 * rule (spec section 5): a renovation render must keep the same
 * architecture, window position and proportions, and change only the
 * finishes. Used as a fallback until real photos are added in
 * /public/images (see public/images/README.md and GENERATE_PROMPTS.md).
 */
export function RoomIllustration({ variant = "after" }: { variant?: "before" | "after" }) {
  const isAfter = variant === "after";

  const wallTop = isAfter ? "#F3ECDD" : "#E8E4D8";
  const wallBottom = isAfter ? "#EAE1CB" : "#DAD5C5";
  const cabinetUpper = isAfter ? "#FBFAF7" : "#C9BFA0";
  const cabinetLower = isAfter ? "#2C4A3D" : "#B8AD8C";
  const countertop = isAfter ? "#E4D9C4" : "#C7BCA3";
  const backsplashBase = isAfter ? "#FBFAF7" : "#D8CFB8";
  const floor = isAfter ? "#B2895A" : "#B7ADA0";

  const gradId = `kitchen-wall-${variant}`;
  const lightId = `kitchen-light-${variant}`;

  return (
    <svg viewBox="0 0 480 340" className="w-full h-full" role="img" aria-label={`Cuisine — ${variant}`}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={wallTop} />
          <stop offset="100%" stopColor={wallBottom} />
        </linearGradient>
        <radialGradient id={lightId} cx="30%" cy="8%" r="65%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isAfter ? 0.4 : 0.15} />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* wall — identical bounds in both variants */}
      <rect width="480" height="340" fill={`url(#${gradId})`} />
      <rect width="480" height="340" fill={`url(#${lightId})`} />

      {/* floor — identical bounds */}
      <rect y="300" width="480" height="40" fill={floor} />

      {/* window — SAME position/size in both variants, only glass tone differs slightly */}
      <rect x="36" y="34" width="120" height="150" rx="4" fill="#FBFAF7" stroke="#171717" strokeOpacity="0.18" strokeWidth="2" />
      <rect x="36" y="34" width="120" height="150" rx="4" fill="#BFD9E8" opacity={isAfter ? 0.3 : 0.45} />
      <line x1="96" y1="34" x2="96" y2="184" stroke="#171717" strokeOpacity="0.18" strokeWidth="2" />
      <line x1="36" y1="109" x2="156" y2="109" stroke="#171717" strokeOpacity="0.18" strokeWidth="2" />

      {/* upper cabinets — same layout, position, count */}
      <g>
        {[196, 268, 340, 412].map((x) => (
          <rect
            key={`upper-${x}`}
            x={x}
            y="46"
            width="60"
            height="78"
            rx="3"
            fill={cabinetUpper}
            stroke="#171717"
            strokeOpacity="0.12"
            strokeWidth="1.5"
          />
        ))}
      </g>

      {/* backsplash strip — same bounds */}
      <rect x="196" y="176" width="276" height="40" fill={backsplashBase} />
      {isAfter ? (
        <g opacity="0.5" stroke="#171717" strokeOpacity="0.08" strokeWidth="1">
          {[196, 226, 256, 286, 316, 346, 376, 406, 436].map((x) => (
            <line key={x} x1={x} y1="176" x2={x} y2="216" />
          ))}
        </g>
      ) : (
        <g opacity="0.4" stroke="#8A7F60" strokeWidth="0.75">
          {[196, 214, 232, 250, 268, 286, 304, 322, 340, 358, 376, 394, 412, 430, 448].map((x) => (
            <line key={x} x1={x} y1="176" x2={x} y2="216" />
          ))}
        </g>
      )}

      {/* countertop — same bounds */}
      <rect x="190" y="216" width="288" height="18" fill={countertop} />
      <rect x="190" y="216" width="288" height="4" fill="#000000" opacity="0.08" />

      {/* lower cabinets — same layout, position, count */}
      <g>
        {[196, 268, 340, 412].map((x) => (
          <rect
            key={`lower-${x}`}
            x={x}
            y="234"
            width="60"
            height="66"
            rx="3"
            fill={cabinetLower}
            stroke="#171717"
            strokeOpacity="0.15"
            strokeWidth="1.5"
          />
        ))}
      </g>

      {/* handles — after only, subtle modern detail */}
      {isAfter && (
        <g stroke="#171717" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round">
          {[196, 268, 340, 412].map((x) => (
            <line key={`handle-${x}`} x1={x + 8} y1="264" x2={x + 8} y2="278" />
          ))}
        </g>
      )}

      {/* pendant light — same position, warmer glow after */}
      <line x1="230" y1="0" x2="230" y2="20" stroke="#171717" strokeOpacity="0.25" strokeWidth="2" />
      <circle cx="230" cy="26" r="10" fill={isAfter ? "#2C4A3D" : "#A9A79E"} />
      {isAfter && <circle cx="230" cy="26" r="16" fill="#FFD98A" opacity="0.25" />}
    </svg>
  );
}
