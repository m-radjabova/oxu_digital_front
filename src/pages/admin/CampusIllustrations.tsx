import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { Building } from '../../types'
import { SLOTS } from './campusSlots'

/* ======================================================================
   Kampus xaritasi va bino illyustratsiyalari (izometrik, vektor)
   ====================================================================== */

const MAP_W = 600
const MAP_H = 520
const CX = 300
const CY = 250

const num = (n: number) => +n.toFixed(2)

/** Bino plazasidan eng yaqin yo'lgacha piyodalar yo'lagi */
function connectorFor(slot: { x: number; y: number }) {
  const left = slot.x + 60 < CX
  const x1 = left ? slot.x + 128 : slot.x - 8
  const y = slot.y + 80
  if (Math.abs(x1 - CX) < 30) return null
  return { x1, x2: left ? CX - 12 : CX + 12, y }
}
const CONNECTORS = SLOTS.map(connectorFor)

/* ---------- Daraxtlar (deterministik) ---------- */

function buildTrees() {
  let seed = 11
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647
  }
  const trees: { x: number; y: number; r: number; tone: number }[] = []
  for (let gx = 14; gx < MAP_W; gx += 32) {
    for (let gy = 14; gy < MAP_H; gy += 32) {
      const x = gx + (rand() - 0.5) * 22
      const y = gy + (rand() - 0.5) * 22
      const skip = rand() < 0.3
      const r = 8.5 + rand() * 5.5
      const tone = Math.floor(rand() * 3)
      if (skip) continue
      if (Math.abs(y - CY) < 24 || Math.abs(x - CX) < 24) continue
      if (Math.hypot(x - CX, y - CY) < 96) continue
      if (SLOTS.some((s) => x > s.x - 20 && x < s.x + 140 && y > s.y - 34 && y < s.y + 118)) continue
      if (CONNECTORS.some((c, i) => c && Math.abs(y - c.y) < 14 && x > Math.min(c.x1, c.x2) - 6 && x < Math.max(c.x1, c.x2) + 6 && SLOTS[i])) continue
      trees.push({ x, y, r, tone })
    }
  }
  return trees.sort((a, b) => a.y - b.y)
}
const TREES = buildTrees()

/** Favvora atrofidagi gul to'plari */
const FLOWERS = Array.from({ length: 18 }, (_, i) => {
  const a = (i / 18) * Math.PI * 2
  return { x: CX + Math.cos(a) * 43, y: CY + Math.sin(a) * 43, c: ['#f472b6', '#fbbf24', '#fb7185', '#fff'][i % 4] }
})

/** Yo'l chiroqlari */
const LAMPS = [
  ...[40, 120, 190, 410, 480, 560].flatMap((x) => [{ x, y: 232 }, { x, y: 268 }]),
  ...[40, 160, 340, 470].flatMap((y) => [{ x: 282, y }, { x: 318, y }]),
]

/* ---------- Izometrik bino ---------- */

type Face = 'left' | 'right'

/** Devor tekisligidagi (parallelogramm) derazalar */
function faceWindows(face: Face, skip: (row: number, col: number) => boolean) {
  const base = face === 'left' ? 30 : 90
  const slope = face === 'left' ? 0.5 : -0.5
  const x0 = face === 'left' ? 6 : 66
  const yT = (x: number) => base + slope * x
  const rows = [6, 22]
  const out: { d: string; mullion: string; sill: string }[] = []
  rows.forEach((off, row) => {
    for (let col = 0; col < 4; col++) {
      if (skip(row, col)) continue
      const x = x0 + col * 14
      const w = 9
      const h = 10
      const y1 = yT(x) + off
      const y2 = yT(x + w) + off
      const xm = x + w / 2
      const ym = yT(xm) + off
      out.push({
        d: `M${num(x)} ${num(y1)}L${num(x + w)} ${num(y2)}V${num(y2 + h)}L${num(x)} ${num(y1 + h)}Z`,
        mullion: `M${num(xm)} ${num(ym)}V${num(ym + h)}`,
        sill: `M${num(x - 1)} ${num(y1 + h)}L${num(x + w + 1)} ${num(y2 + h)}V${num(y2 + h + 1.6)}L${num(x - 1)} ${num(y1 + h + 1.6)}Z`,
      })
    }
  })
  return out
}

