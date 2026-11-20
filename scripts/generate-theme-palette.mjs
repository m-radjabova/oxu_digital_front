/**
 * Tungi rejim palitrasini generatsiya qiladi: `src/styles/theme-palette.css`.
 *
 * G'oya: komponentlar oddiy Tailwind ranglarini (`bg-white` o'rniga `bg-surface`,
 * `text-slate-500`, `bg-rose-50`, `text-emerald-700` ...) ishlatadi. Tungi rejimda
 * shu rang o'zgaruvchilarining o'zi qayta belgilanadi, shuning uchun yangi bo'limlarga
 * `dark:` klasslarini yozish shart emas — ular avtomatik moslashadi.
 *
 *  - neytral shkalalar (slate, gray, ...) to'liq teskari va binafsha-to'q tusga o'giriladi;
 *  - rangli shkalalarda och fonlar (50–200) to'q tus, to'q matnlar (600–950) esa och tus oladi;
 *    300–500 o'zgarmaydi (nuqtalar, ikonkalar, ramkalar).
 *
 * Tungi ranglarni sozlash uchun shu fayldagi qiymatlarni o'zgartiring va
 * `npm run theme:palette` ni ishga tushiring.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const OUTPUT = resolve(root, 'src/styles/theme-palette.css')

const NEUTRALS = ['slate', 'gray', 'zinc', 'neutral', 'stone']
const HUES = [
  'brand', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

/** Calm blue-gray surfaces; strong purple is reserved for actions. */
const DARK_NEUTRAL = {
  50: '#1c2432',
  100: '#252e3e',
  200: '#344055',
  300: '#4b5b73',
  400: '#9aaac0',
  500: '#adbad0',
  600: '#c0ccdd',
  700: '#d3ddeb',
  800: '#e4eaf3',
  900: '#f1f5fb',
  950: '#f8fafc',
}

const SEMANTIC = {
  // Sahifa foni va kartalar/inputlar/modallar foni
  canvas: { light: '#f3f4fa', dark: '#101521' },
  surface: { light: '#ffffff', dark: '#192130' },
  'action-primary': { light: '#6a3ce0', dark: '#7452e8' },
  'action-primary-hover': { light: '#582cc0', dark: '#6845d5' },
  'action-danger': { light: '#e11d48', dark: '#be2448' },
  'action-danger-hover': { light: '#be123c', dark: '#a91c3e' },
  'action-success': { light: '#059669', dark: '#047857' },
  'action-success-hover': { light: '#047857', dark: '#066348' },
}

/** Rang bo'lmagan mavzu o'zgaruvchilari (utility yaratmaydi). shadow-card/pop soyalari shular orqali chiziladi */
const VARS = {
  'shadow-ink-faint': { light: 'rgb(15 23 42 / 0.04)', dark: 'rgb(4 3 16 / 0.22)' },
  'shadow-ink-soft': { light: 'rgb(15 23 42 / 0.18)', dark: 'rgb(4 3 16 / 0.55)' },
  'shadow-ink-medium': { light: 'rgb(15 23 42 / 0.25)', dark: 'rgb(4 3 16 / 0.65)' },
  'shadow-ink-strong': { light: 'rgb(15 23 42 / 0.32)', dark: 'rgb(4 3 16 / 0.75)' },
}

/** Rangli shkalada tungi qiymat: och fonlar 500-tusdan to'q fonga aralashtiriladi, to'q matnlar ochiladi */
function darkHue(light, shade) {
  const base = SEMANTIC.surface.dark
  switch (shade) {
    case 50: return `color-mix(in oklab, ${light[500]} 10%, ${base})`
    case 100: return `color-mix(in oklab, ${light[500]} 17%, ${base})`
    case 200: return `color-mix(in oklab, ${light[500]} 28%, ${base})`
    case 600: return light[500]
    case 700: return light[300]
    case 800: return light[200]
    case 900: return light[100]
    case 950: return light[50]
    default: return null
  }
}

function readPalette(css) {
  const palette = {}
  for (const [, name, shade, value] of css.matchAll(/--color-([a-z]+)-(\d+):\s*([^;]+);/g)) {
    ;(palette[name] ??= {})[Number(shade)] = value.trim()
  }
  return palette
}

const palette = {
  ...readPalette(readFileSync(require.resolve('tailwindcss/theme.css'), 'utf8')),
  ...readPalette(readFileSync(resolve(root, 'src/index.css'), 'utf8')),
}

const lightDecls = []
const darkDecls = []
const rootDecls = []

for (const [name, values] of Object.entries(VARS)) {
  rootDecls.push(`--${name}: ${values.light};`)
  lightDecls.push(`--${name}: ${values.light};`)
  darkDecls.push(`--${name}: ${values.dark};`)
}

for (const [name, values] of Object.entries(SEMANTIC)) {
  lightDecls.push(`--color-${name}: ${values.light};`)
  darkDecls.push(`--color-${name}: ${values.dark};`)
}

for (const name of NEUTRALS) {
  const light = palette[name]
  if (!light) throw new Error(`Palitra topilmadi: ${name}`)
  for (const shade of Object.keys(DARK_NEUTRAL).map(Number)) {
    lightDecls.push(`--color-${name}-${shade}: ${light[shade]};`)
    darkDecls.push(`--color-${name}-${shade}: ${DARK_NEUTRAL[shade]};`)
  }
}

for (const name of HUES) {
  const light = palette[name]
  if (!light) throw new Error(`Palitra topilmadi: ${name}`)
  for (const shade of [50, 100, 200, 600, 700, 800, 900, 950]) {
    if (!light[shade]) continue
    lightDecls.push(`--color-${name}-${shade}: ${light[shade]};`)
    darkDecls.push(`--color-${name}-${shade}: ${darkHue(light, shade)};`)
  }
}

const indent = (decls) => decls.map((decl) => `    ${decl}`).join('\n')

const output = `/*
 * AVTOMATIK GENERATSIYA QILINGAN — qo'lda tahrirlamang.
 * Manba: scripts/generate-theme-palette.mjs  (npm run theme:palette)
 *
 * .dark              — tungi rejim (html elementida, ThemeProvider qo'yadi)
 * .theme-fixed       — har doim bir xil ko'rinadigan to'q brend bloklar (sidebar, header, hero...)
 * .theme-adaptive    — .theme-fixed ichidagi, yana mavzuga ergashadigan blok (masalan, dropdown)
 */
@layer base {
  :root {
    color-scheme: light;
${indent(rootDecls)}
  }

  .dark,
  .dark .theme-adaptive {
    color-scheme: dark;
${indent(darkDecls)}
  }

  .dark .theme-fixed {
    color-scheme: light;
${indent(lightDecls)}
  }
}
`

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, output)
console.log(`✓ ${OUTPUT.replace(`${root}/`, '')} (${darkDecls.length} ta o'zgaruvchi)`)
