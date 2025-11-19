import { fetchSeismicFeed } from '../_utils/telemetry';

export async function onRequest() {
  try {
    const data = await fetchSeismicFeed();
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[API] SEISMIC', err);
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch seismic data' }), { status: 500 });
  }
}