const LEFT_WIN = faceWindows('left', () => false)
const RIGHT_WIN = faceWindows('right', (row, col) => row === 1 && (col === 1 || col === 2))

function IsoBuilding({ inactive }: { inactive: boolean }) {
  return (
    <g style={inactive ? { filter: 'grayscale(0.85)', opacity: 0.6 } : undefined}>
      {/* soya va plaza */}
      <path d="M120 70 60 100 84 114 148 82Z" fill="#1f4a2c" opacity="0.2" />
      <path d="M60 44 132 80 60 116 -12 80Z" fill="#e9e3d3" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M60 52 120 80 60 108 0 80Z" fill="none" stroke="#d3cab4" strokeWidth="0.8" strokeDasharray="3 3" />

      {/* devorlar */}
      <path d="M0 30 60 60V100L0 70Z" fill="url(#oxu-wallL)" />
      <path d="M60 60 120 30V70L60 100Z" fill="url(#oxu-wallR)" />

      {/* sokl */}
      <path d="M0 64 60 94V100L0 70Z" fill="#b8a888" />
      <path d="M60 94 120 64V70L60 100Z" fill="#9c8d70" />

      {/* derazalar */}
      {LEFT_WIN.map((w, i) => (
        <g key={`l${i}`}>
          <path d={w.sill} fill="#f6efdc" />
          <path d={w.d} fill="url(#oxu-glassL)" stroke="#f6efdc" strokeWidth="1" strokeLinejoin="round" />
          <path d={w.mullion} stroke="#f6efdc" strokeWidth="0.7" />
        </g>
      ))}
      {RIGHT_WIN.map((w, i) => (
        <g key={`r${i}`}>
          <path d={w.sill} fill="#e9dcc0" />
          <path d={w.d} fill="url(#oxu-glassR)" stroke="#efe4c8" strokeWidth="1" strokeLinejoin="round" />
          <path d={w.mullion} stroke="#efe4c8" strokeWidth="0.7" />
        </g>
      ))}

      {/* kirish: eshik, soyabon, zina */}
      <path d="M82 90 98 82V84L82 92Z" fill="#f1e9d6" />
      <path d="M84 84 96 78V62L84 68Z" fill="#35527e" stroke="#f1e9d6" strokeWidth="1" strokeLinejoin="round" />
      <path d="M90 81V65" stroke="#f1e9d6" strokeWidth="0.7" />
      <path d="M81 68.5 99 59.5V63L81 72Z" fill="#6a4f3a" />

      {/* kornish */}
      <path d="M0 30 60 60V62.5L0 32.5Z" fill="#f8f0da" />
      <path d="M60 60 120 30V32.5L60 62.5Z" fill="#e8d8b0" />

      {/* tom */}
      <path d="M60 0 120 30 60 60 0 30Z" fill="#59668f" />
      <path d="M60 6 108 30 60 54 12 30Z" fill="#7d8ab8" />
      <path d="M60 14 92 30 60 46 28 30Z" fill="#a9b5de" opacity="0.9" />
      <path d="M60 0 120 30 60 60 0 30Z" fill="none" stroke="#f3e9cf" strokeWidth="1.6" strokeLinejoin="round" />

      {/* tom ustidagi blok */}
      <path d="M48 26 60 32V40L48 34Z" fill="#cdb98a" />
      <path d="M60 32 72 26V34L60 40Z" fill="#b39f72" />
      <path d="M60 20 72 26 60 32 48 26Z" fill="#8b97c4" />
      <circle cx="60" cy="26" r="1.6" fill="#59668f" />
      <path d="M60 60V100" stroke="#a89368" strokeWidth="1" opacity="0.6" />
    </g>
  )
}

/* ---------- Xarita ---------- */

function Car({ x, y, rot, color }: { x: number; y: number; rot: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-11" y="-5" width="22" height="10" rx="3.5" fill={color} stroke="#fff" strokeOpacity="0.7" strokeWidth="0.6" />
      <rect x="-3" y="-4" width="8" height="8" rx="1.5" fill="#1e293b" opacity="0.8" />
      <rect x="9" y="-4" width="2" height="2" rx="0.6" fill="#fef3c7" />
      <rect x="9" y="2" width="2" height="2" rx="0.6" fill="#fef3c7" />
    </g>
  )
}

