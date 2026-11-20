const STROKES = [
  'M10 55H54', // poydevor
  'M7 59H57',
  'M17 33V50M25 33V50M39 33V50M47 33V50', // ustunlar
  'M12 33H52', // entablatura
  'M9 29 32 14l23 15z', // pediment
  'M29 50V44a3 3 0 0 1 6 0V50', // eshik
]

const STYLES = `
@keyframes oxu-draw {
  0%   { stroke-dashoffset: 1; opacity: 1; }
  50%  { stroke-dashoffset: 0; opacity: 1; }
  86%  { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}
@keyframes oxu-ring {
  0%   { transform: scale(0.85); opacity: 0.45; }
  100% { transform: scale(1.7);  opacity: 0; }
}
@keyframes oxu-bar {
  0%   { transform: translateX(-110%); }
  100% { transform: translateX(320%); }
}
@keyframes oxu-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.oxu-draw  { stroke-dasharray: 1; animation: oxu-draw 2.8s ease-in-out infinite; }
.oxu-ring  { animation: oxu-ring 2.8s cubic-bezier(0.2, 0.6, 0.3, 1) infinite; }
.oxu-bar   { animation: oxu-bar 1.5s ease-in-out infinite; }
.oxu-float { animation: oxu-float 4s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .oxu-draw  { animation: none; stroke-dashoffset: 0; }
  .oxu-ring, .oxu-float { animation: none; }
  .oxu-ring  { opacity: 0.25; transform: scale(1.25); }
  .oxu-bar   { animation: none; transform: translateX(100%); }
}
`

export default function PageLoader({ label = 'Sahifa yuklanmoqda...' }: { label?: string }) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-canvas px-6">
      <style>{STYLES}</style>

      {/* Fon: nuqtali to'r va yumshoq nurlar */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_65%)]"
          style={{
            backgroundImage: 'radial-gradient(rgba(91,70,201,0.18) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="absolute left-1/2 top-1/2 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-300/25 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 size-80 rounded-full bg-sky-200/30 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center" role="status" aria-live="polite">
        {/* Logotip: o'zi chiziladigan universitet binosi */}
        <div className="oxu-float relative grid size-28 place-items-center">
          <span className="oxu-ring absolute size-24 rounded-[2rem] border border-brand-400/60" aria-hidden="true" />
          <span
            className="oxu-ring absolute size-24 rounded-[2rem] border border-brand-400/60"
            style={{ animationDelay: '1.4s' }}
            aria-hidden="true"
          />
          <span className="relative grid size-24 place-items-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#2a2559] via-[#3a2f86] to-[#5b46c9] shadow-[0_24px_50px_-18px_rgba(58,47,134,0.8)] ring-1 ring-white/20">
            <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" aria-hidden="true" />
            <svg viewBox="0 0 64 64" className="relative size-14 text-white" fill="none" aria-hidden="true">
              <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {STROKES.map((d, index) => (
                  <path
                    key={d}
                    d={d}
                    pathLength={1}
                    className="oxu-draw"
                    style={{ animationDelay: `${index * 0.12}s` }}
                  />
                ))}
              </g>
              <circle cx="32" cy="23" r="2.4" fill="currentColor" fillOpacity="0.9" />
            </svg>
          </span>
        </div>

        <p className="mt-7 font-display text-xl font-extrabold tracking-tight text-[#25214f] dark:text-slate-900">
          OXU <span className="text-brand-600">Digital</span>
        </p>
        <p className="mt-1.5 text-sm text-slate-500">{label}</p>

        {/* Cheksiz progress chizig'i */}
        <div className="mt-5 h-1 w-40 overflow-hidden rounded-full bg-slate-200/80" aria-hidden="true">
          <div className="oxu-bar h-full w-1/3 rounded-full bg-gradient-to-r from-brand-500 via-violet-400 to-indigo-500" />
        </div>
      </div>
    </main>
  )
}