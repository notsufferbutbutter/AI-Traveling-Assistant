import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest } from 'next/server'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Missing API key' }, { status: 500 })
  }

  const { messages, preferences } = await req.json()

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite',
                                          tools: [{googleSearch: {}}]
   })

  // Inject preferences as the opening user/model exchange so Gemini has context
  const contents = [
    { role: 'user' as const,  parts: [{ text: buildSystemPrompt(preferences ?? {}) }] },
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
