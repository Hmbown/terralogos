import { fetchLatestCO2 } from '../_utils/telemetry';

export async function onRequest() {
  try {
    const payload = await fetchLatestCO2();
    return new Response(JSON.stringify(payload), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[API] CLIMATE', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
