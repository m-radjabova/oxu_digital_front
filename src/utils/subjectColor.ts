/**
 * Fan rangini avtomatik generatsiya qilish.
 *
 * Ranglar OKLCH fazosida bir xil yorqinlik va to'yinganlikda olinadi (oq matn bilan yaxshi
 * o'qiladi), so'ng mavjud fanlar ranglaridan eng uzoq turgani tanlanadi. Teng variantlar
 * orasidan fan nomidan hisoblangan tusga eng yaqini olinadi — nomi har xil fanlar har xil rang oladi.
 *
 * MUHIM: backend'dagi `utils/subjectColor.js` bilan bir xil algoritm. Rang berilmasa server
 * ham xuddi shu rangni tanlaydi; bu yerda u forma ichida oldindan ko'rsatiladi.
 */

interface Lab {
  l: number
  a: number
  b: number
}

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/
const HUE_STEP = 5
/** Asosiy va zaxira yorqinlik: ranglar ko'payib ketsa, to'qroq variantlar ham ishlatiladi */
const LIGHTNESS_LEVELS = [0.6, 0.5]
const CHROMA = 0.15
/** OKLab masofasi shundan katta bo'lsa, ranglar yetarlicha farqli hisoblanadi */
const GOOD_DISTANCE = 0.08
const DEFAULT_HUE = 285

function srgbToLinear(value: number) {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(value: number) {
  return value <= 0.0031308 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055
}

function hexToOklab(hex: string): Lab {
  const number = Number.parseInt(hex.slice(1), 16)
  const [r, g, b] = [(number >> 16) & 255, (number >> 8) & 255, number & 255].map((value) => srgbToLinear(value / 255))
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  }
}

function oklabToLinearRgb({ l: lightness, a, b }: Lab) {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

/** Rang sRGB'ga sig'maguncha to'yinganlik kamaytiriladi */
function oklchToColor(lightness: number, chroma: number, hue: number) {
  const radians = (hue * Math.PI) / 180
  let currentChroma = chroma
  let lab: Lab = { l: lightness, a: chroma * Math.cos(radians), b: chroma * Math.sin(radians) }
  let rgb = oklabToLinearRgb(lab)
  while (currentChroma > 0 && rgb.some((value) => value < 0 || value > 1)) {
    currentChroma = Math.max(0, currentChroma - 0.005)
    lab = { l: lightness, a: currentChroma * Math.cos(radians), b: currentChroma * Math.sin(radians) }
    rgb = oklabToLinearRgb(lab)
  }
  const hex = `#${rgb
    .map((value) => Math.round(linearToSrgb(Math.min(1, Math.max(0, value))) * 255).toString(16).padStart(2, '0'))
    .join('')}`
  return { hex, lab: hexToOklab(hex) }
}

const CANDIDATES = LIGHTNESS_LEVELS.flatMap((lightness, level) =>
  Array.from({ length: 360 / HUE_STEP }, (_, index) => {
    const hue = index * HUE_STEP
    return { hue, level, ...oklchToColor(lightness, CHROMA, hue) }
  }),
)

function nameHue(name: string) {
  const text = String(name || '').trim().toLowerCase()
  if (!text) return DEFAULT_HUE
  let hash = 0
  for (const char of text) hash = (Math.imul(hash, 31) + (char.codePointAt(0) ?? 0)) >>> 0
  return hash % 360
}

function hueDistance(first: number, second: number) {
  const difference = Math.abs(first - second) % 360
  return Math.min(difference, 360 - difference)
}

function labDistance(first: Lab, second: Lab) {
  return Math.hypot(first.l - second.l, first.a - second.a, first.b - second.b)
}

/** Fan nomi va mavjud ranglar asosida `#rrggbb` rang qaytaradi */
export function generateSubjectColor(name: string, existingColors: string[] = []) {
  const used = existingColors.filter((color) => HEX_PATTERN.test(color || '')).map(hexToOklab)
  const preferredHue = nameHue(name)

  let best: { hex: string; score: number; level: number; offset: number } | null = null
  for (const candidate of CANDIDATES) {
    const distance = used.length ? Math.min(...used.map((color) => labDistance(candidate.lab, color))) : GOOD_DISTANCE
    const score = Math.min(distance, GOOD_DISTANCE)
    const offset = hueDistance(candidate.hue, preferredHue)
    if (
      !best ||
      score > best.score ||
      (score === best.score && (candidate.level < best.level || (candidate.level === best.level && offset < best.offset)))
    ) {
      best = { hex: candidate.hex, score, level: candidate.level, offset }
    }
  }
  return best!.hex
}
