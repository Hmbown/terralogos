import { gatherTelemetrySnapshot, persistSnapshot, readLatestSnapshot } from '../_utils/telemetry';

export async function onRequest(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const force = url.searchParams.get('force') === '1';

  try {
    let snapshot = null;
    if (!force) {
      snapshot = await readLatestSnapshot(env);
    }

    if (!snapshot) {
      snapshot = await gatherTelemetrySnapshot();
      await persistSnapshot(env, snapshot).catch(() => {});
    }

    return new Response(JSON.stringify(snapshot), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err?.message || 'Snapshot unavailable' }), { status: 500 });
  }
}
