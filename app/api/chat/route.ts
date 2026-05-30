import { GoogleGenerativeAI } from '@google/generative-ai'
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

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite',
                                          tools: [{googleSearch: {}}]
   })

  // Inject preferences as the opening user/model exchange so Gemini has context
  const contents = [
    { role: 'user' as const,  parts: [{ text: buildSystemPrompt(normalizePreferences(preferences)) }] },
    { role: 'model' as const, parts: [{ text: 'Understood! I will help plan this trip based on these preferences.' }] },
    ...messages.map((m: ChatMessage) => ({
      role: m.role === 'assistant' ? 'model' as const : 'user' as const,
      parts: [{ text: m.content }],
    })),
  ]

  try {
    const result = await model.generateContent({ contents })
    return Response.json({ content: result.response.text() })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Gemini error:', message)
    return Response.json({ error: message }, { status: 500 })
  }
}

function buildSystemPrompt(preferences: Record<string, string>) {
  const prefsText = Object.entries(preferences)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  return `You are WanderAI, a friendly travel planning assistant.

The user's travel preferences:
${prefsText}

Generate specific, helpful recommendations that match these preferences.
Use clear sections with emoji for readability. Include names, price ranges, and short descriptions.
Be conversational and enthusiastic.`
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
