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
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: buildSystemPrompt(preferences ?? {}),
  })

  // Gemini needs "history" (all messages except the last) + the new message sent separately
  const history = messages.slice(0, -1).map((m: ChatMessage) => ({
    role: m.role === 'assistant' ? 'model' as const : 'user' as const,
    parts: [{ text: m.content }],
  }))

  const chat = model.startChat({ history })
  const lastMessage = messages[messages.length - 1]
  const result = await chat.sendMessage(lastMessage.content)

  return Response.json({ content: result.response.text() })
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
Use clear sections for readability. Include names, price ranges, and short descriptions.
Be conversational and enthusiastic.`
}