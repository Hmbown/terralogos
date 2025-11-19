import { fetchWeatherSample } from '../_utils/telemetry';

export async function onRequest() {
  try {
    const payload = await fetchWeatherSample();
    return new Response(JSON.stringify(payload.raw ?? payload), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[API] WEATHER', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch weather data' }), { status: 500 });
  }
}
