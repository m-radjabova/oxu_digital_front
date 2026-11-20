import { io, type Socket } from 'socket.io-client'

export type RealtimeEvent =
  | {
    type: 'lessons:changed'
    lessonId: string
    action: 'created' | 'updated' | 'deleted'
    slots: Array<{ weekStart: string; dayOfWeek: number; period: number }>
  }
  | { type: 'attendance:changed'; lessonId: string; date: string }
  | { type: 'teacher-availability:changed'; teacherId: string; weekStart: string }
  | { type: 'rooms:changed' }
  | { type: 'reconnected' }

type RealtimeListener = (event: RealtimeEvent) => void

const listeners = new Set<RealtimeListener>()
let activeSocket: Socket | null = null

function isRealtimeEvent(value: unknown): value is RealtimeEvent {
  if (!value || typeof value !== 'object' || !('type' in value)) return false
  const { type } = value
  return type === 'lessons:changed'
    || type === 'attendance:changed'
    || type === 'teacher-availability:changed'
    || type === 'rooms:changed'
}

function publish(event: RealtimeEvent) {
  for (const listener of listeners) listener(event)
}

export function subscribeToRealtime(listener: RealtimeListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function connectRealtime(token: string) {
  disconnectRealtime()
  const configuredOrigin = import.meta.env.VITE_API_ORIGIN?.trim()
  const socket = io(import.meta.env.DEV ? undefined : configuredOrigin || undefined, {
    path: '/socket.io',
    auth: { token },
    autoConnect: false,
    reconnection: true,
  })
  socket.on('data:changed', (value: unknown) => {
    if (isRealtimeEvent(value)) publish(value)
  })
  socket.on('connect', () => {
    publish({ type: 'reconnected' })
  })
  socket.on('disconnect', (reason) => {
    if (reason === 'io server disconnect') socket.connect()
  })
  socket.on('connect_error', (error) => {
    if (error.message === 'Authentication failed.' || error.message === 'Authentication required.') {
      socket.disconnect()
    }
  })

  activeSocket = socket
  socket.connect()

  return () => {
    if (activeSocket === socket) activeSocket = null
    socket.disconnect()
  }
}

export function disconnectRealtime() {
  activeSocket?.disconnect()
  activeSocket = null
}
