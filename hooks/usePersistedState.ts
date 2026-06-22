import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react'

export function usePersistedState<T>(
  key: string,
  defaultValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue)
  const hydrated = useRef(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) setValue(JSON.parse(stored) as T)
    } catch {}
    hydrated.current = true
  }, [key])

  useEffect(() => {
    if (!hydrated.current) return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {}
  }, [key, value])

  return [value, setValue]
}
