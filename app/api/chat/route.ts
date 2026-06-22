import { GoogleGenAI } from '@google/genai'
import { NextRequest } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ChatRequestBody {
  messages: ChatMessage[]
  preferences?: Record<string, unknown>
}

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash'
const RETRYABLE_STATUSES = new Set([429, 500, 503, 504])
const requestLog = new Map<string, number[]>()

export async function POST(req: NextRequest) {
  if (isRateLimited(getClientKey(req))) {
    return Response.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Missing GEMINI_API_KEY environment variable' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isChatRequestBody(body)) {
    return Response.json({ error: 'Request body must include a messages array' }, { status: 400 })
  }

  const { messages, preferences } = body

  const ai = new GoogleGenAI({ apiKey })

  const contents = [
    { role: 'user' as const,  parts: [{ text: buildSystemPrompt(normalizePreferences(preferences)) }] },
    { role: 'model' as const, parts: [{ text: 'Understood! I will help plan this trip based on these preferences.' }] },
    ...messages.map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    })),
  ]

  try {
    const response = await generateWithFallback(ai, contents)
    return Response.json({ content: response.text })
  } catch (err) {
    const status = getErrorStatus(err)
    const message = err instanceof Error ? err.message : String(err)
    console.error('Gemini request failed:', status ?? 'unknown', message)

    if (status && RETRYABLE_STATUSES.has(status)) {
      const responseStatus = status === 429 ? 429 : 503
      return Response.json(
        {
          error: 'Gemini is temporarily busy. Please try again shortly.',
          retryable: true,
        },
        {
          status: responseStatus,
          headers: { 'Retry-After': '8' },
        }
      )
    }

    return Response.json({ error: 'The AI request could not be completed.' }, { status: 502 })
  }
}

async function generateWithFallback(
  ai: GoogleGenAI,
  contents: Parameters<GoogleGenAI['models']['generateContent']>[0]['contents']
) {
  const attempts = [PRIMARY_MODEL, PRIMARY_MODEL, FALLBACK_MODEL]
  let lastError: unknown

  for (let index = 0; index < attempts.length; index++) {
    const model = attempts[index]
    try {
      return await ai.models.generateContent({
        model,
        contents,
        config: { tools: [{ googleSearch: {} }] },
      })
    } catch (error) {
      lastError = error
      const status = getErrorStatus(error)
      const hasAnotherAttempt = index < attempts.length - 1
      if (!status || !RETRYABLE_STATUSES.has(status) || !hasAnotherAttempt) throw error

      const delayMs = 700 * 2 ** index + Math.floor(Math.random() * 250)
      console.warn(`Gemini ${model} returned ${status}; retrying in ${delayMs}ms`)
      await sleep(delayMs)
    }
  }

  throw lastError
}

function getErrorStatus(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status?: unknown }).status)
    if (Number.isInteger(status)) return status
  }

  const message = error instanceof Error ? error.message : String(error)
  const codeMatch = message.match(/"code"\s*:\s*(\d{3})/)
  return codeMatch ? Number(codeMatch[1]) : null
}

