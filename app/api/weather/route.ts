import { NextRequest } from 'next/server'

interface OpenWeatherResponse {
  name?: string
  weather?: Array<{ description?: string; icon?: string }>
  main?: { temp?: number; feels_like?: number; humidity?: number }
  wind?: { speed?: number }
  sys?: { country?: string }
}

export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get('location')?.trim()
  const latitude = parseCoordinate(req.nextUrl.searchParams.get('lat'))
  const longitude = parseCoordinate(req.nextUrl.searchParams.get('lon'))
  const hasCoordinates = latitude !== null && longitude !== null

  if (!location && !hasCoordinates) {
    return Response.json({ error: 'A location or valid coordinates are required.' }, { status: 400 })
  }

  if (location && location.length > 120) {
    return Response.json({ error: 'The location is too long.' }, { status: 400 })
  }

  if (hasCoordinates && (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) {
    return Response.json({ error: 'The coordinates are outside the valid range.' }, { status: 400 })
  }

  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'Missing OPENWEATHER_API_KEY environment variable.' }, { status: 500 })
  }

  const params = new URLSearchParams({ appid: apiKey, units: 'metric' })
  if (hasCoordinates) {
    params.set('lat', String(latitude))
    params.set('lon', String(longitude))
  } else {
    params.set('q', location!)
  }

  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?${params}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8_000),
    })

    if (response.status === 404) {
      return Response.json({ error: 'OpenWeather could not find that location.' }, { status: 404 })
    }
    if (!response.ok) {
      console.error('OpenWeather error:', response.status, await response.text())
      return Response.json({ error: 'OpenWeather could not provide current conditions.' }, { status: 502 })
    }

    const data = (await response.json()) as OpenWeatherResponse
    const condition = data.weather?.[0]
    if (
      !data.name ||
      typeof data.main?.temp !== 'number' ||
      typeof data.main.humidity !== 'number' ||
      typeof data.wind?.speed !== 'number' ||
      !condition?.description
    ) {
      return Response.json({ error: 'OpenWeather returned incomplete weather data.' }, { status: 502 })
    }

    return Response.json({
      location: [data.name, data.sys?.country].filter(Boolean).join(', '),
      temp: Math.round(data.main.temp),
      feelsLike: typeof data.main.feels_like === 'number' ? Math.round(data.main.feels_like) : null,
      condition: condition.description.replace(/\b\w/g, character => character.toUpperCase()),
      humidity: data.main.humidity,
      wind: Math.round(data.wind.speed * 3.6),
      icon: condition.icon ?? null,
    })
  } catch (error) {
    console.error('OpenWeather request failed:', error)
    return Response.json({ error: 'Could not connect to OpenWeather.' }, { status: 502 })
  }
}

function parseCoordinate(value: string | null) {
  if (value === null || value.trim() === '') return null
  const coordinate = Number(value)
  return Number.isFinite(coordinate) ? coordinate : null
}