export function CampusMap({
  buildings,
  selectedId,
  zoom,
  onSelect,
}: {
  buildings: Building[]
  selectedId: string
  zoom: number
  onSelect: (id: string) => void
}) {
  const placed = buildings
    .slice(0, SLOTS.length)
    .map((building, index) => ({ building, slot: SLOTS[index], connector: CONNECTORS[index] }))
    .sort((a, b) => a.slot.y - b.slot.y)
  const selected = placed.find((item) => item.building.id === selectedId)
  const origin = selected
    ? `${((selected.slot.x + 60) / MAP_W) * 100}% ${((selected.slot.y + 50) / MAP_H) * 100}%`
    : '50% 50%'

  function onKey(event: ReactKeyboardEvent<SVGGElement>, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(id)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-inset ring-slate-200/70">
      <svg
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        className="block h-auto w-full transition-transform duration-500 ease-out motion-reduce:transition-none dark:brightness-[0.82] dark:saturate-[0.9]"
        style={{ transform: `scale(${zoom})`, transformOrigin: origin }}
        role="group"
        aria-label="Universitet kampusi xaritasi"
      >
        <defs>
          <linearGradient id="oxu-ground" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#e4f0d3" />
            <stop offset="1" stopColor="#cfe3bb" />
          </linearGradient>
          <pattern id="oxu-mow" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <rect width="20" height="40" fill="#ffffff" opacity="0.07" />
          </pattern>
          <radialGradient id="oxu-vignette" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.6" stopColor="#1f3d2a" stopOpacity="0" />
            <stop offset="1" stopColor="#1f3d2a" stopOpacity="0.16" />
          </radialGradient>
          <linearGradient id="oxu-wallL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3e5c2" />
            <stop offset="1" stopColor="#e1cb9a" />
          </linearGradient>
          <linearGradient id="oxu-wallR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#d8bd86" />
            <stop offset="1" stopColor="#bda26a" />
          </linearGradient>
          <linearGradient id="oxu-glassL" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#a9caf2" />
            <stop offset="0.45" stopColor="#78a0da" />
            <stop offset="0.46" stopColor="#5f87c6" />
            <stop offset="1" stopColor="#47699f" />
          </linearGradient>
          <linearGradient id="oxu-glassR" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#8fb0e0" />
            <stop offset="0.45" stopColor="#6489c7" />
            <stop offset="0.46" stopColor="#4f73ad" />
            <stop offset="1" stopColor="#38557f" />
          </linearGradient>
          <radialGradient id="oxu-water" cx="0.4" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#bfe6fb" />
            <stop offset="1" stopColor="#5eb2e8" />
          </radialGradient>
          {['#5aa152', '#6bb25f', '#48894a'].map((c, i) => (
            <radialGradient id={`oxu-tree${i}`} key={i} cx="0.35" cy="0.3" r="0.8">
              <stop offset="0" stopColor="#a7d68a" />
              <stop offset="0.45" stopColor={c} />
              <stop offset="1" stopColor="#2f6a39" />
            </radialGradient>
          ))}
        </defs>

        {/* Yer */}
        <rect width={MAP_W} height={MAP_H} fill="url(#oxu-ground)" />
        <rect width={MAP_W} height={MAP_H} fill="url(#oxu-mow)" />

        {/* Piyodalar yo'lakchalari */}
        {placed.map(({ building, connector }) =>
          connector ? (
            <g key={`c-${building.id}`}>
              <path d={`M${connector.x1} ${connector.y}H${connector.x2}`} stroke="#f2ede0" strokeWidth="9" strokeLinecap="round" />
              <path d={`M${connector.x1} ${connector.y}H${connector.x2}`} stroke="#d8d0bb" strokeWidth="9" strokeLinecap="round" strokeDasharray="1 5" opacity="0.7" />
            </g>
          ) : null,
        )}

        {/* Yo'llar: trotuar, asfalt, chiziqlar */}
        <g fill="none">
          <g stroke="#efe9d8" strokeWidth="32">
            <path d={`M0 ${CY}H${MAP_W}M${CX} 0V${MAP_H}`} />
            <circle cx={CX} cy={CY} r="64" />
          </g>
          <g stroke="#6b7080" strokeWidth="24">
            <path d={`M0 ${CY}H${MAP_W}M${CX} 0V${MAP_H}`} />
            <circle cx={CX} cy={CY} r="64" />
          </g>
          <g stroke="#f8fafc" strokeOpacity="0.85" strokeWidth="1.4" strokeDasharray="8 8">
            <path d={`M0 ${CY}H${MAP_W}M${CX} 0V${MAP_H}`} />
            <circle cx={CX} cy={CY} r="64" />
          </g>
        </g>
        {/* Piyodalar o'tish joylari */}
        <g fill="#f8fafc" opacity="0.9">
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i}>
              <rect x={CX - 11 + i * 4.8} y={CY - 142} width="2.6" height="24" rx="0.6" />
              <rect x={CX - 11 + i * 4.8} y={CY + 118} width="2.6" height="24" rx="0.6" />
              <rect x={CX - 142} y={CY - 11 + i * 4.8} width="24" height="2.6" rx="0.6" />
              <rect x={CX + 118} y={CY - 11 + i * 4.8} width="24" height="2.6" rx="0.6" />
            </g>
          ))}
        </g>

        {/* Favvora: yo'l ichidagi orol */}
        <circle cx={CX} cy={CY} r="52" fill="#efe9d8" />
        <circle cx={CX} cy={CY} r="48" fill="#8fc47a" />
        {FLOWERS.map((f, i) => <circle key={i} cx={f.x} cy={f.y} r="2.1" fill={f.c} />)}
        <circle cx={CX} cy={CY + 2} r="36" fill="#27522f" opacity="0.18" />
        <circle cx={CX} cy={CY} r="35" fill="#f4f0e4" stroke="#fff" strokeWidth="2" />
        <circle cx={CX} cy={CY} r="31" fill="url(#oxu-water)" />
        <circle cx={CX} cy={CY} r="24" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="16" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
        <circle cx={CX} cy={CY} r="8" fill="#e8f6ff" stroke="#fff" strokeWidth="1.5" />
        <g stroke="#fff" strokeWidth="1.8" strokeLinecap="round" fill="none">
          <path d={`M${CX} ${CY}V${CY - 20}`} />
          <path d={`M${CX} ${CY - 15}Q${CX - 7} ${CY - 17} ${CX - 10} ${CY - 6}`} />
          <path d={`M${CX} ${CY - 15}Q${CX + 7} ${CY - 17} ${CX + 10} ${CY - 6}`} />
          <path d={`M${CX} ${CY - 20}Q${CX - 4} ${CY - 22} ${CX - 6} ${CY - 15}`} strokeWidth="1.2" />
          <path d={`M${CX} ${CY - 20}Q${CX + 4} ${CY - 22} ${CX + 6} ${CY - 15}`} strokeWidth="1.2" />
        </g>
        {/* skameykalar */}
        {[0, 90, 180, 270].map((a) => (
          <rect key={a} x={CX + 56} y={CY - 3} width="4" height="6" rx="1" fill="#8a6a45" transform={`rotate(${a + 45} ${CX} ${CY})`} />
        ))}

        {/* Mashinalar */}
        <Car x={80} y={CY + 6} rot={0} color="#ef6a5a" />
        <Car x={190} y={CY + 6} rot={0} color="#f4f4f5" />
        <Car x={500} y={CY - 6} rot={180} color="#3b82f6" />
        <Car x={CX - 6} y={92} rot={90} color="#fbbf24" />
        <Car x={CX + 6} y={452} rot={270} color="#64748b" />

        {/* Chiroqlar */}
        {LAMPS.map((l, i) => (
          <g key={i}>
            <circle cx={l.x} cy={l.y} r="6" fill="#fef08a" opacity="0.28" />
            <circle cx={l.x} cy={l.y} r="1.8" fill="#475569" />
          </g>
        ))}

        {/* Daraxtlar */}
        {TREES.map((tree, index) => (
          <g key={index}>
            <ellipse cx={tree.x + tree.r * 0.35} cy={tree.y + tree.r * 0.95} rx={tree.r * 1.05} ry={tree.r * 0.4} fill="#1f4a2c" opacity="0.22" />
            <rect x={tree.x - 1.2} y={tree.y + tree.r * 0.35} width="2.4" height={tree.r * 0.75} rx="0.8" fill="#6b5237" />
            <circle cx={tree.x} cy={tree.y} r={tree.r} fill={`url(#oxu-tree${tree.tone})`} />
            <circle cx={tree.x + tree.r * 0.35} cy={tree.y + tree.r * 0.25} r={tree.r * 0.45} fill="#2f6a39" opacity="0.35" />
          </g>
        ))}

        {/* Binolar */}
        {placed.map(({ building, slot }) => {
          const isSelected = building.id === selectedId
          return (
            <g
              key={building.id}
              transform={`translate(${slot.x} ${slot.y})`}
              className="group cursor-pointer outline-none"
              role="button"
              tabIndex={0}
              aria-label={`${building.name} binosini tanlash`}
              aria-pressed={isSelected}
              onClick={() => onSelect(building.id)}
              onKeyDown={(event) => onKey(event, building.id)}
            >
              <g className="transition-transform duration-200 group-hover:-translate-y-1 motion-reduce:transition-none">
                <IsoBuilding inactive={!building.isActive} />
                {isSelected && (
                  <path
                    d="M0 30 60 0 120 30V70L60 100 0 70Z"
                    fill="rgba(124,92,255,0.08)"
                    stroke="#6a4cf0"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 7px rgba(106,76,240,0.85))' }}
                  />
                )}
              </g>
              <path
                d="M-12 80 60 44 132 80 60 116Z"
                fill="none"
                stroke="#6a4cf0"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-0 group-focus-visible:opacity-100"
              />
            </g>
          )
        })}

        {/* Yorliqlar */}
        {placed.map(({ building, slot }) => {
          const isSelected = building.id === selectedId
          const label = building.name.length > 12 ? `${building.name.slice(0, 11)}…` : building.name
          const free = building.rooms.filter((room) => room.isActive && !room.occupied).length
          const textWidth = label.length * 7.4
          const width = 34 + textWidth + 30
          const x0 = 60 - width / 2
          return (
            <g
              key={building.id}
              transform={`translate(${slot.x} ${slot.y})`}
              className="cursor-pointer"
              onClick={() => onSelect(building.id)}
            >
              {isSelected && (
                <g transform="translate(60 -23)">
                  <path d="M0 0C-9-10-14-16-14-23a14 14 0 0 1 28 0C14-16 9-10 0 0Z" fill="#4c3fd0" stroke="#fff" strokeWidth="2" />
                  <circle cy="-23" r="5" fill="#fff" />
                </g>
              )}
              <rect
                x={x0}
                y={-23}
                width={width}
                height={26}
                rx={13}
                fill={isSelected ? '#4c3fd0' : '#fff'}
                stroke={isSelected ? '#fff' : '#e2e4f0'}
                strokeWidth="1.5"
                style={{ filter: 'drop-shadow(0 4px 6px rgba(37,33,79,0.18))' }}
              />
              <path
                transform={`translate(${x0 + 11} -16)`}
                d="M7 0 0 4h14zM1.5 5.5h2v5h-2zM6 5.5h2v5H6zM10.5 5.5h2v5h-2zM0 11.5h14V13H0z"
                fill={isSelected ? '#fff' : '#4c3fd0'}
              />
              <text x={x0 + 32} y={-5.5} fontSize="12.5" fontWeight="700" fill={isSelected ? '#fff' : '#25214f'} fontFamily="inherit">
                {label}
              </text>
              <circle cx={x0 + width - 15} cy={-10} r={9} fill={free ? '#22c55e' : '#94a3b8'} />
              <text x={x0 + width - 15} y={-6} fontSize="10.5" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="inherit">
                {free}
              </text>
            </g>
          )
        })}

        <rect width={MAP_W} height={MAP_H} fill="url(#oxu-vignette)" pointerEvents="none" />
      </svg>
    </div>
  )
}

