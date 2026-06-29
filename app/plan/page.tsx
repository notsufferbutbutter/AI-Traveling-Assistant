'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { usePersistedState } from '@/hooks/usePersistedState'
import { ThemeToggle } from '@/components/ThemeToggle'

// --- Types ---

interface Message {
  id: string
  role: 'bot' | 'user'
  content: string
  isSuggestion?: boolean
}

interface TravelPreferences {
  origin: string
  destination: string
  groupSize: string
  duration: string
  budget: string
  accommodation: string
  foodType: string
  allergies: string
  activities: string
  travelStyle: string
}

type Phase = 'collecting' | 'optional' | 'menu' | 'recommending'

// --- Step definitions ---

const STEPS = [
  { field: 'origin', text: "Hey there! I'm WanderAI, your personal travel planning assistant. Let's start — where are you traveling from?", chips: [] },
  { field: 'destination', text: "Awesome! And where would you like to go? Name a city or country!", chips: [] },
  { field: 'groupSize', text: "How many people are traveling?", chips: [] },
  { field: 'duration', text: "How long is your trip?", chips: ['3 days', '5 days', '1 week', '2 weeks'] },
  { field: 'budget', text: "What's your budget level?", chips: ['tight', 'medium', 'luxury'] },
]

const MENU_CHIPS = ['Hotels', 'Restaurants', 'Activities', 'Transportation']
const TOTAL_STEPS = STEPS.length
const ESSENTIAL_FIELDS = ['origin', 'destination', 'groupSize', 'duration', 'budget'] as const
const ACCOMMODATION_OPTIONS = ['hostel', '3-star hotel', '4-star hotel', '5-star hotel']
const FOOD_OPTIONS = ['local cuisine', 'vegetarian / vegan', 'international']
const ALLERGY_OPTIONS = ['none', 'gluten-free', 'lactose-free', 'nut allergy']
const ACTIVITY_OPTIONS = ['city tour', 'cultural', 'adventure', 'water activities', 'sky activities']
const TRAVEL_STYLE_OPTIONS = ['budget traveler', 'luxury traveler', 'adventure traveler', 'cultural explorer', 'foodie traveler', 'relaxation', 'family-friendly']

// US8: Reiseplan ändern / neu generieren
const STEP_LABELS: Record<string, string> = {
  origin: 'From', destination: 'To', groupSize: 'Travelers',
  duration: 'Duration', budget: 'Budget', accommodation: 'Accommodation',
  foodType: 'Food', allergies: 'Allergies', activities: 'Activities',
  travelStyle: 'Travel Style',
}

// --- Icons ---

function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function StarIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// US8: Edit Icon
function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

// --- Typing animation ---

