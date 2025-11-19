import {
  getTelemetry,
  readLatestSnapshot,
  formatSseMessage,
} from '../_utils/telemetry';

const DEFAULT_STREAM_INTERVAL = 60000;
const DEFAULT_KEEPALIVE = 15000;

export function onRequest(context) {
  const { env, request } = context;
  const intervalMs = Number(env?.STREAM_INTERVAL_MS || DEFAULT_STREAM_INTERVAL);
  const keepAliveMs = Number(env?.STREAM_KEEPALIVE_MS || DEFAULT_KEEPALIVE);

  let closeRef = null;

  const stream = new ReadableStream({
    start(controller) {
      let cancelled = false;

      const send = (event, data) => {
        if (cancelled) return;
        controller.enqueue(formatSseMessage(event, data));
      };

      const pushSnapshot = async () => {
        if (cancelled) return;
        try {
          // Use smart getter with caching/resilience
          const snapshot = await getTelemetry(env);
          send('snapshot', snapshot);
        } catch (err) {
          send('error', { message: err?.message || 'Telemetry collection failed' });
        }
      };

      // Send initial cached state immediately if available (fast render)
      readLatestSnapshot(env)
        .then((cached) => {
          if (cached) {
            send('snapshot', cached);
          }
        })
        .catch(() => {});

      send('status', { message: 'STREAM_ONLINE', intervalMs });
      // Start polling immediately (will use cache if fresh)
      pushSnapshot();

      const pollId = setInterval(pushSnapshot, intervalMs);
      const heartbeatId = setInterval(() => {
        send('heartbeat', { ts: new Date().toISOString() });
      }, keepAliveMs);

      const close = () => {
        if (cancelled) return;
        cancelled = true;
        clearInterval(pollId);
        clearInterval(heartbeatId);
        request.signal.removeEventListener('abort', close);
        try {
          controller.close();
        } catch {
          // Ignore close race conditions
        }
      };

      request.signal.addEventListener('abort', close);
      closeRef = close;
    },
    cancel() {
      if (closeRef) closeRef();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