/* ---------- Bino old fasadi ---------- */

function FacadeWindow({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x - 1.5} y={y - 1.5} width="13" height="18" rx="1.5" fill="#f7efdb" />
      <rect x={x} y={y} width="10" height="15" rx="1" fill="url(#fc-glass)" />
      <path d={`M${x + 5} ${y}V${y + 15}M${x} ${y + 7}H${x + 10}`} stroke="#f7efdb" strokeWidth="0.9" />
      <rect x={x - 2.5} y={y + 15} width="15" height="2.2" rx="0.6" fill="#d8c9a3" />
    </g>
  )
}

export function FacadeIllustration() {
  return (
    <svg viewBox="0 0 240 168" className="h-full w-full" role="img" aria-label="Bino fasadi">
      <defs>
        <linearGradient id="fc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ec5f5" />
          <stop offset="0.7" stopColor="#d6ecff" />
          <stop offset="1" stopColor="#f3f9ff" />
        </linearGradient>
        <radialGradient id="fc-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#fff7d1" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff7d1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="fc-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2e4c1" />
          <stop offset="1" stopColor="#e3cd9d" />
        </linearGradient>
        <linearGradient id="fc-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b3d2f5" />
          <stop offset="0.45" stopColor="#7ea6de" />
          <stop offset="0.46" stopColor="#6188c6" />
          <stop offset="1" stopColor="#456a9f" />
        </linearGradient>
        <linearGradient id="fc-col" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbf6ea" />
          <stop offset="0.55" stopColor="#f1e8d2" />
          <stop offset="1" stopColor="#d9cdb2" />
        </linearGradient>
        <linearGradient id="fc-lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#a8d28b" />
          <stop offset="1" stopColor="#7fb468" />
        </linearGradient>
        <radialGradient id="fc-tree" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#a7d68a" />
          <stop offset="0.5" stopColor="#52994d" />
          <stop offset="1" stopColor="#2f6a39" />
        </radialGradient>
      </defs>

      {/* osmon */}
      <rect width="240" height="168" fill="url(#fc-sky)" />
      <circle cx="200" cy="26" r="34" fill="url(#fc-sun)" />
      <circle cx="200" cy="26" r="9" fill="#fff6c8" />
      <g fill="#fff" opacity="0.92">
        <ellipse cx="46" cy="24" rx="22" ry="6.5" />
        <ellipse cx="62" cy="19" rx="14" ry="6.5" />
        <ellipse cx="34" cy="20" rx="10" ry="5" />
        <ellipse cx="150" cy="16" rx="16" ry="4.5" opacity="0.8" />
      </g>
      <g stroke="#475569" strokeWidth="0.9" fill="none" strokeLinecap="round" opacity="0.7">
        <path d="M168 40q3-3 6 0q3-3 6 0" />
        <path d="M182 48q2.5-2.5 5 0q2.5-2.5 5 0" />
      </g>

      {/* uzoqdagi tepaliklar */}
      <path d="M0 120Q40 96 86 116T170 108T240 116V150H0Z" fill="#b9d9c1" />
      <path d="M0 130Q50 114 110 128T240 124V150H0Z" fill="#9cc8a0" />

      {/* maysa */}
      <rect y="136" width="240" height="32" fill="url(#fc-lawn)" />
      <g fill="#fff" opacity="0.08">
        <path d="M0 146H240V152H0Z" />
        <path d="M0 158H240V164H0Z" />
      </g>

      {/* chap daraxt */}
      <ellipse cx="30" cy="148" rx="22" ry="4.5" fill="#1f4a2c" opacity="0.2" />
      <rect x="27.5" y="106" width="5" height="42" rx="1.5" fill="#6b5237" />
      <circle cx="30" cy="92" r="23" fill="url(#fc-tree)" />
      <circle cx="40" cy="100" r="12" fill="#2f6a39" opacity="0.3" />

      {/* qanotlar tomi */}
      <path d="M44 66 52 54H88L92 66Z" fill="#59668f" />
      <path d="M148 66 152 54H188L196 66Z" fill="#59668f" />
      <path d="M52 54H88L90 57H50Z" fill="#8d99c6" />
      <path d="M152 54H188L190 57H150Z" fill="#8d99c6" />

      {/* qanotlar devori */}
      <rect x="44" y="66" width="52" height="72" fill="url(#fc-wall)" />
      <rect x="144" y="66" width="52" height="72" fill="url(#fc-wall)" />
      <rect x="42" y="64" width="56" height="4" fill="#f8f0da" />
      <rect x="142" y="64" width="56" height="4" fill="#f8f0da" />
      <rect x="44" y="130" width="52" height="8" fill="#c9b78f" />
      <rect x="144" y="130" width="52" height="8" fill="#c9b78f" />

      {[0, 1, 2].map((i) => (
        <g key={i}>
          <FacadeWindow x={50 + i * 15} y={74} />
          <FacadeWindow x={50 + i * 15} y={101} />
          <FacadeWindow x={152 + i * 15} y={74} />
          <FacadeWindow x={152 + i * 15} y={101} />
        </g>
      ))}

      {/* markaziy blok */}
      <rect x="90" y="70" width="60" height="68" fill="#e9d9b2" />
      <path d="M86 72 120 46 154 72Z" fill="#f6eedb" stroke="#d8c9a3" strokeWidth="1" strokeLinejoin="round" />
      <path d="M96 70 120 52 144 70Z" fill="#e5d8b9" />
      <circle cx="120" cy="64" r="4.5" fill="#f6eedb" stroke="#b8a77c" strokeWidth="1" />
      <path d="M120 61.5V64l2 1.5" stroke="#6a5a3a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <rect x="88" y="70" width="64" height="5" fill="#f8f0da" />
      <rect x="88" y="75" width="64" height="2" fill="#cdbd94" />

      {/* ustunlar */}
      {[94, 109, 125, 140].map((x) => (
        <g key={x}>
          <rect x={x - 1} y="77" width="8" height="2.5" fill="#f8f0da" />
          <rect x={x} y="79" width="6" height="51" fill="url(#fc-col)" />
          <rect x={x - 1} y="130" width="8" height="3" fill="#f8f0da" />
        </g>
      ))}

      {/* eshik */}
      <path d="M115 132V116a5 5 0 0 1 10 0V132Z" fill="#3a557f" stroke="#f7efdb" strokeWidth="1.2" />
      <path d="M120 111V132" stroke="#f7efdb" strokeWidth="0.9" />
      <path d="M115 116a5 5 0 0 1 10 0" fill="none" stroke="#9fc0ee" strokeWidth="0.8" opacity="0.7" />
      <rect x="112" y="108" width="16" height="2.2" rx="0.6" fill="#8d99c6" opacity="0" />

      {/* zina va yo'lak */}
      <rect x="88" y="133" width="64" height="3.5" fill="#f4ecd8" />
      <rect x="84" y="136.5" width="72" height="3.5" fill="#e6dcc3" />
      <rect x="80" y="140" width="80" height="3.5" fill="#d8ccb0" />
      <path d="M82 143.5H158L176 168H64Z" fill="#ece5d2" />
      <path d="M120 143.5V168" stroke="#d3c8ac" strokeWidth="0.8" />
      <path d="M101 143.5 92 168M139 143.5 148 168" stroke="#d3c8ac" strokeWidth="0.6" />

      {/* bayroq */}
      <path d="M120 46V28" stroke="#6b7280" strokeWidth="1.2" />
      <path d="M120 28h13l-3 4 3 4h-13Z" fill="#2f6fd6" />

      {/* butalar */}
      {[52, 70, 88, 152, 170, 188].map((x, i) => (
        <g key={x}>
          <ellipse cx={x} cy="140" rx="8" ry="5.5" fill="url(#fc-tree)" />
          <circle cx={x - 2} cy="137" r="1.4" fill={i % 2 ? '#fbbf24' : '#f472b6'} />
          <circle cx={x + 3} cy="139" r="1.2" fill={i % 2 ? '#f472b6' : '#fff'} />
        </g>
      ))}

      {/* chiroqlar */}
      {[66, 174].map((x) => (
        <g key={x}>
          <path d={`M${x} 160V146`} stroke="#475569" strokeWidth="1.4" />
          <circle cx={x} cy="144" r="2.6" fill="#fef3c7" stroke="#475569" strokeWidth="0.8" />
        </g>
      ))}

      {/* o'ng daraxt */}
      <ellipse cx="214" cy="148" rx="18" ry="4" fill="#1f4a2c" opacity="0.2" />
      <rect x="211.5" y="108" width="5" height="40" rx="1.5" fill="#6b5237" />
      <circle cx="214" cy="96" r="20" fill="url(#fc-tree)" />
      <circle cx="221" cy="103" r="10" fill="#2f6a39" opacity="0.3" />
    </svg>
  )
}