function TypingBubble() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-[#7469C4] flex items-center justify-center text-white shrink-0">
        <StarIcon />
      </div>
      <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="flex gap-1 items-center">
          <span className="w-2 h-2 bg-[#9B92D8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-[#9B92D8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-[#9B92D8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function OptionalPreferencesFields({
  preferences,
  onChange,
}: {
  preferences: Partial<TravelPreferences>
  onChange: (field: keyof TravelPreferences, value: string) => void
}) {
  function selectedValues(field: 'allergies' | 'activities') {
    return (preferences[field] ?? '').split(',').map(value => value.trim()).filter(Boolean)
  }

  function toggleValue(field: 'allergies' | 'activities', value: string) {
    const current = selectedValues(field)
    if (field === 'allergies' && value === 'none') {
      onChange(field, 'none')
      return
    }
    const withoutNone = current.filter(item => item !== 'none')
    const next = withoutNone.includes(value)
      ? withoutNone.filter(item => item !== value)
      : [...withoutNone, value]
    onChange(field, next.join(', '))
  }

  function renderChips(field: 'allergies' | 'activities', options: string[]) {
    const selected = selectedValues(field)
    return (
      <div className="flex flex-wrap gap-2">
        {options.map(option => (
          <button
            key={option}
            type="button"
            onClick={() => toggleValue(field, option)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              selected.includes(option)
                ? 'border-[#7469C4] bg-[#7469C4] text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-[#9B92D8] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    )
  }

  const selectClassName = 'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#9B92D8] focus:ring-2 focus:ring-[#C9C3F0] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-gray-700 dark:bg-gray-800/60">
          Accommodation
          <select
            value={preferences.accommodation ?? ''}
            onChange={event => onChange('accommodation', event.target.value)}
            className={selectClassName}
          >
            <option value="">No preference</option>
            {ACCOMMODATION_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
        <label className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-gray-700 dark:bg-gray-800/60">
          Food
          <select
            value={preferences.foodType ?? ''}
            onChange={event => onChange('foodType', event.target.value)}
            className={selectClassName}
          >
            <option value="">No preference</option>
            {FOOD_OPTIONS.map(option => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Dietary needs</p>
        {renderChips('allergies', ALLERGY_OPTIONS)}
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-800/60">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Activities</p>
        {renderChips('activities', ACTIVITY_OPTIONS)}
      </div>
      <label className="block rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-gray-700 dark:bg-gray-800/60">
        Travel style
        <select
          value={preferences.travelStyle ?? ''}
          onChange={event => onChange('travelStyle', event.target.value)}
          className={selectClassName}
        >
          <option value="">No preference</option>
          {TRAVEL_STYLE_OPTIONS.map(option => <option key={option}>{option}</option>)}
        </select>
      </label>
    </div>
  )
}

// --- Main page ---

export default function PlanPage() {
  const searchParams = useSearchParams()
  const prefilledDestination = searchParams.get('destination')

  // US8: Edit panel state
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editReturnPhase, setEditReturnPhase] = useState<Phase>('collecting')

  const [messages, setMessages] = usePersistedState<Message[]>('plan_messages', [
    { id: '0', role: 'bot', content: STEPS[0].text },
  ])
  const [currentStep, setCurrentStep] = usePersistedState<number>('plan_step', 0)
  const [preferences, setPreferences] = usePersistedState<Partial<TravelPreferences>>(
    'plan_preferences',
    prefilledDestination ? { destination: prefilledDestination } : {}
  )
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = usePersistedState<Phase>('plan_phase', 'collecting')
  const [geminiMessages, setGeminiMessages] = usePersistedState<{ role: 'user' | 'assistant'; content: string }[]>('plan_gemini_messages', [])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAdvancingRef = useRef(false)
  const advanceTimerRef = useRef<number | null>(null)
  const apiRequestInFlightRef = useRef(false)
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, phase])

  useEffect(() => () => {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
  }, [])

  useEffect(() => {
    if (retryAfterSeconds <= 0) return
    const timer = window.setTimeout(() => {
      setRetryAfterSeconds(previous => Math.max(0, previous - 1))
    }, 1_000)
    return () => window.clearTimeout(timer)
  }, [retryAfterSeconds])

  useEffect(() => {
    if (phase !== 'collecting' || currentStep < TOTAL_STEPS) return

    const firstMissingStep = STEPS.findIndex(step => !preferences[step.field as keyof TravelPreferences])
    queueMicrotask(() => {
      if (firstMissingStep >= 0) {
        setCurrentStep(firstMissingStep)
      } else {
        setCurrentStep(TOTAL_STEPS - 1)
        setPhase('optional')
      }
    })
  }, [currentStep, phase, preferences, setCurrentStep, setPhase])

  useEffect(() => {
    if (phase !== 'collecting' || currentStep < 2) return
    const duplicateIndex = messages.findIndex((message, index) => {
      const previous = messages[index - 1]
      return (
        message.role === 'user' &&
        previous?.role === 'user' &&
        message.content.trim().toLowerCase() === previous.content.trim().toLowerCase()
      )
    })
    if (duplicateIndex < 1 || preferences.origin?.toLowerCase() !== preferences.destination?.toLowerCase()) return

    queueMicrotask(() => {
      setMessages([
        ...messages.slice(0, duplicateIndex),
        { id: crypto.randomUUID(), role: 'bot', content: STEPS[1].text },
      ])
      setPreferences(previous => {
        if (prefilledDestination) return { ...previous, destination: prefilledDestination }
        const repaired = { ...previous }
        delete repaired.destination
        return repaired
      })
      setCurrentStep(1)
      setInput(prefilledDestination ?? '')
    })
  }, [currentStep, messages, phase, preferences.destination, preferences.origin, prefilledDestination, setCurrentStep, setMessages, setPreferences])

  function addBotMessage(content: string, isSuggestion = false) {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', content, isSuggestion }])
  }

  function splitAndAddBotMessages(rawContent: string, onDone?: () => void) {
    let parts = rawContent.split(/\n---\n/).map(p => p.trim()).filter(Boolean)
    if (parts.length <= 1) {
      addBotMessage(rawContent)
      onDone?.()
      return
    }

    // If the AI merged intro + first suggestion before the first ---, split them
    const blankLine = parts[0].search(/\n\n/)
    if (blankLine !== -1) {
      const intro = parts[0].slice(0, blankLine).trim()
      const firstSuggestion = parts[0].slice(blankLine).trim()
      if (intro && firstSuggestion) {
        parts = [intro, firstSuggestion, ...parts.slice(1)]
      }
    }

    // If the AI merged the Pro Tip into the last suggestion without a ---, split it out
    const proTipPattern = /\n\n(WanderAI Pro Tip[:\s])/i
    const lastPart = parts[parts.length - 1]
    const proTipMatch = lastPart.match(proTipPattern)
    if (proTipMatch && !lastPart.trimStart().match(/^WanderAI Pro Tip/i)) {
      const splitIdx = lastPart.search(proTipPattern)
      const suggestion = lastPart.slice(0, splitIdx).trim()
      const proTip = lastPart.slice(splitIdx).trim()
      parts = [...parts.slice(0, -1), suggestion, proTip]
    }

    // parts[0] = plain intro bubble
    // parts[1..n-2] = suggestion cards
    // parts[n-1] = plain Pro Tip bubble
    const isProTip = (text: string) => /^WanderAI Pro Tip/i.test(text.trimStart())

    addBotMessage(parts[0], false)
    parts.slice(1).forEach((part, i) => {
      const isLast = i === parts.length - 2
      setTimeout(() => {
        addBotMessage(part, !isProTip(part) && !isLast)
        if (isLast) onDone?.()
      }, (i + 1) * 250)
    })
  }

  function addUserMessage(content: string) {
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'user', content }])
  }

  async function handleAnswer(answer: string) {
    if (!answer.trim() || isLoading || isAdvancingRef.current || apiRequestInFlightRef.current) return
    if ((phase === 'menu' || phase === 'recommending') && retryAfterSeconds > 0) return
    if (phase === 'collecting' && STEPS[currentStep].field === 'groupSize') {
      const travelers = Number(answer)
      if (!Number.isInteger(travelers) || travelers < 1 || travelers > 50) {
        addBotMessage('Choose a group size between 1 and 50 travelers.')
        return
      }
    }
    if (phase === 'collecting') isAdvancingRef.current = true
    setInput('')
    addUserMessage(answer)

    if (phase === 'collecting') {
      const field = STEPS[currentStep].field as keyof TravelPreferences
      const newPrefs: Partial<TravelPreferences> = { ...preferences, [field]: answer }
      if (field === 'origin' && !prefilledDestination) {
        delete newPrefs.destination
      }
      setPreferences(newPrefs)

      const nextIdx = currentStep + 1

      if (nextIdx < STEPS.length) {
        setCurrentStep(nextIdx)
        setIsLoading(true)
        advanceTimerRef.current = window.setTimeout(() => {
          addBotMessage(STEPS[nextIdx].text)
          if (STEPS[nextIdx].field === 'destination' && prefilledDestination) {
            setInput(prefilledDestination)
          }
          setIsLoading(false)
          isAdvancingRef.current = false
          advanceTimerRef.current = null
        }, 700)
      } else {
        setIsLoading(true)
        advanceTimerRef.current = window.setTimeout(() => {
          setPhase('optional')
          addBotMessage('The essentials are set. Add any optional preferences you care about, use my defaults, or skip this step.')
          setIsLoading(false)
          isAdvancingRef.current = false
          advanceTimerRef.current = null
        }, 500)
      }
    } else if (phase === 'menu') {
      await generateRecommendation(answer)
    } else if (phase === 'recommending') {
      await continueChat(answer)
    }
  }

  async function generateSummary(prefs: Partial<TravelPreferences>) {
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 700))
    const optionalSummary = [prefs.accommodation, prefs.foodType, prefs.allergies, prefs.activities, prefs.travelStyle]
      .filter(value => value && value !== 'not specified' && value !== 'none')
      .join('  ·  ')
    const summary =
      `Perfect! Here's your trip summary:\n\n` +
      `${prefs.origin} → ${prefs.destination}\n` +
      `${prefs.groupSize} traveler(s)  ·  ${prefs.duration}\n` +
      `${prefs.budget} budget${optionalSummary ? `\n${optionalSummary}` : ''}\n\n` +
      `What would you like to plan first?`
    addBotMessage(summary)
    setPhase('menu')
    setIsLoading(false)
  }

  function updatePreference(field: keyof TravelPreferences, value: string) {
    setPreferences(previous => ({ ...previous, [field]: value }))
  }

  function openEditPanel() {
    setEditReturnPhase(phase)
    setShowEditPanel(true)
  }

  function useRecommendedDefaults() {
    setPreferences(previous => ({
      ...previous,
      accommodation: previous.budget === 'luxury' ? '5-star hotel' : previous.budget === 'tight' ? 'hostel' : '3-star hotel',
      foodType: 'local cuisine',
      allergies: 'none',
      activities: 'city tour, cultural',
      travelStyle: previous.budget === 'tight' ? 'budget traveler' : previous.budget === 'luxury' ? 'luxury traveler' : 'cultural explorer',
    }))
  }

  async function finishOptionalPreferences(skip: boolean) {
    const completed = skip
      ? {
          ...preferences,
          accommodation: 'not specified',
          foodType: 'not specified',
          allergies: 'none',
          activities: 'not specified',
          travelStyle: 'not specified',
        }
      : preferences
    setPreferences(completed)
    await generateSummary(completed)
  }

  async function generateRecommendation(task: string) {
    if (apiRequestInFlightRef.current) return
    apiRequestInFlightRef.current = true
    setIsLoading(true)
    const userMsg = { role: 'user' as const, content: `Give me ${task} recommendations for my trip.` }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [userMsg], preferences }),
      })
      const data = await res.json()
      if (!res.ok) {
        handleChatFailure(res, data)
        return
      }
      setGeminiMessages([userMsg, { role: 'assistant', content: data.content }])
      setPhase('recommending')
      splitAndAddBotMessages(data.content, () => {
        setTimeout(() => addBotMessage('Anything else you want to explore?'), 500)
      })
    } catch {
      addBotMessage("WanderAI couldn't generate suggestions right now. Please try again in a moment.")
    } finally {
      apiRequestInFlightRef.current = false
      setIsLoading(false)
    }
  }

  async function continueChat(message: string) {
    if (apiRequestInFlightRef.current) return
    apiRequestInFlightRef.current = true
    setIsLoading(true)
    const newMessages = [...geminiMessages, { role: 'user' as const, content: message }]
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, preferences }),
      })
      const data = await res.json()
      if (!res.ok) {
        handleChatFailure(res, data)
        return
      }
      splitAndAddBotMessages(data.content)
      setGeminiMessages([...newMessages, { role: 'assistant', content: data.content }])
    } catch {
      addBotMessage("WanderAI couldn't generate suggestions right now. Please try again in a moment.")
    } finally {
      apiRequestInFlightRef.current = false
      setIsLoading(false)
    }
  }

  function handleChatFailure(response: Response, data: { error?: string; retryable?: boolean }) {
    if (data.retryable || response.status === 429 || response.status === 503) {
      const retryAfter = Number(response.headers.get('Retry-After'))
      const seconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 8
      setRetryAfterSeconds(seconds)
      addBotMessage(`Gemini is temporarily busy. Please try again in ${seconds} seconds.`)
      return
    }

    addBotMessage(data.error || "WanderAI couldn't generate suggestions right now. Please try again in a moment.")
  }

  function resetChat() {
    if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current)
    advanceTimerRef.current = null
    isAdvancingRef.current = false
    apiRequestInFlightRef.current = false
    setIsLoading(false)
    setRetryAfterSeconds(0)
    setMessages([{ id: '0', role: 'bot', content: STEPS[0].text }])
    setCurrentStep(0)
    setPreferences(prefilledDestination ? { destination: prefilledDestination } : {})
    setPhase('collecting')
    setGeminiMessages([])
    setInput('')
    setShowEditPanel(false)
  }

  // US8: Save edited preferences and re-enter menu
  function handleEditSave(updated: Partial<TravelPreferences>) {
    setShowEditPanel(false)
    setPreferences(updated)
    if (editReturnPhase === 'collecting' || editReturnPhase === 'optional') {
      addBotMessage('Preferences updated. Continue whenever you are ready.')
      setPhase(editReturnPhase)
    } else {
      addBotMessage('Preferences updated! What would you like to re-plan?')
      setPhase('menu')
      setGeminiMessages([])
    }
  }

  const currentChips =
    phase === 'collecting'
      ? STEPS[currentStep]?.chips ?? []
      : phase === 'menu' || phase === 'recommending'
        ? MENU_CHIPS
        : []
  const displayMessages = messages.filter((message, index) => {
    const previous = messages[index - 1]
    return !(
      message.role === 'user' &&
      previous?.role === 'user' &&
      message.content.trim().toLowerCase() === previous.content.trim().toLowerCase()
    )
  })

  return (
    <div className="h-screen bg-[#F5F4FD] dark:bg-gray-950 flex justify-center">
      <div className="relative flex flex-col w-full max-w-2xl h-full bg-white dark:bg-gray-900 border-x border-gray-100 dark:border-gray-800">

        {/* Header */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Go back"
          >
            <BackIcon />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#7469C4] flex items-center justify-center text-white shrink-0">
              <StarIcon size={16} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-tight">WanderAI</p>
              <p className="text-xs text-emerald-500 leading-tight">● Online</p>
            </div>
          </div>

          {phase === 'collecting' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                Step {currentStep + 1}/{TOTAL_STEPS}
              </span>
              <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#7469C4] rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* US8: Bearbeiten-Button */}
          {(phase === 'menu' || phase === 'recommending') && (
            <button
              onClick={openEditPanel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F2F0FD] text-[#5E54A8] text-xs font-semibold hover:bg-[#E7E4FA] transition-colors shrink-0"
            >
              <EditIcon />
              Edit
            </button>
          )}

        <ThemeToggle />
          <button
            onClick={resetChat}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#7469C4] hover:bg-[#F2F0FD] dark:hover:bg-gray-800 transition-colors shrink-0"
            aria-label="Reset chat"
          >
            <RefreshIcon />
          </button>
        </header>

        {ESSENTIAL_FIELDS.some(field => preferences[field]) && (
          <section className="border-b border-gray-100 bg-[#FAFAFE] px-4 py-2 dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex flex-wrap gap-1.5">
              {ESSENTIAL_FIELDS.map(field => {
                const value = preferences[field]
                if (!value) return null
                return (
                  <div key={field} className="flex items-center gap-1 rounded-lg border border-[#E7E4FA] bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-gray-800">
                    <span className="text-slate-400">{STEP_LABELS[field]}:</span>
                    <span className="max-w-28 truncate font-medium text-slate-700 dark:text-gray-200">{value}</span>
                    <button
                      type="button"
                      onClick={openEditPanel}
                      className="ml-0.5 text-[#7469C4] hover:text-[#5E54A8]"
                      aria-label={`Edit ${STEP_LABELS[field]}`}
                    >
                      <EditIcon />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {displayMessages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}
            >
              {msg.role === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-[#7469C4] flex items-center justify-center text-white shrink-0 self-start mt-1">
                  <StarIcon />
                </div>
              )}
              <div
                className={`text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-sm bg-[#7469C4] text-white whitespace-pre-wrap'
                    : msg.isSuggestion
                    ? 'max-w-[82%] rounded-2xl rounded-bl-sm overflow-hidden shadow-sm border border-[#E8E4FA] dark:border-[#3D3566]'
                    : 'max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm whitespace-pre-wrap'
                }`}
              >
                {msg.role === 'bot' ? (
                  msg.isSuggestion ? (() => {
                    const nameMatch = msg.content.match(/\*\*([^*]+)\*\*/)
                    const placeName = nameMatch?.[1]?.trim()
                    const destination = preferences.destination ?? ''
                    const mapsQuery = encodeURIComponent(placeName ? `${placeName}, ${destination}` : destination)
                    return (
                      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                        <div className="h-1 bg-gradient-to-r from-[#7469C4] to-[#9B92D8]" />
                        <div className="px-4 py-3">
                          <ReactMarkdown
                            components={{
                              h1: ({ children }) => <p className="font-bold text-sm mt-3 mb-1 first:mt-0 text-[#5E54A8] dark:text-[#9B92D8]">{children}</p>,
                              h2: ({ children }) => <p className="font-bold text-sm mt-2 mb-1 first:mt-0 text-[#5E54A8] dark:text-[#9B92D8]">{children}</p>,
                              h3: ({ children }) => <p className="font-semibold text-sm mt-2 mb-0.5 first:mt-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
                              ul: ({ children }) => <ul className="my-1.5 space-y-1">{children}</ul>,
                              ol: ({ children }) => <ol className="my-1.5 space-y-1 list-decimal list-inside">{children}</ol>,
                              li: ({ children }) => (
                                <li className="text-gray-700 dark:text-gray-300 leading-snug">
                                  {children}
                                </li>
                              ),
                              p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-snug">{children}</p>,
                              hr: () => <hr className="my-2 border-gray-100 dark:border-gray-700" />,
                            }}
                          >
                            {msg.content.replace(/\n{3,}/g, '\n\n')}
                          </ReactMarkdown>
                        </div>
                        {placeName && (
                          <div className="px-4 pb-3 border-t border-gray-100 dark:border-gray-700 pt-2">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-[#7469C4] dark:text-[#9B92D8] hover:text-[#5E54A8] font-medium transition-colors"
                            >
                              <MapPinIcon />
                              View on Google Maps
                            </a>
                          </div>
                        )}
                      </div>
                    )
                  })() : (
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <p className="font-bold text-sm mt-3 mb-1 first:mt-0">{children}</p>,
                        h2: ({ children }) => <p className="font-bold text-sm mt-2 mb-1 first:mt-0">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold text-sm mt-2 mb-0.5 first:mt-0">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="my-1 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="my-1 space-y-0.5 list-decimal list-inside">{children}</ol>,
                        li: ({ children }) => (
                          <li className="flex gap-1.5 items-start">
                            <span className="leading-snug">{children}</span>
                          </li>
                        ),
                        p: ({ children }) => <p className="mb-1 last:mb-0 leading-snug">{children}</p>,
                        hr: () => <hr className="my-1.5 border-gray-100 dark:border-gray-700" />,
                      }}
                    >
                      {msg.content
                        .replace(/\n{3,}/g, '\n\n')
                        .replace(/(\n[-*+][^\n]+)\n\n(?=[-*+])/g, '$1\n')}
                    </ReactMarkdown>
                  )
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}

          {phase === 'optional' && (
            <div className="ml-10 rounded-2xl rounded-bl-sm border border-[#E7E4FA] bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-gray-100">Optional preferences</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-gray-400">Choose only what matters to you.</p>
              </div>
              <OptionalPreferencesFields preferences={preferences} onChange={updatePreference} />
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => finishOptionalPreferences(true)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700"
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={useRecommendedDefaults}
                  className="rounded-xl border border-[#C9C3F0] px-3 py-2 text-sm font-medium text-[#5E54A8] hover:bg-[#F2F0FD] dark:hover:bg-[#1E1B33]"
                >
                  Use recommended defaults
                </button>
                <button
                  type="button"
                  onClick={() => finishOptionalPreferences(false)}
                  className="rounded-xl bg-[#7469C4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#5E54A8]"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {isLoading && <TypingBubble />}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick chips */}
        {currentChips.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {currentChips.map(chip => {
              return (
                <button
                  key={chip}
                  onClick={() => handleAnswer(chip)}
                  disabled={isLoading || retryAfterSeconds > 0}
                  className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm text-gray-700 transition-colors hover:border-[#9B92D8] hover:text-[#5E54A8] disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                >
                  {chip}
                </button>
              )
            })}
          </div>
        )}

        {/* Input bar */}
        {phase !== 'optional' && (
          <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-4 pt-3 pb-4 shrink-0">
            <div className="flex items-center gap-2">
              {phase === 'collecting' && STEPS[currentStep]?.field === 'groupSize' && (
                <button
                  type="button"
                  onClick={() => setInput(String(Math.max(1, (Number(input) || 1) - 1)))}
                  className="h-10 w-10 rounded-full border border-gray-200 text-lg text-gray-600 hover:border-[#9B92D8] dark:border-gray-700 dark:text-gray-300"
                  aria-label="Decrease travelers"
                >
                  −
                </button>
              )}
              <input
                ref={inputRef}
                type={phase === 'collecting' && STEPS[currentStep]?.field === 'groupSize' ? 'number' : 'text'}
                min={phase === 'collecting' && STEPS[currentStep]?.field === 'groupSize' ? 1 : undefined}
                max={phase === 'collecting' && STEPS[currentStep]?.field === 'groupSize' ? 50 : undefined}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleAnswer(input)
                  }
                }}
                placeholder={
                  phase === 'collecting' && STEPS[currentStep]?.field === 'groupSize'
                    ? 'Number of travelers'
                    : phase === 'collecting'
                      ? 'Type your answer...'
                      : 'Ask a follow-up...'
                }
                disabled={isLoading || retryAfterSeconds > 0}
                className="flex-1 text-sm text-gray-700 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-full px-4 py-2.5 outline-none border border-transparent focus:border-[#B8B0E8] focus:bg-white dark:focus:bg-gray-700 transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500 disabled:opacity-50"
              />
              {phase === 'collecting' && STEPS[currentStep]?.field === 'groupSize' && (
                <button
                  type="button"
                  onClick={() => setInput(String(Math.min(50, (Number(input) || 0) + 1)))}
                  className="h-10 w-10 rounded-full border border-gray-200 text-lg text-gray-600 hover:border-[#9B92D8] dark:border-gray-700 dark:text-gray-300"
                  aria-label="Increase travelers"
                >
                  +
                </button>
              )}
              <button
                onClick={() => handleAnswer(input)}
                disabled={!input.trim() || isLoading || retryAfterSeconds > 0}
                className="w-10 h-10 rounded-full bg-[#7469C4] flex items-center justify-center text-white disabled:opacity-40 hover:bg-[#5E54A8] transition-colors shrink-0"
                aria-label="Send"
              >
                <SendIcon />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              {retryAfterSeconds > 0
                ? `Gemini is busy. Retry available in ${retryAfterSeconds}s.`
                : 'Powered by Gemini AI. Recommendations are AI-generated and should be verified.'}
            </p>
          </div>
        )}

        {/* US8: Edit Panel Overlay */}
        {showEditPanel && (
          <div className="absolute inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col">
            <div className="bg-[#7469C4] px-4 py-3 flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowEditPanel(false)}
                className="text-white/70 hover:text-white text-lg leading-none"
              >
                ✕
              </button>
              <p className="text-white font-semibold text-sm flex-1">Edit Travel Plan</p>
              <button
                onClick={() => handleEditSave(preferences)}
                className="px-3 py-1.5 bg-white text-[#7469C4] rounded-lg text-xs font-semibold hover:bg-[#F2F0FD] transition-colors"
              >
                Regenerate
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {STEPS.map(step => (
                <div key={step.field} className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3 border border-slate-100 dark:border-gray-700">
                  <label className="text-xs text-slate-500 dark:text-gray-400 font-semibold uppercase tracking-wide mb-2 block">
                    {STEP_LABELS[step.field]}
                  </label>
                  {step.field === 'duration' || step.field === 'budget' ? (
                    <select
                      value={preferences[step.field as keyof TravelPreferences] ?? ''}
                      onChange={e => updatePreference(step.field as keyof TravelPreferences, e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9C3F0]"
                    >
                      <option value="">Select an option</option>
                      {(step.field === 'duration' ? ['3 days', '5 days', '1 week', '2 weeks'] : ['tight', 'medium', 'luxury']).map(option => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={step.field === 'groupSize' ? 'number' : 'text'}
                      min={step.field === 'groupSize' ? 1 : undefined}
                      max={step.field === 'groupSize' ? 50 : undefined}
                      value={preferences[step.field as keyof TravelPreferences] ?? ''}
                      onChange={e => updatePreference(step.field as keyof TravelPreferences, e.target.value)}
                      className="w-full text-sm px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-slate-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9C3F0] placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  )}
                </div>
              ))}
              <div className="pt-2">
                <h2 className="mb-3 text-sm font-bold text-slate-800 dark:text-gray-100">Optional preferences</h2>
                <OptionalPreferencesFields preferences={preferences} onChange={updatePreference} />
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
