import type { ReactNode } from 'react'
import KnowledgeIllustration from './KnowledgeIllustration'

/**
 * Sahifa sarlavhasi sidebar va header bilan bir xil fonda, kontent kengligini to'liq egallaydi.
 * `main` konteyner (@container) bo'lgani uchun tasma cqw orqali sahifa paddinglaridan chiqadi,
 * ichki padding esa matnni sahifa kontenti bilan bir chiziqda ushlaydi.
 * Sahifa o'ramining yuqori paddingi bo'lmasligi kerak.
 */
export default function PageHeading({
  eyebrow,
  title,
  description,
  icon,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <section className="theme-fixed relative isolate mx-[calc(50%_-_50cqw)] mb-4 overflow-hidden bg-gradient-to-b from-[#2a2559] via-[#28235a] to-[#1d1a47] px-[calc(50cqw_-_50%)] text-white">
      {/* Fon: nur dog'lari, nuqtali to'r va kitob-qalpoqcha illyustratsiyasi */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -left-24 -top-36 size-80 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="absolute -bottom-44 right-[18%] size-96 rounded-full bg-indigo-400/15 blur-3xl" />
        <div className="absolute left-[38%] -top-10 h-32 w-[36%] rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_92%)]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
        <div className="absolute bottom-0 right-0 aspect-[272/176] h-[78%] translate-x-[22%] text-violet-200 opacity-[0.13] sm:h-[92%] lg:right-[6%] lg:translate-x-0 lg:opacity-[0.22]">
          <KnowledgeIllustration bg="#221f4f" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-300/25 to-transparent" />
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3 py-4 sm:py-5 lg:py-6">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span className="relative hidden size-[52px] shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-400 to-indigo-500 text-white shadow-[0_14px_30px_-12px_rgba(139,92,246,0.7)] ring-1 ring-inset ring-white/25 sm:grid">
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/25 to-transparent" aria-hidden="true" />
              <span className="relative grid place-items-center">{icon}</span>
            </span>
          )}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[.16em] text-violet-100 backdrop-blur">
              <span className="size-1.5 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.9)]" aria-hidden="true" />
              {eyebrow}
            </span>
            <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-[2.1rem]">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100/75 sm:text-[15px]">{description}</p>
          </div>
        </div>
        {action && <div className="relative max-w-full">{action}</div>}
      </div>
    </section>
  )
}
