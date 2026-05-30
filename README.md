# WanderAI — AI Travel Assistant

A personalized travel planning web app powered by Google Gemini AI. Users answer a short conversational questionnaire and receive tailored recommendations for hotels, restaurants, activities, and transportation.

---

## Features

- **Step-by-step planning chatbot** — collects travel preferences through a guided 10-step conversation
- **Quick-reply chips** — select answers with one click or type freely
- **Multi-select preferences** — pick multiple activities and dietary restrictions
- **AI-powered recommendations** — Gemini generates hotel, restaurant, activity, and transport suggestions based on your preferences
- **Follow-up chat** — ask follow-up questions after receiving recommendations
- **Google Search grounding** — recommendations are grounded with live web search results

---

## Tech Stack

| Layer           | Technology                       |
| --------------- | -------------------------------- |
| Frontend        | Next.js 16, React 19, TypeScript |
| Styling         | Tailwind CSS v4                  |
| AI Model        | Google Gemini 2.5 Flash-Lite     |
| AI SDK          | @google/genai                    |
| Package Manager | pnpm                             |

---

## Prerequisites

- Node.js 18+
- pnpm
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

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

**3. Add your Gemini API key**

Create a `.env.local` file in the project root:

```
GEMINI_API_KEY=your_api_key_here
```

**4. Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000/plan](http://localhost:3000/plan) to use the planning chatbot.

---

## Project Structure

```
app/
├── plan/
│   └── page.tsx        # Planning chatbot UI (client component)
├── api/
│   └── chat/
│       └── route.ts    # Gemini API route handler
├── globals.css
└── layout.tsx
```

---

> Recommendations are AI-generated and should be independently verified before booking.
