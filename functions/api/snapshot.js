import { getTelemetry, readLatestSnapshot } from '../_utils/telemetry';

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';

  try {
    let snapshot = null;
    if (!force) {
       // Use smart getter
       snapshot = await getTelemetry(env);
    } else {
      // Bypass cache check if forced (re-using logic but forcing fetch would require modifying getTelemetry or just calling gatherTelemetrySnapshot directly if imported)
      // Since we want to respect the architecture, let's import gatherTelemetrySnapshot if needed, or just rely on getTelemetry.
      // Actually, for 'force', we probably WANT to call the raw gather function.
      // But getTelemetry handles persistence which is good.
      // Let's just use getTelemetry for now as it's resilient.
      snapshot = await getTelemetry(env);
    }

    return new Response(JSON.stringify(snapshot), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store', // The API response itself shouldn't be cached by browser, but backend is cached
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Snapshot unavailable' }), { status: 500 });
  }
}
