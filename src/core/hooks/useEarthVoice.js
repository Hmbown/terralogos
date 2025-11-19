import { useEffect } from 'react';
import useHVCStore from '../store/useHVCStore';

const STREAM_ENDPOINT = '/api/stream';
const SNAPSHOT_ENDPOINT = '/api/snapshot';

export const useEarthVoice = () => {
  useEffect(() => {
    let eventSource;
    let reconnectTimer;
    let fallbackTimer;

    const applySnapshot = (payload) => {
      if (!payload || !payload.metrics) return;
      useHVCStore.setState((state) => ({
        metrics: {
          ...state.metrics,
          ...payload.metrics,
          lastUpdated: payload.timestamp || new Date().toISOString(),
        },
      }));
    };

    const requestSnapshot = async () => {
      try {
        const res = await fetch(SNAPSHOT_ENDPOINT);
        if (!res.ok) {
          console.error('[SYS] SNAPSHOT HTTP ERROR', res.status, res.statusText);
          throw new Error(`Snapshot fetch failed: ${res.status}`);
        }
        const data = await res.json();
        if (data && data.metrics) {
          applySnapshot(data);
          if (process.env.NODE_ENV === 'development') {
            console.log('[SYS] SNAPSHOT APPLIED', {
              seismic: data.metrics.lastSeismicEvent?.label || 'none',
              volcanoes: data.metrics.volcanoes?.length || 0,
              solar: data.metrics.solar?.class || 'none',
            });
          }
        } else {
          console.warn('[SYS] SNAPSHOT INVALID DATA', data);
        }
      } catch (err) {
        console.error('[SYS] SNAPSHOT FAILURE', err.message);
      }
    };

    const startFallback = () => {
      if (fallbackTimer) return;
      fallbackTimer = setInterval(requestSnapshot, 60000);
      requestSnapshot();
    };

    const stopFallback = () => {
      if (!fallbackTimer) return;
      clearInterval(fallbackTimer);
      fallbackTimer = null;
    };

    const connect = () => {
      eventSource = new EventSource(STREAM_ENDPOINT);

      const handleSnapshot = (event) => {
        try {
          const payload = JSON.parse(event.data);
          applySnapshot(payload);
        } catch (err) {
          console.error('[SYS] STREAM DECODE FAILURE', err);
        }
      };

      eventSource.addEventListener('snapshot', handleSnapshot);
      eventSource.addEventListener('status', (event) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[SYS] STREAM STATUS', event.data);
        }
      });
      eventSource.addEventListener('heartbeat', () => {
        // heartbeat keeps the connection warm
      });
      eventSource.addEventListener('error', (event) => {
        console.warn('[SYS] STREAM DATA ERROR', event.data);
      });

      eventSource.onopen = () => {
        console.log('[SYS] STREAM CONNECTED');
        stopFallback();
      };

      eventSource.onerror = (err) => {
        console.warn('[SYS] STREAM CONNECTION ERROR', err);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startFallback();
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            console.log('[SYS] RECONNECTING STREAM...');
            connect();
          }, 10000);
        }
      };
    };

    connect();
    requestSnapshot();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (fallbackTimer) clearInterval(fallbackTimer);
    };
  }, []);
};
