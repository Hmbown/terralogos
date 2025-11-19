import { describe, it, expect } from 'vitest';
import { extractLatestSeismicEvent, sphericalToCartesian } from './telemetry';

describe('Telemetry Utils', () => {
  describe('sphericalToCartesian', () => {
    it('converts spherical coordinates to cartesian correctly', () => {
      // 0, 0 should be on the equator at prime meridian
      // In the function: 
      // phi = (90 - 0) = 90 deg = PI/2
      // theta = (0 + 180) = 180 deg = PI
      // x = -r * sin(PI/2) * cos(PI) = -r * 1 * -1 = r
      // z = r * sin(PI/2) * sin(PI) = r * 1 * 0 = 0
      // y = r * cos(PI/2) = r * 0 = 0
      // Expected: [r, 0, 0] (approx)
      
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
      // Intensity = (5.5 - 2.0) / 7.0 = 3.5 / 7.0 = 0.5
      expect(result.intensity).toBeCloseTo(0.5);
      expect(result.pos).toHaveLength(3);
    });
  });
});

