import { useId } from 'react'

/* ---------- Vektor illyustratsiya: simmetrik universitet binosi ---------- */

const COLUMNS = [93.5, 110.5, 127.5, 144.5, 161.5, 178.5] // markaz (136) atrofida simmetrik
const WINDOW_X = [42, 59, 76] // chap qanot; o'ng qanot 272 - x

/** Sidebar fon rangi bilan bir xil */
const CAMPUS_BG = '#28235a'

function ArchWindow({ cx, bg }: { cx: number; bg: string }) {
  return (
    <>
      <path d={`M${cx - 4} 130V120a4 4 0 0 1 8 0v10z`} fill={bg} />
      <path d={`M${cx - 5.5} 130h11`} />
    </>
  )
}

/**
 * Chiziqli universitet binosi. `bg` — orqa fon rangi: shakllar shu rang bilan
 * to'ldiriladi va orqadagi chiziqlarni yopadi.
 */
export default function CampusIllustration({ bg = CAMPUS_BG, className = 'h-full w-full' }: { bg?: string; className?: string }) {
  // Bir sahifada bir nechta nusxa bo'lsa ham id'lar to'qnashmasligi uchun
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const fadeId = `oxu-fade-${uid}`
  const maskId = `oxu-mask-${uid}`

  return (
    <svg viewBox="0 0 272 176" className={className} fill="none" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId}>
          <rect width="272" height="176" fill={`url(#${fadeId})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        {/* Halo */}
        <circle cx="136" cy="102" r="82" strokeOpacity="0.35" strokeDasharray="1 5" />
        <circle cx="136" cy="102" r="56" strokeOpacity="0.28" />

        {/* Yulduzlar */}
        <g fill="currentColor" stroke="none">
          <circle cx="38" cy="44" r="1.2" />
          <circle cx="62" cy="68" r="0.9" />
          <circle cx="232" cy="40" r="1.2" />
          <circle cx="212" cy="66" r="0.9" />
          <circle cx="104" cy="30" r="0.9" />
          <circle cx="170" cy="26" r="0.9" />
        </g>

        {/* Qanotlar */}
        <rect x="30" y="100" width="58" height="44" fill={bg} />
        <rect x="26" y="96" width="62" height="4" rx="1" fill={bg} />
        <rect x="184" y="100" width="58" height="44" fill={bg} />
        <rect x="184" y="96" width="62" height="4" rx="1" fill={bg} />
        {WINDOW_X.map((x) => (
          <g key={x}>
            <ArchWindow cx={x} bg={bg} />
            <ArchWindow cx={272 - x} bg={bg} />
          </g>
        ))}

        {/* Asosiy bino */}
        <rect x="88" y="86" width="96" height="58" fill={bg} />

        {/* Pediment */}
        <path d="M76 80 136 44l60 36z" fill={bg} />
        <path d="M89 76 136 49l47 27" strokeOpacity="0.55" />
        <circle cx="136" cy="65" r="5" />
        <circle cx="136" cy="65" r="1.8" fill="currentColor" stroke="none" />
        <rect x="76" y="80" width="120" height="6" rx="1" fill={bg} />

        {/* Ustunlar */}
        {COLUMNS.map((c) => (
          <g key={c}>
            <rect x={c - 3} y="89" width="6" height="52" fill={bg} />
            <rect x={c - 4.5} y="86" width="9" height="3" rx="0.6" fill={bg} />
            <rect x={c - 4.5} y="141" width="9" height="3" rx="0.6" fill={bg} />
          </g>
        ))}

        {/* Eshik */}
        <path d="M132 144V128a4 4 0 0 1 8 0v16z" fill="currentColor" fillOpacity="0.18" />

        {/* Zinapoyalar */}
        <path d="M78 152v-8h116v8" fill={bg} />
        <path d="M70 160v-8h132v8" fill={bg} />

        {/* Bayroq */}
        <path d="M136 44V24" />
        <path d="M136 24h13l-3.5 4 3.5 4h-13" fill="currentColor" fillOpacity="0.35" />

        {/* Daraxtlar */}
        <circle cx="14" cy="130" r="9" fill={bg} />
        <path d="M14 139v21M14 124v6" />
        <circle cx="258" cy="130" r="9" fill={bg} />
        <path d="M258 139v21M258 124v6" />

        {/* Yer chizig'i */}
        <path d="M0 160h272" />
      </g>
    </svg>
  )
}
