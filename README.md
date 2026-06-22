# WanderAI — AI Travel Assistant

A personalized travel planning web app powered by Google Gemini AI. Plan your trip through a conversational chatbot, or get real-time AI suggestions while you're already at your destination.

---

## Features

### Plan Page (`/plan`)
- **Step-by-step planning chatbot** — collects travel preferences through a guided conversation
- **Quick-reply chips** — select answers with one click or type freely
- **Multi-select preferences** — pick multiple activities and dietary restrictions
- **AI-powered recommendations** — Gemini generates hotel, restaurant, activity, and transport suggestions based on your preferences
- **Follow-up chat** — ask follow-up questions after receiving recommendations
- **Google Search grounding** — recommendations are grounded with live web search results
- **Session persistence** — conversation and preferences survive page refreshes

### Travel Page (`/travel`)
- **Mood selector** — tell the AI how you're feeling right now (energetic, tired, hungry, relaxed, etc.)
- **Live weather widget** — fetches current conditions for your location via OpenWeather
- **GPS support** — detect your coordinates automatically or type a location
- **Visited places tracker** — log places you've already been so the AI avoids repeating them
- **Preference & budget filters** — narrow suggestions by category, budget, and search radius
- **AI suggestions** — on-demand Gemini recommendations tailored to your current mood and context
- **Save suggestions** — bookmark suggestions to a persistent saved panel

### App-wide
- **Dark mode** — system-preference aware, toggleable, persisted across sessions
- **Landing page** — hero section with feature overview and entry points to both flows

---

## Tech Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Frontend        | Next.js 16, React 19, TypeScript    |
| Styling         | Tailwind CSS v4                     |
| Animation       | Motion (Framer Motion)              |
| Icons           | lucide-react                        |
| AI Model        | Google Gemini 2.5 Flash             |
| AI SDK          | @google/genai                       |
| Weather API     | OpenWeatherMap                      |
| Package Manager | pnpm                                |

---

## Prerequisites

- Node.js 18+
- pnpm
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)
- An [OpenWeatherMap](https://openweathermap.org/api) API key (free tier)

---

## Setup

**1. Clone the repository**

```bash
git clone https://github.com/notsufferbutbutter/AI-Traveling-Assistant.git
cd AI-Traveling-Assistant
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Add your API keys**

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_gemini_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

**4. Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

---

## Project Structure

```
app/
├── page.tsx                  # Landing page
├── plan/
│   └── page.tsx              # Planning chatbot
├── travel/
│   └── page.tsx              # During-travel AI assistant
├── api/
│   ├── chat/
│   │   └── route.ts          # Gemini chat API route
│   └── weather/
│       └── route.ts          # OpenWeather proxy route
├── globals.css
└── layout.tsx
components/
├── ThemeProvider.tsx         # Dark/light theme context
└── ThemeToggle.tsx           # Theme toggle button
hooks/
└── usePersistedState.ts      # localStorage-backed React state
```

---

> Recommendations are AI-generated and should be independently verified before booking.
