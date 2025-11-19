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
        if (!res.ok) throw new Error('Snapshot fetch failed');
        const data = await res.json();
        applySnapshot(data);
      } catch (err) {
        console.error('[SYS] SNAPSHOT FAILURE', err);
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
        console.log('[SYS] STREAM STATUS', event.data);
      });
      eventSource.addEventListener('heartbeat', () => {
        // heartbeat keeps the connection warm
      });
      eventSource.addEventListener('error', (event) => {
        console.warn('[SYS] STREAM ERROR', event.data);
      });

      eventSource.onopen = () => {
        console.log('[SYS] STREAM CONNECTED');
        stopFallback();
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        startFallback();
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
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