function sleep(milliseconds: number) {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

function buildSystemPrompt(preferences: Record<string, string>) {
  const {
    origin = 'not specified',
    destination = 'not specified',
    groupSize = 'not specified',
    duration = 'not specified',
    budget = 'medium',
    accommodation = 'not specified',
    foodType = 'not specified',
    allergies = 'none',
    activities = 'not specified',
    travelStyle = 'not specified',
  } = preferences

  const budgetGuide =
    budget === 'tight'
      ? 'budget-friendly only — hostels, street food, free or low-cost attractions, public transport. Never suggest expensive options.'
      : budget === 'luxury'
      ? 'premium and luxury — 5-star hotels, fine dining, private tours, business/first class transport. Price is not a concern.'
      : 'mid-range — good value for money, 3–4 star hotels, sit-down restaurants, a mix of free and paid attractions.'

  const dietaryNote =
    allergies && allergies !== 'none'
      ? `The traveler has dietary restrictions: ${allergies}. Only recommend restaurants and food options that clearly accommodate this.`
      : 'No dietary restrictions.'

  return `You are WanderAI, an expert travel planning assistant with deep knowledge of real destinations, hotels, restaurants, and activities worldwide.

TRIP PROFILE:
- Origin: ${origin}
- Destination: ${destination}
- Group size: ${groupSize} traveler(s)
- Duration: ${duration}
- Budget: ${budget} — ${budgetGuide}
- Accommodation: ${accommodation}
- Food preference: ${foodType}
- Dietary restrictions: ${dietaryNote}
- Activity interests: ${activities}
- Travel style: ${travelStyle}

YOUR TASK:
Respond to the user's specific request (hotels / restaurants / activities / transportation / full itinerary) using ONLY real, named places and services. Never use placeholder names like "Hotel A" or "a nice restaurant".

STRICT RULES:
1. Every recommendation must be a real, verifiable place or service in ${destination}.
2. All options must strictly match the ${budget} budget — never suggest something outside that range.
3. Respect dietary restrictions (${allergies}) in every food-related recommendation.
4. Match the tone and type of recommendations to the travel style: ${travelStyle}.
5. Tailor activity suggestions to interests: ${activities}.

FORMAT PER CATEGORY — use these exact structures:

Hotels → for each option: hotel name, star rating, price per night in EUR/USD, neighbourhood, one standout feature, and why it suits this traveler.

Restaurants → for each option: restaurant name, cuisine type, average price per person, must-try dish, and a dietary note if relevant.

Activities → for each option: activity/attraction name, estimated duration, entry cost, best time to visit, and why it matches their travel style.

Transportation → cover two parts: (1) getting from ${origin} to ${destination} with 2–3 real options (airline/train/bus names, price ranges, travel time); (2) getting around ${destination} locally (metro, bus, taxi apps, walking zones).

Full Itinerary → create a structured day-by-day plan for ${duration}. Each day must have: Morning, Afternoon, Evening slots — each slot includes one activity or meal recommendation with a short reason. End with a packing tip relevant to ${destination} and ${travelStyle}.

SEPARATOR RULE — CRITICAL:
Structure your entire response EXACTLY like this — the intro sentence is alone on its own block, separated from Option 1 by ---. Never merge the intro with Option 1:

[One-line intro sentence only — nothing else in this block]
---
[Option 1 full details]
---
[Option 2 full details]
---
[Option 3 full details]
---
WanderAI Pro Tip: [tip here — this is always the final block, separated by --- from Option 3]

The --- separator must appear between EVERY block, including between the intro and Option 1, and between Option 3 and the Pro Tip. Exactly 5 --- separators total (intro, 3 options, pro tip = 5 blocks = 4 separators).

GENERAL STYLE:
- Be specific, practical, and confident.
- Use bold for names/titles within each option.
- Keep each recommendation to 3–4 lines maximum.
- Provide EXACTLY 3 options per category — never 4 or more.
- Do not use emojis in the reply
- End every response with one personalised "WanderAI Pro Tip" based on the unique combination of this traveler's preferences.`
}

function isChatRequestBody(value: unknown): value is ChatRequestBody {
  if (!value || typeof value !== 'object') {
    return false
  }

  const messages = (value as { messages?: unknown }).messages
  if (!Array.isArray(messages)) {
    return false
  }

  return messages.every(
    message =>
      message &&
      typeof message === 'object' &&
      ((message as { role?: unknown }).role === 'user' || (message as { role?: unknown }).role === 'assistant') &&
      typeof (message as { content?: unknown }).content === 'string'
  )
}

function normalizePreferences(preferences: Record<string, unknown> | undefined) {
  if (!preferences) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(preferences).filter(([, value]) => typeof value === 'string')
  ) as Record<string, string>
}

function getClientKey(req: NextRequest) {
  const forwardedFor = req.headers.get('x-forwarded-for')
  return forwardedFor?.split(',')[0]?.trim() || 'unknown'
}

function isRateLimited(clientKey: string) {
  const now = Date.now()
  const windowStart = now - RATE_LIMIT_WINDOW_MS
  const recentRequests = (requestLog.get(clientKey) ?? []).filter(timestamp => timestamp > windowStart)

  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    requestLog.set(clientKey, recentRequests)
    return true
  }

  recentRequests.push(now)
  requestLog.set(clientKey, recentRequests)
  return false
}
