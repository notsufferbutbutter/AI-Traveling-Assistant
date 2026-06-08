'use client'

import Link from 'next/link'
import { useCallback, useState } from 'react'
import ReactMarkdown from 'react-markdown'

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

// UC13: Eine einzelne Empfehlung
interface Suggestion {
  id: string
  content: string
  skipped: boolean
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
  name: 'arrow-left' | 'compass' | 'map-pin' | 'plus' | 'sparkles' | 'refresh' | 'x' | 'clock' | 'skip' | 'check'
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
    refresh: <path d="M21 12a9 9 0 0 1-15.3 6.4M3 12A9 9 0 0 1 18.3 5.6M3 18v-6h6M21 6v6h-6" />,
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
          : 'bg-white text-slate-600 border-slate-200 hover:border-[#9B92D8] hover:bg-[#F2F0FD]'
      }`}
    >
      {label}
    </button>
  )
}

function PlaceRow({ place, onRemove }: { place: VisitedPlace; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-[#F2F0FD] flex items-center justify-center text-[#7469C4] shrink-0">
          <Icon name="map-pin" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-800 font-medium truncate">{place.name}</p>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded-md bg-[#F2F0FD] text-[#7469C4] font-medium">
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

function getLocalWeather() {
  return {
    location: 'Your Location',
    temp: 22,
    condition: 'Partly Cloudy',
    humidity: 58,
    wind: 12,
  }
}

// UC13: Hilfsfunktion — teilt Gemini-Text in 3 Empfehlungen auf
function splitSuggestions(text: string): string[] {
  // Versuche bei nummerierten Überschriften zu trennen (## 1. oder **1.** oder 1.)
  const byNumberedHeading = text.split(/\n(?=##\s*\d+\.|\*\*\d+\.|(?<!\S)\d+\.\s+\*\*)/)
  if (byNumberedHeading.length >= 3) {
    return byNumberedHeading.slice(0, 3).map(s => s.trim()).filter(Boolean)
  }

  // Fallback: bei doppeltem Zeilenumbruch + Ziffer trennen
  const byNewline = text.split(/\n{2,}(?=\d+\.)/)
  if (byNewline.length >= 3) {
    return byNewline.slice(0, 3).map(s => s.trim()).filter(Boolean)
  }

  // Letzter Fallback: gesamten Text als eine Karte
  return [text]
}

export default function TravelPage() {
  const [visitedPlaces, setVisitedPlaces] = useState<VisitedPlace[]>([])
  const [placeInput, setPlaceInput] = useState('')
  const [durationInput, setDurationInput] = useState('')
  const [categoryInput, setCategoryInput] = useState<PlaceCategory>('Restaurant')
  const [feeling, setFeeling] = useState<Feeling | null>(null)
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([])
  const [selectedRadius, setSelectedRadius] = useState(RADIUS_OPTIONS[0])
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null)
  const [currentLocation, setCurrentLocation] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  // UC13: Empfehlungen als einzelne Karten statt einem String
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [whySection, setWhySection] = useState<string>('')
  const [consecutiveSkips, setConsecutiveSkips] = useState(0)
  const [showPrefsChangedHint, setShowPrefsChangedHint] = useState(false)

  const weather = getLocalWeather()
  const canGenerate = currentLocation.trim().length > 0 && feeling !== null && selectedPrefs.length > 0

  // UC13: Zählt wie viele Empfehlungen noch aktiv (nicht übersprungen) sind
  const activeSuggestions = suggestions.filter(s => !s.skipped)

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
Weather: ${weather.temp}°C, ${weather.condition}

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

Current local weather: ${weather.temp} C, ${weather.condition}, ${weather.humidity}% humidity, wind ${weather.wind} km/h

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
          content: `Error: ${data.error || 'Could not generate recommendations.'}`,
          skipped: false,
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
    } catch (error) {
      setSuggestions([{
        id: crypto.randomUUID(),
        content: `Error: ${error instanceof Error ? error.message : 'Something went wrong.'}`,
        skipped: false,
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
    weather.condition,
    weather.humidity,
    weather.temp,
    weather.wind,
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
  }

  const hasSuggestions = suggestions.length > 0

  // Markdown-Render-Komponenten (wiederverwendet)
  const mdComponents = {
    h1: ({ children }: { children: React.ReactNode }) => <h3 className="text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>,
    h2: ({ children }: { children: React.ReactNode }) => <h3 className="text-lg font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h3>,
    h3: ({ children }: { children: React.ReactNode }) => <h4 className="text-base font-semibold text-[#5E54A8] mt-3 mb-1">{children}</h4>,
    p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
    ul: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
    strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-slate-900">{children}</strong>,
  }

  return (
    <div className="min-h-screen bg-[#F5F4FD] text-slate-900">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 md:px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="p-2 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back home">
              <Icon name="arrow-left" className="w-5 h-5 text-slate-600" />
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
            <button
              type="button"
              onClick={resetAll}
              className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500"
              title="Reset"
            >
              <Icon name="refresh" />
            </button>
            <Link
              href="/plan"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#F2F0FD] text-[#5E54A8] rounded-xl hover:bg-[#E7E4FA] transition-colors text-sm font-medium"
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

        <section className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center text-sky-500 text-xl">
              ☁
            </div>
            <div>
              <p className="text-sm text-slate-500">Current Weather</p>
              <p className="text-xl text-slate-800 font-bold">
                {weather.temp} C <span className="text-sm text-slate-500 font-normal">{weather.condition}</span>
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <span>{weather.humidity}% humidity</span>
            <span>{weather.wind} km/h wind</span>
          </div>
        </section>

        <section>
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-2 block font-semibold">
            Your Current Destination
          </label>
          <div className="relative">
            <Icon name="map-pin" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={currentLocation}
              onChange={event => setCurrentLocation(event.target.value)}
              placeholder="e.g. Shibuya, Tokyo or Paris, France..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm"
            />
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
                selected={selectedRadius === option}
                onClick={() => setSelectedRadius(option)}
              />
            ))}
          </div>
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
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm"
              />
            </div>
            <select
              value={categoryInput}
              onChange={event => setCategoryInput(event.target.value as PlaceCategory)}
              className="sm:w-44 px-3 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm"
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
              className="sm:w-40 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm"
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
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
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
                  onClick={() => setFeeling(option.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                    selected ? option.className : 'bg-white border-slate-100 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
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
          </div>
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
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] focus:border-[#9B92D8] text-sm resize-none"
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
              Enter your current destination, select your mood, and choose at least one preference.
            </p>
          )}
        </section>

        {/* UC13: Empfehlungen als einzelne Karten */}
        {hasSuggestions && (
          <section className="space-y-4">
            <div className="bg-[#7469C4] px-6 py-4 rounded-2xl flex items-center gap-3">
              <Icon name="sparkles" className="w-5 h-5 text-white" />
              <h2 className="text-white text-lg font-bold">Deine personalisierten Vorschläge</h2>
              {activeSuggestions.length < suggestions.filter(s => !s.skipped || true).length && (
                <span className="ml-auto text-white/70 text-xs">
                  {activeSuggestions.length} aktiv
                </span>
              )}
            </div>

            {/* UC13: Hinweis nach 3 Überspringungen */}
            {showPrefsChangedHint && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-xl">🤔</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800">Haben sich deine Präferenzen geändert?</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Du hast bereits 3 Empfehlungen übersprungen. Scrolle nach oben und passe deine Stimmung oder Vorlieben an, oder generiere neu.
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
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  suggestion.skipped
                    ? 'opacity-40 border-slate-100'
                    : 'border-slate-100'
                }`}
              >
                {/* Karten-Header */}
                <div className={`px-5 py-3 flex items-center gap-2 border-b ${suggestion.skipped ? 'bg-slate-50 border-slate-100' : 'bg-[#F2F0FD] border-[#E7E4FA]'}`}>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${suggestion.skipped ? 'bg-slate-200 text-slate-400' : 'bg-[#7469C4] text-white'}`}>
                    #{index + 1}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex-1">
                    {suggestion.skipped ? 'Übersprungen' : 'Empfehlung'}
                  </span>
                  {suggestion.skipped && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Icon name="skip" className="w-3 h-3" />
                      Abgelehnt
                    </span>
                  )}
                </div>

                {/* Karten-Inhalt */}
                <div className="px-5 py-4 text-sm text-slate-700 leading-relaxed">
                  <ReactMarkdown components={mdComponents}>
                    {suggestion.content}
                  </ReactMarkdown>
                </div>

                {/* UC13: Aktions-Buttons — nur wenn nicht übersprungen */}
                {!suggestion.skipped && (
                  <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSkip(suggestion.id)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-500 hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <Icon name="x" className="w-4 h-4" />
                      Ablehnen
                    </button>
                    <button
                      type="button"
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#C9C3F0] text-sm text-[#5E54A8] hover:bg-[#F2F0FD] transition-colors disabled:opacity-40"
                    >
                      <Icon name="check" className="w-4 h-4" />
                      Merken
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Lädt neue Ersatz-Empfehlung */}
            {isGenerating && suggestions.some(s => s.skipped) && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-[#9B92D8] border-t-[#7469C4] animate-spin shrink-0" />
                <p className="text-sm text-slate-500">Neue Empfehlung wird geladen...</p>
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
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors text-sm text-slate-600 font-medium disabled:opacity-40"
              >
                <Icon name="refresh" />
                Alle neu generieren
              </button>
              <Link
                href="/plan"
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#7469C4] text-white hover:bg-[#5E54A8] transition-colors text-sm font-medium"
              >
                Komplette Reise planen
              </Link>
            </div>
          </section>
        )}

        <p className="text-xs text-center text-slate-400 pb-4">
          Powered by Gemini AI. Suggestions are AI-generated and should be verified.
        </p>
      </main>
    </div>
  )
}
