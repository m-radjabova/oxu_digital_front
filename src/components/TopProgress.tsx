import { useEffect, useState } from 'react'
import { REQUEST_STATE_EVENT } from '../lib/api'

export default function TopProgress() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    function onState(event: Event) {
      setActive((event as CustomEvent<number>).detail > 0)
    }
    window.addEventListener(REQUEST_STATE_EVENT, onState)
    return () => window.removeEventListener(REQUEST_STATE_EVENT, onState)
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 overflow-hidden transition-opacity duration-300 ${
        active ? 'opacity-100 delay-100' : 'opacity-0'
      }`}
    >
      <div className="h-full w-1/2 animate-progress-bar rounded-full bg-gradient-to-r from-brand-400 via-brand-600 to-indigo-500" />
    </div>
  )
}
