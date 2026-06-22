'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { usePersistedState } from '@/hooks/usePersistedState'
import { ThemeToggle } from '@/components/ThemeToggle'

type Feeling =
  | 'energetic'
  | 'tired'
  | 'hungry'
  | 'relaxed'
  | 'adventurous'
  | 'romantic'
  | 'curious'

type PlaceCategory =
  | 'Restaurant'
  | 'Activity'
  | 'Trek / Hike'
  | 'Attraction'
  | 'Cafe / Bar'
  | 'Other'

interface VisitedPlace {
  id: string
  name: string
  category: PlaceCategory
  duration: string
}

interface Weather {
  location: string
  temp: number
  feelsLike: number | null
  condition: string
  humidity: number
  wind: number
  icon: string | null
}

// UC13: Eine einzelne Empfehlung
interface Suggestion {
  id: string
  content: string
  skipped: boolean
  isError?: boolean
}

const PLACE_CATEGORIES: PlaceCategory[] = [
  'Restaurant',
  'Activity',
  'Trek / Hike',
  'Attraction',
  'Cafe / Bar',
  'Other',
]

const FEELINGS: {
  key: Feeling
  emoji: string
  label: string
  className: string
}[] = [
  { key: 'energetic', emoji: '⚡', label: 'Energetic', className: 'border-amber-200 bg-amber-50 text-amber-700' },
  { key: 'tired', emoji: '😴', label: 'Tired', className: 'border-sky-200 bg-sky-50 text-sky-700' },
  { key: 'hungry', emoji: '🍽️', label: 'Hungry', className: 'border-orange-200 bg-orange-50 text-orange-700' },
  { key: 'relaxed', emoji: '☕', label: 'Relaxed', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { key: 'adventurous', emoji: '🏔️', label: 'Adventurous', className: 'border-red-200 bg-red-50 text-red-700' },
  { key: 'romantic', emoji: '💕', label: 'Romantic', className: 'border-pink-200 bg-pink-50 text-pink-700' },
  { key: 'curious', emoji: '🔍', label: 'Curious', className: 'border-violet-200 bg-violet-50 text-violet-700' },
]

const PREFERENCE_TAGS = [
  'Beach & Coast',
  'Mountains & Hiking',
  'City & Urban',
  'Cultural & Historic',
  'Food & Culinary',
  'Adventure & Extreme',
  'Relaxation & Spa',
  'Nightlife & Party',
  'Nature & Wildlife',
  'Art & Architecture',
  'Shopping',
  'Romantic Getaway',
]

const BUDGET_OPTIONS = ['Budget', 'Mid-Range', 'Luxury']

const RADIUS_OPTIONS = [
  'Inside current city',
  'Within 5 km',
  'Within 25 km',
  'Within 100 km',
  'Within 250 km',
]

function Icon({
  name,
  className = 'w-4 h-4',
}: {
  name: 'arrow-left' | 'compass' | 'map-pin' | 'plus' | 'sparkles' | 'refresh' | 'x' | 'clock' | 'skip' | 'check' | 'locate'
  className?: string
}) {
  const paths = {
    'arrow-left': <path d="M19 12H5m7-7-7 7 7 7" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m16 8-2 6-6 2 2-6 6-2Z" />
      </>
    ),
    'map-pin': (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    sparkles: <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 12 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15ZM5 14l.8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Z" />,
    refresh: (
      <>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
      </>
    ),
    x: <path d="M18 6 6 18M6 6l12 12" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    // UC13: neue Icons
    skip: <path d="M5 12h14M12 5l7 7-7 7" />,
    check: <path d="M20 6L9 17l-5-5" />,
    locate: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function SelectableChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl border text-sm transition-colors ${
        selected
          ? 'bg-[#7469C4] text-white border-[#7469C4] shadow-sm'
          : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-gray-700 hover:border-[#9B92D8] hover:bg-[#F2F0FD] dark:hover:bg-[#1E1B33]'
      }`}
    >
      {label}
    </button>
  )
}

function CustomChipInput({
  value,
  onChange,
  onConfirm,
  onCancel,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  placeholder: string
}) {
  return (
    <div className="flex gap-2 mt-2 w-full">
      <input
        autoFocus
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') onConfirm()
          if (e.key === 'Escape') onCancel()
        }}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] dark:text-gray-100 placeholder:text-slate-400"
      />
      <button
        type="button"
        disabled={!value.trim()}
        onClick={onConfirm}
        className="px-4 py-2 bg-[#7469C4] text-white text-sm rounded-xl hover:bg-[#5E54A8] disabled:opacity-40 transition-colors font-medium"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-gray-700 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <Icon name="x" className="w-4 h-4" />
      </button>
    </div>
  )
}

function PlaceRow({ place, onRemove }: { place: VisitedPlace; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#F2F0FD] dark:bg-[#1E1B33] flex items-center justify-center text-[#7469C4] shrink-0">
          <Icon name="map-pin" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium truncate">{place.name}</p>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-[#F2F0FD] dark:bg-[#1E1B33] text-[#7469C4] font-medium">
              {place.category}
            </span>
            <span className="flex items-center gap-1">
              <Icon name="clock" className="w-3 h-3" />
              {place.duration}
            </span>
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        title="Remove"
        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Icon name="x" className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// UC13: Hilfsfunktion — teilt Gemini-Text in 3 Empfehlungen auf
function splitSuggestions(text: string): string[] {
  // Strip any intro sentence(s) before the first numbered item
  const firstNumberedIndex = text.search(/(?:^|\n)(##\s*\d+\.|\*\*\d+\.|\d+\.\s+\*\*|\d+\.\s+\S)/)
  const body = firstNumberedIndex > 0 ? text.slice(firstNumberedIndex).trim() : text

  // Versuche bei nummerierten Überschriften zu trennen (## 1. oder **1.** oder 1.)
  const byNumberedHeading = body.split(/\n(?=##\s*\d+\.|\*\*\d+\.|(?<!\S)\d+\.\s+\*\*)/)
  if (byNumberedHeading.length >= 3) {
    return byNumberedHeading.slice(0, 3).map(s => s.trim()).filter(Boolean)
  }

  // Fallback: bei doppeltem Zeilenumbruch + Ziffer trennen
  const byNewline = body.split(/\n{2,}(?=\d+\.)/)
  if (byNewline.length >= 3) {
    return byNewline.slice(0, 3).map(s => s.trim()).filter(Boolean)
  }

  // Letzter Fallback: gesamten Text als eine Karte
  return [body]
}

function getWeatherIcon(weather: Weather | null) {
  const code = weather?.icon?.slice(0, 2)
  if (code === '01') return { symbol: '☀️', label: 'Sunny' }
  if (code === '02') return { symbol: '🌤️', label: 'Partly cloudy' }
  if (code === '03' || code === '04') return { symbol: '☁️', label: 'Cloudy' }
  if (code === '09' || code === '10') return { symbol: '🌧️', label: 'Rainy' }
  if (code === '11') return { symbol: '⛈️', label: 'Thunderstorm' }
  if (code === '13') return { symbol: '❄️', label: 'Snowy' }
  if (code === '50') return { symbol: '🌫️', label: 'Foggy' }

  const condition = weather?.condition.toLowerCase() ?? ''
  if (condition.includes('rain') || condition.includes('drizzle')) return { symbol: '🌧️', label: 'Rainy' }
  if (condition.includes('clear') || condition.includes('sun')) return { symbol: '☀️', label: 'Sunny' }
  if (condition.includes('snow')) return { symbol: '❄️', label: 'Snowy' }
  if (condition.includes('storm') || condition.includes('thunder')) return { symbol: '⛈️', label: 'Thunderstorm' }
  if (condition.includes('mist') || condition.includes('fog') || condition.includes('haze')) return { symbol: '🌫️', label: 'Foggy' }
  return { symbol: '☁️', label: weather ? 'Cloudy' : 'Weather unavailable' }
}

export default function TravelPage() {
  const [visitedPlaces, setVisitedPlaces] = usePersistedState<VisitedPlace[]>('travel_visited_places', [])
  const [placeInput, setPlaceInput] = useState('')
  const [durationInput, setDurationInput] = useState('')
  const [categoryInput, setCategoryInput] = useState<PlaceCategory>('Restaurant')
  const [feeling, setFeeling] = usePersistedState<string | null>('travel_feeling', null)
  const [selectedPrefs, setSelectedPrefs] = usePersistedState<string[]>('travel_prefs', [])
  const [selectedRadius, setSelectedRadius] = usePersistedState<string>('travel_radius', RADIUS_OPTIONS[0])
  const [selectedBudget, setSelectedBudget] = usePersistedState<string | null>('travel_budget', null)
  const [currentLocation, setCurrentLocation] = usePersistedState<string>('travel_location', '')
  const [additionalNotes, setAdditionalNotes] = usePersistedState<string>('travel_notes', '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [locating, setLocating] = useState(false)
  const [savedSuggestions, setSavedSuggestions] = usePersistedState<Suggestion[]>('travel_saved_suggestions', [])
  const [showSaved, setShowSaved] = useState(false)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [isWeatherLoading, setIsWeatherLoading] = useState(false)
  const skipWeatherLookupFor = useRef<string | null>(null)

  // UC13: Empfehlungen als einzelne Karten statt einem String
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [whySection, setWhySection] = useState<string>('')
  const [consecutiveSkips, setConsecutiveSkips] = useState(0)
  const [showPrefsChangedHint, setShowPrefsChangedHint] = useState(false)

  const [showCustomRadius, setShowCustomRadius] = useState(false)
  const [customRadiusInput, setCustomRadiusInput] = useState('')
  const [showCustomFeeling, setShowCustomFeeling] = useState(false)
  const [customFeelingInput, setCustomFeelingInput] = useState('')
  const [showCustomPref, setShowCustomPref] = useState(false)
  const [customPrefInput, setCustomPrefInput] = useState('')

  const canGenerate = currentLocation.trim().length > 0 && feeling !== null && selectedPrefs.length > 0

  // UC13: Zählt wie viele Empfehlungen noch aktiv (nicht übersprungen) sind
  const activeSuggestions = suggestions.filter(s => !s.skipped)
  const weatherIcon = getWeatherIcon(weather)

  useEffect(() => {
    const location = currentLocation.trim()
    if (location.length < 2) return
    if (skipWeatherLookupFor.current === location) {
      skipWeatherLookupFor.current = null
      return
    }

    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsWeatherLoading(true)
      setWeatherError(null)
      try {
        const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`, {
          signal: controller.signal,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Could not load current weather.')
        setWeather(data as Weather)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setWeather(null)
        setWeatherError(error instanceof Error ? error.message : 'Could not load current weather.')
      } finally {
        if (!controller.signal.aborted) setIsWeatherLoading(false)
      }
    }, 600)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [currentLocation])

  function handleLocationChange(value: string) {
    setCurrentLocation(value)
    setWeather(null)
    setWeatherError(null)
    setIsWeatherLoading(false)
  }

  function addPlace() {
    if (!placeInput.trim()) return
    setVisitedPlaces(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: placeInput.trim(),
        category: categoryInput,
        duration: durationInput.trim() || 'Not specified',
      },
    ])
    setPlaceInput('')
    setDurationInput('')
  }

  function togglePref(pref: string) {
    setSelectedPrefs(prev =>
      prev.includes(pref) ? prev.filter(item => item !== pref) : [...prev, pref]
    )
  }

  // UC13: Empfehlung überspringen
  function handleSave(suggestion: Suggestion) {
    setSavedSuggestions(prev =>
      prev.some(s => s.id === suggestion.id) ? prev : [...prev, suggestion]
    )
  }

  function isSaved(id: string) {
    return savedSuggestions.some(s => s.id === id)
  }

  async function handleSkip(id: string) {
    setSuggestions(prev =>
      prev.map(s => s.id === id ? { ...s, skipped: true } : s)
    )

    const newSkips = consecutiveSkips + 1
    setConsecutiveSkips(newSkips)

    // Nach 3 aufeinanderfolgenden Überspringungen: Hinweis anzeigen
    if (newSkips >= 3) {
      setShowPrefsChangedHint(true)
      setConsecutiveSkips(0)
      return
    }

    // Neue einzelne Empfehlung nachladen
    await fetchReplacementSuggestion()
  }

  // UC13: Eine neue Ersatz-Empfehlung von Gemini laden
  const fetchReplacementSuggestion = useCallback(async () => {
    setIsGenerating(true)
    const destination = currentLocation.trim()

    const skippedTexts = suggestions
      .filter(s => s.skipped)
      .map(s => s.content)
      .join(' | ')

    const prompt = `Based on my travel preferences, suggest ONE new place or experience near ${destination}.

IMPORTANT: Do NOT suggest anything similar to these already skipped suggestions: ${skippedTexts}

Also do not suggest any of these visited places:
${visitedPlaces.length > 0 ? visitedPlaces.map(p => `- ${p.name}`).join('\n') : '- None'}

How I am feeling: ${feeling}
What I am looking for: ${selectedPrefs.join(', ')}
Budget: ${selectedBudget || 'Mid-Range'}
Radius: ${selectedRadius}
${weather ? `Weather: ${weather.temp}°C, ${weather.condition}` : 'Current weather is unavailable.'}

Give me exactly ONE new suggestion (different from everything above) with:
- Why it matches my mood
- Best time to go
- What to do there
- Distance from ${destination}
- Budget range
- One practical tip`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          preferences: {
            origin: destination,
            destination,
            budget: selectedBudget === 'Luxury' ? 'luxury' : selectedBudget === 'Budget' ? 'tight' : 'medium',
            activities: selectedPrefs.join(', '),
            travelStyle: feeling || 'not specified',
          },
        }),
      })
      const data = await response.json()
      if (response.ok && data.content) {
        const newSuggestion: Suggestion = {
          id: crypto.randomUUID(),
          content: data.content,
          skipped: false,
        }
        setSuggestions(prev => [...prev, newSuggestion])
      }
    } catch {
      // Silently fail
    } finally {
      setIsGenerating(false)
    }
  }, [currentLocation, feeling, selectedPrefs, selectedBudget, selectedRadius, suggestions, visitedPlaces, weather])

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setSuggestions([])
    setWhySection('')
    setConsecutiveSkips(0)
    setShowPrefsChangedHint(false)

    const destination = currentLocation.trim()
    const prompt = `Based on my travel history and current preferences, suggest where I should go next from ${destination}.

IMPORTANT RADIUS RULE: Only recommend real places within "${selectedRadius}" from ${destination}.

Local spots I have already visited. Do not recommend any of these:
${visitedPlaces.length > 0 ? visitedPlaces.map(place => `- ${place.name} [${place.category}], spent ${place.duration}`).join('\n') : '- None specified'}

How I am feeling right now: ${feeling}

What I am looking for next:
${selectedPrefs.map(pref => `- ${pref}`).join('\n')}

Budget level: ${selectedBudget || 'Mid-Range'}
Recommendation radius: ${selectedRadius}
${additionalNotes ? `Additional notes: ${additionalNotes}` : ''}

${weather ? `Current weather in ${weather.location}: ${weather.temp} C, ${weather.condition}, ${weather.humidity}% humidity, wind ${weather.wind} km/h` : 'Current local weather is unavailable. Do not assume specific conditions.'}

Suggest exactly 3 places or experiences. Number each one clearly as "1.", "2.", "3." on a new line. For each include:
- Why it matches my mood and preferences
- Best time to go today
- What to do there
- Approximate distance from ${destination}
- Estimated budget range
- One practical tip

After the 3 suggestions, add a short section titled "## Why These Match You".`

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          preferences: {
            origin: destination,
            destination,
            groupSize: 'not specified',
            duration: 'not specified',
            budget: selectedBudget === 'Luxury' ? 'luxury' : selectedBudget === 'Budget' ? 'tight' : 'medium',
            accommodation: 'not specified',
            foodType: selectedPrefs.includes('Food & Culinary') ? 'local cuisine' : 'not specified',
            allergies: 'none',
            activities: `${selectedPrefs.join(', ')}. Recommendation radius: ${selectedRadius}`,
            travelStyle: feeling || 'not specified',
          },
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        setSuggestions([{
          id: crypto.randomUUID(),
          content: "WanderAI couldn't generate suggestions right now. Please try again in a moment.",
          skipped: false,
          isError: true,
        }])
        return
      }

      const fullText: string = data.content || ''

      // UC13: "Why These Match You" Abschnitt trennen
      const whyMatch = fullText.match(/##\s*Why These Match You[\s\S]*/i)
      const mainText = whyMatch ? fullText.slice(0, whyMatch.index) : fullText
      setWhySection(whyMatch ? whyMatch[0] : '')

      // UC13: In 3 Einzelkarten aufteilen
      const parts = splitSuggestions(mainText)
      setSuggestions(parts.map(content => ({
        id: crypto.randomUUID(),
        content,
        skipped: false,
      })))
    } catch {
      setSuggestions([{
        id: crypto.randomUUID(),
        content: "WanderAI couldn't generate suggestions right now. Please try again in a moment.",
        skipped: false,
        isError: true,
      }])
    } finally {
      setIsGenerating(false)
    }
  }, [
    additionalNotes,
    canGenerate,
    currentLocation,
    feeling,
    selectedBudget,
    selectedPrefs,
    selectedRadius,
    visitedPlaces,
    weather,
  ])

  function resetAll() {
    setVisitedPlaces([])
    setPlaceInput('')
    setDurationInput('')
    setCategoryInput('Restaurant')
    setFeeling(null)
    setSelectedPrefs([])
    setSelectedRadius(RADIUS_OPTIONS[0])
    setSelectedBudget(null)
    setCurrentLocation('')
    setAdditionalNotes('')
    setSuggestions([])
    setWhySection('')
    setConsecutiveSkips(0)
    setShowPrefsChangedHint(false)
    setWeather(null)
    setWeatherError(null)
    setShowCustomRadius(false)
    setCustomRadiusInput('')
    setShowCustomFeeling(false)
    setCustomFeelingInput('')
    setShowCustomPref(false)
    setCustomPrefInput('')
  }

  const hasSuggestions = suggestions.length > 0

  // Markdown-Render-Komponenten (wiederverwendet)
  const mdComponents = {
    h1: ({ children }: { children?: React.ReactNode }) => <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>,
    h2: ({ children }: { children?: React.ReactNode }) => <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>,
    h3: ({ children }: { children?: React.ReactNode }) => <h4 className="text-base font-semibold text-[#5E54A8] mt-3 mb-1">{children}</h4>,
    p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
    strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  }

  async function getDeviceLocation() {
    if (!navigator.geolocation) {
      setWeatherError('Location services are not supported by this browser.')
      return
    }
    setLocating(true)
    setIsWeatherLoading(true)
    setWeatherError(null)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const params = new URLSearchParams({ lat: String(latitude), lon: String(longitude) })
          const res = await fetch(`/api/weather?${params}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Could not load weather for your location.')

          const currentWeather = data as Weather
          skipWeatherLookupFor.current = currentWeather.location
          setCurrentLocation(currentWeather.location)
          setWeather(currentWeather)
        } catch (error) {
          setWeather(null)
          setWeatherError(error instanceof Error ? error.message : 'Could not load weather for your location.')
        } finally {
          setLocating(false)
          setIsWeatherLoading(false)
        }
      },
      error => {
        setWeatherError(
          error.code === error.PERMISSION_DENIED
            ? 'Location permission was denied. Allow it or enter a city.'
            : error.code === error.TIMEOUT
              ? 'Finding your location timed out. Please try again.'
              : 'Your current location could not be determined.'
        )
        setWeather(null)
        setLocating(false)
        setIsWeatherLoading(false)
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4FD] dark:bg-gray-950 text-slate-900 dark:text-gray-100">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-slate-200 dark:border-gray-800 px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors" aria-label="Back home">
              <Icon name="arrow-left" className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-[#7469C4] flex items-center justify-center text-white shrink-0">
              <Icon name="compass" className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Explore Next</p>
              <p className="text-xs text-slate-400 truncate">Find a fresh destination from where you are</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setShowSaved(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2F0FD] dark:bg-[#1E1B33] text-[#5E54A8] dark:text-[#9B92D8] text-xs font-semibold hover:bg-[#E7E4FA] dark:hover:bg-[#252240] transition-colors shrink-0"
            >
              <Icon name="check" className="w-3.5 h-3.5" />
              Saved
              {savedSuggestions.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#7469C4] text-white text-[10px] font-bold flex items-center justify-center">
                  {savedSuggestions.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2F0FD] dark:bg-[#1E1B33] text-[#5E54A8] dark:text-[#9B92D8] text-xs font-semibold hover:bg-[#E7E4FA] dark:hover:bg-[#252240] transition-colors shrink-0"
            >
              <Icon name="refresh" className="w-3.5 h-3.5" />
              Reset
            </button>
            <Link
              href="/plan"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F2F0FD] dark:bg-[#1E1B33] text-[#5E54A8] dark:text-[#9B92D8] rounded-xl hover:bg-[#E7E4FA] dark:hover:bg-[#252240] transition-colors text-sm font-medium"
            >
              <Icon name="sparkles" />
              Plan a Trip
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-8 pb-24">
        <section className="relative rounded-2xl overflow-hidden h-48 md:h-56 bg-slate-800">
          <img
            src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=1600"
            alt="Scenic travel landscape"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          <div className="absolute bottom-5 left-5 right-5">
            <h1 className="text-white text-2xl md:text-3xl font-bold">
              Discover Your Next Adventure
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Tell WanderAI what you have done and what you want now.
            </p>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-slate-100 dark:border-gray-800 flex items-center justify-between shadow-sm" aria-live="polite">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/40 flex items-center justify-center text-2xl"
              role="img"
              aria-label={weatherIcon.label}
              title={weatherIcon.label}
            >
              {weatherIcon.symbol}
            </div>
            <div>
              <p className="text-sm text-slate-500">
                {weather ? `Current Weather · ${weather.location}` : 'Current Weather'}
              </p>
              {isWeatherLoading ? (
                <p className="text-sm text-slate-500">Loading current conditions…</p>
              ) : weather ? (
                <p className="text-xl text-slate-800 dark:text-slate-200 font-bold">
                  {weather.temp}°C <span className="text-sm text-slate-500 font-normal">{weather.condition}</span>
                </p>
              ) : (
                <p className={`text-sm ${weatherError ? 'text-red-600' : 'text-slate-400'}`}>
                  {weatherError || 'Enter a destination or use your current location.'}
                </p>
              )}
            </div>
          </div>
          {weather && (
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
              <span>{weather.humidity}% humidity</span>
              <span>{weather.wind} km/h wind</span>
            </div>
          )}
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block font-semibold">
            Your Current Destination
          </label>
          <div className="relative">
            <Icon name="map-pin" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={currentLocation}
              onChange={event => handleLocationChange(event.target.value)}
              placeholder="e.g. Shibuya, Tokyo or Paris, France..."
              className="w-full pl-10 pr-11 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm dark:text-gray-100"
            />
            <button
              type="button"
              onClick={getDeviceLocation}
              disabled={locating}
              title="Use my location"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#7469C4] transition-colors disabled:opacity-40"
            >
              {locating ? (
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin block" />
              ) : (
                <Icon name="locate" className="w-4 h-4" />
              )}
            </button>
          </div>
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-3 block font-semibold">
            Recommendation Radius
          </label>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map(option => (
              <SelectableChip
                key={option}
                label={option}
                selected={selectedRadius === option && !showCustomRadius && RADIUS_OPTIONS.includes(selectedRadius)}
                onClick={() => { setSelectedRadius(option); setShowCustomRadius(false); setCustomRadiusInput('') }}
              />
            ))}
            {!RADIUS_OPTIONS.includes(selectedRadius) && !showCustomRadius && (
              <button
                type="button"
                onClick={() => { setShowCustomRadius(true); setCustomRadiusInput(selectedRadius) }}
                className="px-3.5 py-2 rounded-xl border text-sm bg-[#7469C4] text-white border-[#7469C4] flex items-center gap-1.5"
              >
                {selectedRadius}
                <Icon name="x" className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCustomRadius(v => !v)}
              className={`px-3.5 py-2 rounded-xl border text-sm transition-colors ${
                showCustomRadius
                  ? 'bg-[#7469C4] text-white border-[#7469C4]'
                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-gray-700 hover:border-[#9B92D8] hover:bg-[#F2F0FD] dark:hover:bg-[#1E1B33]'
              }`}
            >
              Other...
            </button>
          </div>
          {showCustomRadius && (
            <CustomChipInput
              value={customRadiusInput}
              onChange={setCustomRadiusInput}
              onConfirm={() => {
                const val = customRadiusInput.trim()
                if (!val) return
                setSelectedRadius(val)
                setShowCustomRadius(false)
                setCustomRadiusInput('')
              }}
              onCancel={() => { setShowCustomRadius(false); setCustomRadiusInput('') }}
              placeholder="e.g. Within 10 km, Walking distance…"
            />
          )}
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block font-semibold">
            Places You Have Been <span className="text-slate-300 normal-case">(we will skip these)</span>
          </label>
          <p className="text-xs text-slate-400 mb-3">
            Add restaurants, attractions, hikes, or activities near your current location.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1 relative">
              <Icon name="map-pin" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={placeInput}
                onChange={event => setPlaceInput(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && addPlace()}
                placeholder="Spot name"
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm dark:text-gray-100"
              />
            </div>
            <select
              value={categoryInput}
              onChange={event => setCategoryInput(event.target.value as PlaceCategory)}
              className="sm:w-44 px-3 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm dark:text-gray-100"
            >
              {PLACE_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <input
              value={durationInput}
              onChange={event => setDurationInput(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && addPlace()}
              placeholder="Duration"
              className="sm:w-40 px-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm dark:text-gray-100"
            />
            <button
              type="button"
              onClick={addPlace}
              disabled={!placeInput.trim()}
              className="px-4 py-3 bg-[#7469C4] text-white rounded-xl hover:bg-[#5E54A8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              <Icon name="plus" className="w-5 h-5" />
              <span className="sm:hidden text-sm">Add spot</span>
            </button>
          </div>

          {visitedPlaces.length > 0 ? (
            <div className="bg-slate-50 dark:bg-gray-900 border border-slate-100 dark:border-gray-800 rounded-xl p-3">
              <p className="text-xs text-slate-400 mb-2 font-medium">
                Travel history ({visitedPlaces.length}) excluded from recommendations
              </p>
              <div className="flex flex-col gap-2">
                {visitedPlaces.map(place => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    onRemove={() => setVisitedPlaces(prev => prev.filter(item => item.id !== place.id))}
                  />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 italic py-2">No places added yet. That is okay.</p>
          )}
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-3 block font-semibold">
            How Are You Feeling Right Now? <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {FEELINGS.map(option => {
              const selected = feeling === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => { setFeeling(option.key); setShowCustomFeeling(false); setCustomFeelingInput('') }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    selected ? option.className : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-slate-200 dark:hover:border-gray-600 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => setShowCustomFeeling(v => !v)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                showCustomFeeling || (feeling !== null && !FEELINGS.find(f => f.key === feeling))
                  ? 'border-violet-300 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300'
                  : 'bg-white dark:bg-gray-800 border-slate-100 dark:border-gray-700 hover:border-slate-200 dark:hover:border-gray-600 text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="text-2xl">✏️</span>
              <span className="text-xs font-medium">
                {feeling && !FEELINGS.find(f => f.key === feeling) ? feeling : 'Other'}
              </span>
            </button>
          </div>
          {showCustomFeeling && (
            <CustomChipInput
              value={customFeelingInput}
              onChange={setCustomFeelingInput}
              onConfirm={() => {
                const val = customFeelingInput.trim()
                if (!val) return
                setFeeling(val)
                setShowCustomFeeling(false)
                setCustomFeelingInput('')
              }}
              onCancel={() => { setShowCustomFeeling(false); setCustomFeelingInput('') }}
              placeholder="e.g. Nostalgic, Excited, Reflective…"
            />
          )}
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-3 block font-semibold">
            What Are You Looking For? <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PREFERENCE_TAGS.map(tag => (
              <SelectableChip
                key={tag}
                label={tag}
                selected={selectedPrefs.includes(tag)}
                onClick={() => togglePref(tag)}
              />
            ))}
            {selectedPrefs.filter(p => !PREFERENCE_TAGS.includes(p)).map(tag => (
              <SelectableChip key={tag} label={tag} selected onClick={() => togglePref(tag)} />
            ))}
            <button
              type="button"
              onClick={() => setShowCustomPref(v => !v)}
              className={`px-3.5 py-2 rounded-xl border text-sm transition-colors ${
                showCustomPref
                  ? 'bg-[#7469C4] text-white border-[#7469C4]'
                  : 'bg-white dark:bg-gray-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-gray-700 hover:border-[#9B92D8] hover:bg-[#F2F0FD] dark:hover:bg-[#1E1B33]'
              }`}
            >
              Other...
            </button>
          </div>
          {showCustomPref && (
            <CustomChipInput
              value={customPrefInput}
              onChange={setCustomPrefInput}
              onConfirm={() => {
                const val = customPrefInput.trim()
                if (!val || selectedPrefs.includes(val)) return
                setSelectedPrefs(prev => [...prev, val])
                setCustomPrefInput('')
                setShowCustomPref(false)
              }}
              onCancel={() => { setShowCustomPref(false); setCustomPrefInput('') }}
              placeholder="e.g. Scenic viewpoints, Street art, Jazz bars…"
            />
          )}
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-3 block font-semibold">
            Budget Level
          </label>
          <div className="flex flex-wrap gap-2">
            {BUDGET_OPTIONS.map(option => (
              <SelectableChip
                key={option}
                label={option}
                selected={selectedBudget === option}
                onClick={() => setSelectedBudget(selectedBudget === option ? null : option)}
              />
            ))}
          </div>
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block font-semibold">
            Anything Else? <span className="text-slate-300 normal-case">(optional)</span>
          </label>
          <textarea
            value={additionalNotes}
            onChange={event => setAdditionalNotes(event.target.value)}
            placeholder="e.g. I am solo, I want great coffee, I prefer fewer tourists..."
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm dark:text-gray-100 resize-none"
          />
        </section>

        <section className="pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="w-full py-4 rounded-2xl text-white bg-[#7469C4] hover:bg-[#5E54A8] disabled:opacity-40 disabled:hover:bg-[#7469C4] transition-colors flex items-center justify-center gap-3 text-base font-semibold"
          >
            {isGenerating ? (
              <>
                <span className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Finding your perfect destinations...
              </>
            ) : (
              <>
                <Icon name="sparkles" className="w-5 h-5" />
                Discover My Next Destination
              </>
            )}
          </button>
          {!canGenerate && (
            <p className="text-xs text-center text-slate-400 mt-2">
              Enter your current location, select your mood, and choose at least one preference.
            </p>
          )}
        </section>

        {/* UC13: Empfehlungen als einzelne Karten */}
        {hasSuggestions && (
          <section className="space-y-4">
            <div className="bg-[#7469C4] px-6 py-4 rounded-2xl flex items-center gap-3">
              <Icon name="sparkles" className="w-5 h-5 text-white" />
              <h2 className="text-white text-lg font-bold">Your personalized Suggestions</h2>
              {activeSuggestions.length < suggestions.filter(s => !s.skipped || true).length && (
                <span className="ml-auto text-white/70 text-xs">
                  {activeSuggestions.length} active
                </span>
              )}
            </div>

            {/* UC13: Hinweis nach 3 Überspringungen */}
            {showPrefsChangedHint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-xl">🤔</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Changed your mind?</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    You’ve skipped 3 suggestions in a row. Try adjusting your mood or preferences above, or generate new ones.
                  </p>
                </div>
                <button
                  onClick={() => setShowPrefsChangedHint(false)}
                  className="ml-auto text-amber-400 hover:text-amber-600"
                >
                  <Icon name="x" className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* UC13: Einzelne Empfehlungskarten */}
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id}
                className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  suggestion.isError
                    ? 'bg-red-50 border-red-200'
                    : suggestion.skipped
                    ? 'bg-white opacity-40 border-slate-100'
                    : 'bg-white border-slate-100'
                }`}
              >
                {/* Card header — hidden for error cards */}
                {!suggestion.isError && (
                  <div className={`px-5 py-3 flex items-center gap-2 border-b ${suggestion.skipped ? 'bg-slate-50 border-slate-100' : 'bg-[#F2F0FD] border-[#E7E4FA]'}`}>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${suggestion.skipped ? 'bg-slate-200 text-slate-400' : 'bg-[#7469C4] text-white'}`}>
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 flex-1">
                      {suggestion.skipped ? 'Skipped' : 'Suggestion'}
                    </span>
                    {suggestion.skipped && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Icon name="skip" className="w-3 h-3" />
                        Dismissed
                      </span>
                    )}
                  </div>
                )}

                {/* Card content */}
                <div className={`px-5 py-4 text-sm leading-relaxed ${suggestion.isError ? 'text-red-600 flex items-center gap-3' : 'text-slate-700'}`}>
                  {suggestion.isError && <Icon name="x" className="w-4 h-4 shrink-0 text-red-400" />}
                  <ReactMarkdown components={mdComponents}>
                    {suggestion.content}
                  </ReactMarkdown>
                </div>

                {/* UC13: Aktions-Buttons — nur wenn nicht übersprungen */}
                {!suggestion.skipped && !suggestion.isError && (
                  <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSkip(suggestion.id)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Icon name="x" className="w-4 h-4" />
                      Dismiss
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSave(suggestion)}
                      disabled={isGenerating || isSaved(suggestion.id)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm transition-colors disabled:opacity-60 ${
                        isSaved(suggestion.id)
                          ? 'border-[#7469C4] bg-[#7469C4] text-white'
                          : 'border-[#C9C3F0] text-[#5E54A8] hover:bg-[#F2F0FD]'
                      }`}
                    >
                      <Icon name="check" className="w-4 h-4" />
                      {isSaved(suggestion.id) ? 'Saved' : 'Save'}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Lädt neue Ersatz-Empfehlung */}
            {isGenerating && suggestions.some(s => s.skipped) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-[#9B92D8] border-t-[#7469C4] animate-spin shrink-0" />
                <p className="text-sm text-slate-500">Loading new suggestion...</p>
              </div>
            )}

            {/* UC13: "Why These Match You" Abschnitt */}
            {whySection && activeSuggestions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 text-sm text-slate-700">
                <ReactMarkdown components={mdComponents}>{whySection}</ReactMarkdown>
              </div>
            )}

            {/* Footer-Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors text-sm text-slate-600 dark:text-slate-400 font-medium disabled:opacity-40"
              >
                <Icon name="refresh" />
                Regenerate all
              </button>
            </div>
          </section>
        )}

        <p className="text-xs text-center text-slate-400 pb-4">
          Powered by Gemini AI. Suggestions are AI-generated and should be verified.
        </p>
      </main>

      {/* Saved suggestions panel */}
      {showSaved && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowSaved(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <Icon name="check" className="w-5 h-5 text-[#7469C4]" />
                <h2 className="font-semibold text-slate-800 dark:text-gray-100">Saved Suggestions</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#7469C4] text-white">{savedSuggestions.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowSaved(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Icon name="x" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {savedSuggestions.length === 0 ? (
                <p className="text-sm text-slate-400 text-center mt-8">Nothing saved yet.</p>
              ) : (
                savedSuggestions.map((s, i) => {
                  const nameMatch = s.content.match(/\*\*([^*]+)\*\*/)
                  const placeName = nameMatch?.[1]?.trim()
                  const mapsQuery = encodeURIComponent(placeName ? `${placeName}, ${currentLocation}` : currentLocation)
                  return (
                    <div key={s.id} className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#F2F0FD] dark:bg-[#1E1B33] border-b border-[#E7E4FA] dark:border-[#2A2550] flex items-center justify-between">
                        <span className="text-xs font-bold text-[#7469C4]">#{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => setSavedSuggestions(prev => prev.filter(x => x.id !== s.id))}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                          aria-label="Remove"
                        >
                          <Icon name="x" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {s.content}
                      </div>
                      {placeName && (
                        <div className="px-4 pb-3 border-t border-slate-100 dark:border-gray-700 pt-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-[#7469C4] dark:text-[#9B92D8] hover:text-[#5E54A8] font-medium transition-colors"
                          >
                            <Icon name="map-pin" className="w-3.5 h-3.5" />
                            View on Google Maps
                          </a>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {savedSuggestions.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setSavedSuggestions([])}
                  className="w-full py-2 rounded-xl border border-red-200 text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
