import { create } from 'zustand';

const useHVCStore = create((set) => ({
  // Real-time metrics (populated from API, no fake defaults)
  metrics: {
    coreLoad: null,
    mantleBandwidth: null,
    crustTemp: null,
    solarWindFlux: null,
    lastSeismicEvent: null,
    volcanoes: [],
    solar: null,
    atmosphere: null,
    lastUpdated: null,
  },
  meta: {
    timestamp: null,
    sources: {},
  },
  
  // Historical data
  history: {
    data: [],
    loading: false,
    error: null,
    pagination: null,
    filters: null,
  },
  
  // UI state
  viewMode: 'live', // 'live', 'history', 'about'
  selectedTimeRange: {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  },
  
  // Legacy status (may be removed or repurposed)
  status: {
    corticalClosure: 0,
    watcherAlert: false,
  },

  // Actions
  updateMetric: (key, value) => set((state) => ({
    metrics: { 
      ...state.metrics, 
      [key]: value,
      lastUpdated: new Date().toISOString()
    }
  })),
  
  setViewMode: (mode) => set({ viewMode: mode }),
  
  setTimeRange: (start, end) => set({
    selectedTimeRange: { start, end }
  }),
  
  setHistory: (data, pagination, filters = null) => set({
    history: {
      data,
      pagination,
      filters,
      loading: false,
      error: null,
    }
  }),
  
  setHistoryLoading: (loading) => set((state) => ({
    history: { ...state.history, loading }
  })),
  
  setHistoryError: (error) => set((state) => ({
    history: { ...state.history, error, loading: false }
  })),
}));

export default useHVCStore;
