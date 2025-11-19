import { fetchVolcanoFeed } from '../_utils/telemetry';

export async function onRequest() {
  try {
    const data = await fetchVolcanoFeed();
    const simplified = data.map(({ name, lat, lon, status, id }) => ({
      name,
      lat,
      lon,
      status,
      id,
    }));

    return new Response(JSON.stringify(simplified), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=900',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e) {
    console.error('[API] VOLCANOES', e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
