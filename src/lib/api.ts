const configuredApiOrigin = import.meta.env.VITE_API_ORIGIN?.trim()
const API_ORIGIN = import.meta.env.DEV
  ? ''
  : (configuredApiOrigin || '').replace(/\/+$/, '')
let accessToken: string | null = null
const inFlightRequests = new Map<string, Promise<unknown>>()
const allowedApiPath = /^\/(?:auth|academic-structure|attendance|users|groups|subjects|lessons|buildings|rooms|teacher-availability|telegram)(?:\/|$)/

export const REQUEST_STATE_EVENT = 'oxu:request-state'
export const API_ERROR_EVENT = 'oxu:api-error'

export interface ApiErrorNotification {
  status: number
  message: string
  route?: '/401' | '/403' | '/500'
}

let pendingRequests = 0

function setPendingRequests(next: number) {
  pendingRequests = Math.max(0, next)
  window.dispatchEvent(new CustomEvent<number>(REQUEST_STATE_EVENT, { detail: pendingRequests }))
}

function notifyApiError(status: number, message: string, route?: ApiErrorNotification['route']) {
  window.dispatchEvent(new CustomEvent<ApiErrorNotification>(API_ERROR_EVENT, {
    detail: { status, message, route },
  }))
}

function getErrorMessage(status: number, message?: string, auth = true) {
  if (status === 401) {
    return auth
      ? 'Kirish muddati tugagan. Hisobingizga qayta kiring.'
      : 'Email yoki parol noto‘g‘ri. Ma’lumotlarni tekshirib, qayta urinib ko‘ring.'
  }
  if (status === 403) return 'Bu amalni bajarish uchun ruxsatingiz yetarli emas.'
  if (status === 404) return 'Kerakli ma’lumot topilmadi.'
  if (status === 429) return 'Juda ko‘p urinish bo‘ldi. Biroz kutib, qayta urinib ko‘ring.'
  if (status >= 500) return 'Kutilmagan muammo yuz berdi. Birozdan keyin qayta urinib ko‘ring.'
  if (status === 400 && !message) return 'Kiritilgan ma’lumotlarni tekshirib, qayta urinib ko‘ring.'
  return message || 'So‘rovni bajarib bo‘lmadi. Qayta urinib ko‘ring.'
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function api<T = void>(
  path: string,
  options: RequestInit & { auth?: boolean; dedupe?: boolean } = {},
): Promise<T> {
  const { auth = true, dedupe = true, headers, ...requestOptions } = options
  const apiBase = new URL(API_ORIGIN || window.location.origin)
  let url: URL
  try {
    if (!path.startsWith('/') || path.startsWith('//')) {
      throw new Error('API path must be absolute and same-origin.')
    }
    url = new URL(path, apiBase)
  } catch {
    throw new ApiError('Noto‘g‘ri API manzili.', 400)
  }
  if (url.origin !== apiBase.origin || !allowedApiPath.test(url.pathname)) {
    throw new ApiError('Bu API manziliga so‘rov yuborishga ruxsat yo‘q.', 400)
  }

  const method = (requestOptions.method || 'GET').toUpperCase()
  const requestHeaders = new Headers()
  if (requestOptions.body) requestHeaders.set('Content-Type', 'application/json')
  if (auth && accessToken) requestHeaders.set('Authorization', `Bearer ${accessToken}`)
  new Headers(headers).forEach((value, name) => requestHeaders.set(name, value))
  const canShareRequest = dedupe
    && !requestOptions.signal
    && (method === 'GET' || ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method))
    && (requestOptions.body === undefined || requestOptions.body === null || typeof requestOptions.body === 'string')
  const requestKey = canShareRequest
    ? JSON.stringify([
      url.href,
      method,
      auth ? accessToken : null,
      Array.from(requestHeaders.entries()).sort(([left], [right]) => left.localeCompare(right)),
      requestOptions.body ?? null,
    ])
    : null

  if (requestKey) {
    const existingRequest = inFlightRequests.get(requestKey)
    if (existingRequest) return existingRequest as Promise<T>
  }

  const request = sendRequest<T>(url.href, method, requestHeaders, requestOptions, auth)
  if (!requestKey) return request

  const sharedRequest = request.finally(() => {
    if (inFlightRequests.get(requestKey) === sharedRequest) {
      inFlightRequests.delete(requestKey)
    }
  })
  inFlightRequests.set(requestKey, sharedRequest)
  return sharedRequest
}

async function sendRequest<T>(
  url: string,
  method: string,
  headers: Headers,
  requestOptions: RequestInit,
  auth: boolean,
): Promise<T> {
  setPendingRequests(pendingRequests + 1)
  try {
    let response: Response
    try {
      response = await fetch(url, {
        ...requestOptions,
        method,
        headers,
      })
    } catch {
      const message = 'Ulanishda vaqtinchalik muammo yuz berdi. Internet aloqasini tekshirib, qayta urinib ko‘ring.'
      notifyApiError(503, message, '/500')
      throw new ApiError(message, 0)
    }

    if (response.status === 204) return undefined as T
    const data = await response.json().catch(() => null) as { message?: string } | null
    if (!response.ok) {
      if (response.status === 401 && auth) {
        localStorage.removeItem('oxu-token')
        sessionStorage.removeItem('oxu-token')
        accessToken = null
      }
      const message = getErrorMessage(response.status, data?.message, auth)
      const route = response.status === 401 && auth
        ? '/401'
        : response.status === 403
          ? '/403'
          : response.status >= 500
            ? '/500'
            : undefined
      notifyApiError(response.status, message, route)
      throw new ApiError(message, response.status)
    }
    return data as T
  } finally {
    setPendingRequests(pendingRequests - 1)
  }
}

export async function apiDownload(path: string): Promise<Blob> {
  if (!path.startsWith('/lessons/my-workload/export?')) throw new ApiError('Noto‘g‘ri yuklab olish manzili.', 400)
  const base = new URL(API_ORIGIN || window.location.origin)
  const url = new URL(path, base)
  if (url.origin !== base.origin) throw new ApiError('Noto‘g‘ri yuklab olish manzili.', 400)
  const response = await fetch(url, { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} })
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string } | null
    throw new ApiError(getErrorMessage(response.status, body?.message), response.status)
  }
  return response.blob()
}
