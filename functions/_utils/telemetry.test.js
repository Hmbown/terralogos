import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractLatestSeismicEvent, sphericalToCartesian, getTelemetry, readLatestSnapshot } from './telemetry';

// Mock global fetch for gatherTelemetrySnapshot calls
global.fetch = vi.fn();

// Mock console to keep tests clean
const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Telemetry Utils', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sphericalToCartesian', () => {
    it('converts spherical coordinates to cartesian correctly', () => {
      const radius = 4.2;
      const [x, y, z] = sphericalToCartesian(0, 0, radius);
      
      expect(x).toBeCloseTo(radius);
      expect(y).toBeCloseTo(0);
      expect(z).toBeCloseTo(0);
    });
  });

  describe('extractLatestSeismicEvent', () => {
    it('returns null for invalid data', () => {
      expect(extractLatestSeismicEvent(null)).toBeNull();
      expect(extractLatestSeismicEvent({ features: [] })).toBeNull();
    });

    it('extracts and transforms valid seismic data', () => {
      const mockData = {
        features: [
          {
            id: 'test-quake',
            geometry: {
              coordinates: [135.0, -35.0, 10.0] // lon, lat, depth
            },
            properties: {
              mag: 5.5,
              place: 'Test Location',
              time: 1678888888000
            }
          }
        ]
      };

      const result = extractLatestSeismicEvent(mockData);
      
      expect(result).not.toBeNull();
      expect(result.id).toBe('test-quake');
      expect(result.label).toBe('Test Location');
      expect(result.magnitude).toBe(5.5);
      expect(result.intensity).toBeCloseTo(0.5);
      expect(result.pos).toHaveLength(3);
    });
  });

  describe('getTelemetry (Caching Strategy)', () => {
    // Mock D1 Database
    const mockPrepare = vi.fn();
    const mockBind = vi.fn();
    const mockFirst = vi.fn();
    const mockRun = vi.fn();

    const mockEnv = {
      TERRA_DB: {
        prepare: mockPrepare,
      }
    };

    beforeEach(() => {
      mockPrepare.mockReturnValue({ bind: mockBind });
      mockBind.mockReturnValue({ first: mockFirst, run: mockRun });
    });

    it('returns cached data if fresh', async () => {
      const now = new Date();
      const freshData = {
        timestamp: now.toISOString(),
        metrics: { test: 'data' }
      };
      const payload = JSON.stringify(freshData);

      // Mock D1 returning a fresh row
      mockFirst.mockResolvedValue({ payload, updated_at: now.toISOString() });

      const result = await getTelemetry(mockEnv);

      expect(result).toEqual(freshData);
      // Should NOT fetch new data (fetch not called)
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('fetches new data if cache is stale', async () => {
      const oldDate = new Date(Date.now() - 70000); // 70s ago (stale > 60s)
      const staleData = {
        timestamp: oldDate.toISOString(),
        metrics: { val: 'old' }
      };

      // Mock D1 returning stale row
      mockFirst.mockResolvedValue({ payload: JSON.stringify(staleData), updated_at: oldDate.toISOString() });

      // Mock fetches for gatherTelemetrySnapshot
      // We need to mock ALL the fetches called by gatherTelemetrySnapshot
      // 1. Seismic
      // 2. Kp
      // 3. Solar Xray
      // 4. Solar Wind
      // 5. Solar Proton
      // 6. Volcanoes
      // 7. CO2
      // 8. Weather
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({}), // Return empty objects for simplicity
        text: async () => "",
      });

      const result = await getTelemetry(mockEnv);

      // Should have fetched (at least once)
      expect(global.fetch).toHaveBeenCalled();
      
      // Should have tried to persist (mockRun called twice: one for history, one for cache)
      expect(mockRun).toHaveBeenCalled();
    });
  });
});
