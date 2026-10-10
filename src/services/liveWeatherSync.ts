import type { WeatherState } from './weatherManager';

export interface LiveWeatherPayload {
  weather?: Array<{ main?: string; description?: string }>;
  main?: { temp?: number; humidity?: number };
  dt?: number;
  timezone?: number;
}

export interface LiveWeatherSnapshot {
  state: WeatherState;
  description: string;
  temperatureC: number | null;
  humidity: number | null;
  observedAt: number | null;
}

export function mapLiveWeatherToState(payload: LiveWeatherPayload): WeatherState {
  const main = payload.weather?.[0]?.main?.toLowerCase() ?? '';
  if (main.includes('thunder')) return 'Cyber-Storm';
  if (main.includes('rain') || main.includes('drizzle') || main.includes('snow')) return 'Rain';
  if (main.includes('mist') || main.includes('fog') || main.includes('haze')) return 'Cyber-Fog';
  return 'Clear';
}

export function normalizeLiveWeather(payload: LiveWeatherPayload): LiveWeatherSnapshot {
  return {
    state: mapLiveWeatherToState(payload),
    description: payload.weather?.[0]?.description ?? 'nepoznato',
    temperatureC: typeof payload.main?.temp === 'number' ? payload.main.temp : null,
    humidity: typeof payload.main?.humidity === 'number' ? payload.main.humidity : null,
    observedAt: typeof payload.dt === 'number' ? payload.dt : null,
  };
}

/** Fetches a server-side proxy endpoint; API keys never belong in this browser module. */
export async function fetchLiveWeather(endpoint: string, fetchImpl: typeof fetch = fetch): Promise<LiveWeatherSnapshot> {
  const response = await fetchImpl(endpoint, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Live weather HTTP ${response.status}`);
  return normalizeLiveWeather(await response.json() as LiveWeatherPayload);
}
