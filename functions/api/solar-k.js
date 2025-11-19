import { fetchKpIndex } from '../_utils/telemetry';

export async function onRequest() {
  try {
    const payload = await fetchKpIndex();
    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[API] SOLAR_K', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch solar K-index data' }), { status: 500 });
  }
}
