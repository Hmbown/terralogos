import React from 'react';
import { create } from 'zustand';
import { mockDataManager } from '../utils/MockDataManager';

const normalizeData = (metrics) => {
  const defaults = {
    coreLoad: 0,
    mantleBandwidth: 0,
    crustTemp: 0,
    solarWindFlux: 0,
    lastSeismicEvent: null,
    earthquakeHistory: [],
    volcanoes: [],
    solar: { class: 'A', windSpeed: 300, density: 5 },
    atmosphere: { ionization: 0, pressure: 1013 },
    lastUpdated: new Date().toISOString(),
  };

  return {
    ...defaults,
    ...metrics,
    solar: { ...defaults.solar, ...(metrics?.solar || {}) },
    atmosphere: { ...defaults.atmosphere, ...(metrics?.atmosphere || {}) },
  };
};

const useHVCStore = create((set, get) => ({
  // Data State
  data: {
    metrics: normalizeData({}),
    history: {
      data: [],
      loading: false,
      error: null,
      pagination: null,
      filters: null,
    },
    isStale: false,
    lastFetch: null,
  },

  // UI State
  ui: {
    viewMode: 'live', // 'live', 'history', 'about'
    selectedTimeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    },
    theme: 'dark',
    isMockMode: false, // Toggle for dev/demo
  },

  // Actions
  actions: {
    setMockMode: (isMock) => set((state) => ({
      ui: { ...state.ui, isMockMode: isMock }
    })),

    updateMetrics: (newMetrics) => {
      const currentHistory = get().data.metrics.earthquakeHistory;
      const normalized = normalizeData(newMetrics);

      // If we have a new seismic event, handle history
      let updatedHistory = currentHistory;
      if (normalized.lastSeismicEvent) {
        const now = Date.now();
        const fortyEightHours = 48 * 60 * 60 * 1000;

        updatedHistory = [
          ...currentHistory.filter(eq => {
            const eqTime = new Date(eq.time || eq.timestamp).getTime();
            return now - eqTime < fortyEightHours;
          }),
          normalized.lastSeismicEvent
        ]
        // Deduplicate by ID if exists
        .filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i)
        .slice(-50);
      }

      set((state) => ({
        data: {
          ...state.data,
          metrics: {
            ...normalized,
            earthquakeHistory: updatedHistory
          },
          lastFetch: Date.now(),
          isStale: false
        }
      }));
    },

    checkStaleness: () => {
      const { lastFetch } = get().data;
      if (!lastFetch) return;
      const isStale = Date.now() - lastFetch > 5 * 60 * 1000; // 5 mins
      set((state) => ({
        data: { ...state.data, isStale }
      }));
    },

    // Manual trigger for testing
    triggerMockEvent: (type) => {
      if (type.startsWith('quake')) {
        const event = mockDataManager.triggerEvent(type);
        if (event.id) { // It's a quake
             get().actions.updateMetrics({
                 ...get().data.metrics,
                 lastSeismicEvent: event
             });
        }
      } else {
        mockDataManager.triggerEvent(type);
        // The next poll will pick up the flare state
      }
    },

    setViewMode: (mode) => set((state) => ({ ui: { ...state.ui, viewMode: mode } })),

    setTimeRange: (start, end) => set((state) => ({
      ui: { ...state.ui, selectedTimeRange: { start, end } }
    })),
  },

  // Convenience accessors (compatibility with old code)
  metrics: normalizeData({}), // This will be static initial state, components should use store.data.metrics
}));

// Hook to drive mock data if enabled
export const useMockDataGenerator = (enabled = false) => {
  const updateMetrics = useHVCStore((state) => state.actions.updateMetrics);

  React.useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const metrics = mockDataManager.generateMetrics();
      updateMetrics(metrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, updateMetrics]);
};

// Support for direct store subscription in non-React context if needed
// or just export the store
export default useHVCStore;
