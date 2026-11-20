import { useId } from 'react'

/* ---------- Vektor illyustratsiya: ochiq kitob, bitiruvchi qalpoqchasi, kitoblar va globus ---------- */

/** Bo'lim sarlavhasi fon rangi bilan bir xil */
const KNOWLEDGE_BG = '#221f4f'

const PAGE_LINES = [108, 116, 124, 132]

/** To'rt qirrali yulduzcha */
function Sparkle({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <path
      d={`M${x} ${y - size}Q${x} ${y} ${x + size} ${y}Q${x} ${y} ${x} ${y + size}Q${x} ${y} ${x - size} ${y}Q${x} ${y} ${x} ${y - size}Z`}
    />
  )
}

/**
 * Chiziqli "bilim" kompozitsiyasi. `bg` — orqa fon rangi: shakllar shu rang bilan
 * to'ldiriladi va orqadagi orbita chiziqlarini yopadi.
 */
export default function KnowledgeIllustration({ bg = KNOWLEDGE_BG, className = 'h-full w-full' }: { bg?: string; className?: string }) {
  // Bir sahifada bir nechta nusxa bo'lsa ham id'lar to'qnashmasligi uchun
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fadeId = `oxu-knowledge-fade-${uid}`
  const maskId = `oxu-knowledge-mask-${uid}`

  return (
    <svg viewBox="0 0 272 176" className={className} fill="none" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="272" height="176" fill={`url(#${fadeId})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Orbita va sayyoralar */}
        <g transform="rotate(-10 136 92)">
          <ellipse cx="136" cy="92" rx="122" ry="34" strokeOpacity="0.32" strokeDasharray="1 5" />
          <circle cx="241.7" cy="75" r="4" fill={bg} />
          <circle cx="30.3" cy="75" r="2.2" fill="currentColor" stroke="none" fillOpacity="0.7" />
        </g>
        <circle cx="136" cy="68" r="40" strokeOpacity="0.22" />

        {/* Yulduzlar */}
        <g fill="currentColor" stroke="none">
          <Sparkle x={198} y={38} size={5} />
          <Sparkle x={76} y={36} size={4} />
          <Sparkle x={58} y={74} size={2.6} />
          <Sparkle x={214} y={104} size={2.6} />
          <circle cx="30" cy="48" r="1.1" />
          <circle cx="112" cy="20" r="0.9" />
          <circle cx="164" cy="16" r="0.9" />
          <circle cx="246" cy="30" r="1.1" />
        </g>

        {/* Kitoblar taxlami */}
        <rect x="4" y="148" width="44" height="12" rx="1.5" fill={bg} />
        <path d="M10 148v12M16 154h26" strokeOpacity="0.6" />
        <rect x="9" y="136" width="36" height="12" rx="1.5" fill={bg} />
        <path d="M39 136v12" strokeOpacity="0.6" />
        <g transform="rotate(-6 26 130)">
          <rect x="6" y="124" width="40" height="12" rx="1.5" fill={bg} />
          <path d="M12 124v12M18 130h22" strokeOpacity="0.6" />
        </g>

        {/* Globus */}
        <g transform="rotate(-18 244 120)">
          <circle cx="244" cy="120" r="16" fill={bg} />
          <ellipse cx="244" cy="120" rx="7" ry="16" strokeOpacity="0.6" />
          <path d="M228 120h32M231 111h26M231 129h26" strokeOpacity="0.6" />
        </g>
        <path d="M244 99a21 21 0 0 1 0 42" />
        <path d="M244 141v9" />
        <path d="M234 160c0-6 4-10 10-10s10 4 10 10" fill={bg} />

        {/* Kitobdan taraluvchi nur */}
        <g strokeOpacity="0.5">
          <path d="M116 96l-6-8M156 96l6-8M102 100l-12-6M170 100l12-6" />
        </g>

        {/* Ochiq kitob */}
        <path d="M50 106v48c32-7 62-5 86 6 24-11 54-13 86-6v-48" fill={bg} />
        <path d="M58 150.5c28-6 56-4 78 6.5M214 150.5c-28-6-56-4-78 6.5" strokeOpacity="0.6" />
        <path d="M136 154c-22-11-50-13-78-7V99c28-6 56-4 78 8z" fill={bg} />
        <path d="M136 154c22-11 50-13 78-7V99c-28-6-56-4-78 8z" fill={bg} />
        <path d="M136 107v47" />
        <g strokeOpacity="0.5">
          {PAGE_LINES.map((y, index) => (
            <g key={y}>
              <path d={index === PAGE_LINES.length - 1 ? `M66 ${y}c12-3 24-3 36 0` : `M66 ${y}c20-4 40-3 58 4`} />
              <path d={index === PAGE_LINES.length - 1 ? `M206 ${y}c-12-3-24-3-36 0` : `M206 ${y}c-20-4-40-3-58 4`} />
            </g>
          ))}
        </g>

        {/* Bitiruvchi qalpoqchasi */}
        <g transform="rotate(-8 136 62)">
          <path d="M114 64v12c0 5 10 9 22 9s22-4 22-9V64" fill={bg} />
          <path d="M136 44l42 16-42 16-42-16z" fill={bg} />
          <path d="M136 60l30 6v16" />
          <path d="M163.5 82h5l1.5 9h-8z" fill="currentColor" fillOpacity="0.35" />
          <circle cx="136" cy="60" r="1.8" fill="currentColor" stroke="none" />
        </g>

        {/* Yer chizig'i */}
        <path d="M0 160h272" />
      </g>
    </svg>
  )
}
