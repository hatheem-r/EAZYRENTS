// Flat, cartoonish vehicle illustrations drawn from simple shapes.
// One consistent style: rounded teal bodies, soft-green glass, chunky dark
// wheels, one orange accent. All colors come from the global CSS tokens so
// the art re-themes with the app. Purely decorative: aria-hidden.
const BODY = 'var(--color-heading)'
const GLASS = 'var(--color-action-soft)'
const ACCENT = 'var(--color-primary)'
const WHEEL = '#2b2523'
const HUB = 'var(--color-bg)'
const ROAD = 'var(--color-border)'

function Wheels({ positions, r = 9 }) {
  return positions.map(([cx, cy]) => (
    <g key={`${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={r} fill={WHEEL} />
      <circle cx={cx} cy={cy} r={r * 0.4} fill={HUB} />
    </g>
  ))
}

const drawings = {
  car: (
    <>
      <rect x="8" y="64" width="104" height="4" rx="2" fill={ROAD} />
      <rect x="30" y="26" width="52" height="22" rx="11" fill={BODY} />
      <rect x="14" y="40" width="92" height="18" rx="9" fill={BODY} />
      <rect x="37" y="31" width="17" height="11" rx="4" fill={GLASS} />
      <rect x="58" y="31" width="17" height="11" rx="4" fill={GLASS} />
      <circle cx="101" cy="47" r="3.5" fill={ACCENT} />
      <rect x="14" y="46" width="10" height="4" rx="2" fill={ACCENT} />
      <Wheels positions={[[36, 58], [84, 58]]} />
    </>
  ),
  van: (
    <>
      <rect x="8" y="64" width="104" height="4" rx="2" fill={ROAD} />
      <path
        d="M20 56 L20 30 Q20 22 28 22 L78 22 Q88 22 93 30 L102 42 Q104 45 104 49 L104 56 Z"
        fill={BODY}
      />
      <rect x="27" y="28" width="16" height="12" rx="4" fill={GLASS} />
      <rect x="48" y="28" width="16" height="12" rx="4" fill={GLASS} />
      <path d="M80 28 L90 40 L70 40 L70 28 Z" fill={GLASS} />
      <rect x="20" y="48" width="84" height="5" rx="2.5" fill={ACCENT} />
      <Wheels positions={[[38, 58], [86, 58]]} />
    </>
  ),
  suv: (
    <>
      <rect x="8" y="64" width="104" height="4" rx="2" fill={ROAD} />
      <rect x="26" y="20" width="60" height="6" rx="3" fill={ACCENT} />
      <rect x="24" y="26" width="66" height="20" rx="9" fill={BODY} />
      <rect x="12" y="38" width="96" height="20" rx="9" fill={BODY} />
      <rect x="31" y="30" width="18" height="11" rx="4" fill={GLASS} />
      <rect x="54" y="30" width="18" height="11" rx="4" fill={GLASS} />
      <circle cx="103" cy="46" r="3.5" fill={ACCENT} />
      <Wheels positions={[[34, 58], [86, 58]]} r={10} />
    </>
  ),
  bike: (
    <>
      <rect x="8" y="64" width="104" height="4" rx="2" fill={ROAD} />
      {/* motorbike: solid wheels, tank + saddle body, front fork, exhaust */}
      <circle cx="30" cy="52" r="12" fill={WHEEL} />
      <circle cx="30" cy="52" r="4.5" fill={HUB} />
      <circle cx="90" cy="52" r="12" fill={WHEEL} />
      <circle cx="90" cy="52" r="4.5" fill={HUB} />
      <path
        d="M30 52 L46 40 L70 40 L82 30"
        fill="none"
        stroke={BODY}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M82 30 L90 52" fill="none" stroke={BODY} strokeWidth="6" strokeLinecap="round" />
      <rect x="48" y="30" width="22" height="12" rx="6" fill={ACCENT} />
      <rect x="30" y="30" width="18" height="7" rx="3.5" fill={BODY} />
      <path d="M78 24 L90 22" fill="none" stroke={BODY} strokeWidth="5" strokeLinecap="round" />
      <rect x="42" y="52" width="34" height="6" rx="3" fill={BODY} />
    </>
  ),
  tuktuk: (
    <>
      <rect x="8" y="64" width="104" height="4" rx="2" fill={ROAD} />
      {/* three-wheeler: sloped windshield front, canopy roof, open side */}
      <path
        d="M26 56 L26 50 Q28 44 40 25 Q44 20 50 20 L86 20 Q94 20 94 28 L94 56 Z"
        fill={BODY}
      />
      <rect x="34" y="16" width="64" height="7" rx="3.5" fill={ACCENT} />
      <path d="M45 27 L56 27 L56 40 L36 40 Z" fill={GLASS} />
      <rect x="62" y="27" width="24" height="23" rx="6" fill={GLASS} />
      <rect x="26" y="48" width="68" height="5" rx="2.5" fill={ACCENT} />
      <circle cx="40" cy="57" r="9" fill={WHEEL} />
      <circle cx="40" cy="57" r="3.5" fill={HUB} />
      <circle cx="84" cy="57" r="9" fill={WHEEL} />
      <circle cx="84" cy="57" r="3.5" fill={HUB} />
      <circle cx="28" cy="47" r="3.5" fill={ACCENT} />
    </>
  ),
  scooter: (
    <>
      <rect x="8" y="64" width="104" height="4" rx="2" fill={ROAD} />
      <circle cx="34" cy="54" r="11" fill={WHEEL} />
      <circle cx="34" cy="54" r="4.5" fill={HUB} />
      <circle cx="88" cy="54" r="11" fill={WHEEL} />
      <circle cx="88" cy="54" r="4.5" fill={HUB} />
      <path
        d="M34 54 L48 54 Q58 54 62 44 L78 44"
        fill="none"
        stroke={BODY}
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M80 44 L88 54 M80 44 L76 26" fill="none" stroke={BODY} strokeWidth="6" strokeLinecap="round" />
      <rect x="68" y="20" width="16" height="6" rx="3" fill={ACCENT} />
      <rect x="42" y="40" width="18" height="6" rx="3" fill={ACCENT} />
    </>
  ),
  // A winding dashed route with a start dot and a destination pin — the
  // brand's "journey line", used on the hero and auth pages.
  road: (
    <>
      <path
        d="M10 66 Q60 66 80 44 T150 26 T196 14"
        fill="none"
        stroke={ACCENT}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="1 12"
      />
      <circle cx="10" cy="66" r="6" fill={BODY} />
      <path
        d="M196 2 Q205 2 205 11 Q205 18 196 26 Q187 18 187 11 Q187 2 196 2 Z"
        fill={ACCENT}
      />
      <circle cx="196" cy="10.5" r="3.5" fill={HUB} />
    </>
  ),
}

function VehicleArt({ type, className = '' }) {
  const art = drawings[type] ?? drawings.car
  const viewBox = type === 'road' ? '0 0 210 74' : '0 0 120 74'

  return (
    <svg
      className={`vehicle-art ${className}`.trim()}
      viewBox={viewBox}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      {art}
    </svg>
  )
}

export default VehicleArt
