import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react'

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue)
  const hydrated = useRef(false)

  useEffect(() => {
    let cancelled = false
    let stored: string | null = null
    try {
      stored = localStorage.getItem(key)
    } catch {}

    queueMicrotask(() => {
      if (cancelled) return
      try {
        if (stored !== null) setValue(JSON.parse(stored) as T)
      } catch {}
      hydrated.current = true
    })

    return () => {
      cancelled = true
    }
  }, [key])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])

  return [value, setValue]
}
