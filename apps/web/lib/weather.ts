import { phaseAt, type Conditions, type Weather } from '@nightcap/scene/conditions'

// The sky in someone's window: what time it is where they are, and what it's
// doing outside. Weather comes from open-meteo (free, no key) for the town on
// their map pin, which is only ever rounded to about 10km.

const CACHE_MS = 15 * 60_000
const cache = new Map<string, { at: number; weather: Weather | null }>()

/** WMO weather codes, folded into the handful the street can draw */
export function weatherFromCode(code: number): Weather {
  if (code <= 1) return 'clear'
  if (code <= 3) return 'cloudy'
  if (code === 45 || code === 48) return 'fog'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'storm'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  return 'cloudy'
}

/** a few words for the line under the room's name */
export const WEATHER_WORDS: Record<Weather, string> = {
  clear: 'clear',
  cloudy: 'cloudy',
  rain: 'raining',
  storm: 'thunderstorm',
  snow: 'snowing',
  fog: 'foggy',
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather | null> {
  const key = `${lat.toFixed(1)},${lon.toFixed(1)}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.weather
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day`
  const res = await fetch(url).catch(() => null)
  const body = res?.ok ? await res.json().catch(() => null) : null
  const code = body?.current?.weather_code
  const weather = typeof code === 'number' ? weatherFromCode(code) : null
  cache.set(key, { at: Date.now(), weather })
  return weather
}

/** the hour (with minutes as a fraction) right now in a time zone */
export function localHour(timeZone: string, now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(now)
    const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
    return get('hour') + get('minute') / 60
  } catch {
    return now.getHours() + now.getMinutes() / 60
  }
}

/** "7:42 pm", their time */
export function localTime(timeZone: string, now = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' })
      .format(now)
      .toLowerCase()
  } catch {
    return ''
  }
}

export function conditionsFor(
  timeZone: string,
  weather: Weather | null,
  now = new Date(),
): Conditions {
  return { phase: phaseAt(localHour(timeZone, now)), ...(weather ? { weather } : {}) }
}
