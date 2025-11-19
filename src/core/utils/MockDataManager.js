
/**
 * MockDataManager - Generates robust mock data for system testing and visual verification.
 * Simulates extreme system states (X-class flares, high magnitude earthquakes).
 */
class MockDataManager {
  constructor() {
    this.lastEarthquakeTime = Date.now();
    this.flareState = {
      class: 'A',
      intensity: 0.1,
      duration: 0,
      startTime: 0
    };
  }

  /**
   * Generates a full set of mock metrics
   */
  generateMetrics() {
    const now = Date.now();

    // Simulate solar flare cycle
    this.updateFlareState(now);

    return {
      coreLoad: 45 + Math.random() * 10, // 45-55%
      mantleBandwidth: 120 + Math.random() * 30, // 120-150 Tbps
      crustTemp: 14 + Math.random() * 2, // 14-16 C
      solarWindFlux: 350 + Math.random() * 100 + (this.flareState.intensity * 200), // Base + flare effect
      lastSeismicEvent: this.getMockSeismicEvent(now),
      earthquakeHistory: [], // This would be managed by the store accumulating events
      volcanoes: [], // Could generate these too if needed
      solar: {
        class: this.flareState.class,
        windSpeed: 400 + Math.random() * 50 + (this.flareState.intensity * 300),
        density: 5 + Math.random() * 5,
        temperature: 100000 + Math.random() * 50000
      },
      atmosphere: {
        ionization: 0.2 + (this.flareState.intensity * 0.5),
        pressure: 1013 + (Math.random() - 0.5) * 5
      },
      corticalClosure: 0.85 + Math.random() * 0.1, // Add this so SystemStatus is happy
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Updates the internal flare simulation state
   */
  updateFlareState(now) {
    // If active flare is over, reset or chance for new one
    if (now - this.flareState.startTime > this.flareState.duration) {
      // 1% chance per frame (assuming ~60fps call rate, or adjust based on call frequency)
      // For demo purposes, we want frequent events. Let's say 5% chance if we call this every second.
      if (Math.random() < 0.05) {
        const rand = Math.random();
        if (rand > 0.9) {
          this.flareState = { class: 'X', intensity: 1.0, duration: 10000, startTime: now };
        } else if (rand > 0.7) {
          this.flareState = { class: 'M', intensity: 0.7, duration: 15000, startTime: now };
        } else if (rand > 0.4) {
          this.flareState = { class: 'C', intensity: 0.4, duration: 20000, startTime: now };
        } else {
          this.flareState = { class: 'B', intensity: 0.2, duration: 25000, startTime: now };
        }
      } else {
        this.flareState = { class: 'A', intensity: 0.1, duration: 0, startTime: 0 };
      }
    }
  }

  /**
   * Generates a random seismic event occasionally
   */
  getMockSeismicEvent(now) {
    // Generate a new event every ~10 seconds
    if (now - this.lastEarthquakeTime > 10000) {
      this.lastEarthquakeTime = now;

      const magnitude = 2 + Math.pow(Math.random(), 3) * 7; // Bias towards smaller quakes, max ~9
      const lat = (Math.random() - 0.5) * 160; // Avoid poles
      const lon = (Math.random() - 0.5) * 360;

      return {
        id: `mock-${now}`,
        magnitude: parseFloat(magnitude.toFixed(1)),
        lat: lat,
        lon: lon,
        depth: 10 + Math.random() * 100,
        place: "Simulated Seismic Zone",
        time: new Date(now).toISOString(),
        intensity: magnitude / 9 // Normalized 0-1
      };
    }
    return null;
  }

  /**
   * Trigger a specific event type for testing
   * @param {string} type 'flare-X', 'quake-9', etc.
   */
  triggerEvent(type) {
    const now = Date.now();
    switch(type) {
      case 'flare-X':
        this.flareState = { class: 'X', intensity: 1.0, duration: 20000, startTime: now };
        return { message: "Triggered X-Class Flare" };
      case 'quake-9':
        this.lastEarthquakeTime = now - 11000; // Force next check to generate
        // Override the next generation logic slightly or just return a specific object to be handled
        // For simplicity, the getMockSeismicEvent will catch up on next tick,
        // or we could force return it here if the system supported it.
        // Let's return the event directly to be manually added if needed.
        return {
          id: `manual-mock-${now}`,
          magnitude: 9.5,
          lat: 35.6, // Tokyo approx
          lon: 139.6,
          depth: 30,
          place: "Manual Trigger: The Big One",
          time: new Date(now).toISOString(),
          intensity: 1.0
        };
      default:
        return { message: "Unknown event type" };
    }
  }
}

export const mockDataManager = new MockDataManager();
