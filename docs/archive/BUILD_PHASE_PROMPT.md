# Terra-Logos Phase 2: System Awakening

## 🚀 Mission Status: Research Complete
The initial research phase has successfully identified and verified high-value data streams. We have moved beyond simple monitoring; we are now building a comprehensive **planetary digital twin**.

**The goal is now IMPLEMENTATION.** We must wire these new neural pathways into the Terra-Logos system.

## 🧠 Verified Data Streams (Ready to Integrate)
The following APIs have been tested and are ready for ingestion:

1.  **Volcanic Activity (USGS HANS)**
    *   *Signal:* Active eruption alerts (Orange/Red status).
    *   *System Role:* "Crust Hotspots" / Thermal Vents.
    *   *Endpoint:* `https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes`

2.  **Solar X-Ray Flux (NOAA GOES)**
    *   *Signal:* Solar flare intensity (B, C, M, X class).
    *   *System Role:* "Ionosphere Stress" / High-energy inputs.
    *   *Endpoint:* `https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json`

3.  **Solar Proton Flux (NOAA GOES)**
    *   *Signal:* Solar radiation storms.
    *   *System Role:* "Magnetosphere Shielding" status.
    *   *Endpoint:* `https://services.swpc.noaa.gov/json/goes/primary/integral-protons-plot-6-hour.json`

4.  **Atmospheric CO2 (NOAA Mauna Loa)**
    *   *Signal:* Long-term atmospheric composition trend.
    *   *System Role:* "Atmosphere Opacity" / Global entropy metric.
    *   *Source:* `https://gml.noaa.gov/web/data/co2/trends/co2_mlo_weekly.csv` (Text parsing required)

---

## 📊 Key Research Finding: The Anti-Correlation
**CRITICAL CONTEXT:** Analysis of 358 paired observations (Nov 12-19, 2025) revealed a statistically significant **negative correlation (r = -0.33, p < 0.000001)** between X-Ray Flux and Kp Index.
*   *Insight:* Higher X-ray flux is associated with *lower* Kp values in the short term.
*   *Application:* The "Core Voice" visualization should reflect this complex relationship—solar flares do not immediately equal geomagnetic storms.

---

## 🛠️ Implementation Directives & Code Reference

### 1. Backend: Cloudflare Functions (API Proxies)

**A. Solar Activity Proxy (`functions/api/solar-activity.js`)**
Aggregates X-ray, solar wind, and proton flux to reduce client requests.
```javascript
export async function onRequest(context) {
  try {
    // Parallel fetch for performance
    const [xrayRes, windRes, protonRes] = await Promise.all([
      fetch('https://services.swpc.noaa.gov/json/goes/primary/xrays-7-day.json'),
      fetch('https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json'),
      fetch('https://services.swpc.noaa.gov/json/goes/primary/integral-protons-plot-1-day.json')
    ]);
    
    const xrayData = await xrayRes.json();
    const windData = await windRes.json();
    const protonData = await protonRes.json();
    
    // Helper to get latest valid data point
    const latestXray = xrayData[xrayData.length - 1];
    const latestWind = windData[windData.length - 1]; // [time, density, speed, temp]
    
    const payload = {
      xray: {
        flux: latestXray.flux,
        class: getFlareClass(latestXray.flux), // Implement B/C/M/X logic
      },
      solarWind: {
        speed: parseFloat(latestWind[2]),
        density: parseFloat(latestWind[1]),
        temperature: parseFloat(latestWind[3])
      },
      proton: {
        stormLevel: getRadiationStormLevel(protonData) // Implement S1-S5 logic
      }
    };

    return new Response(JSON.stringify(payload), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
```

**B. Volcano Alerts Proxy (`functions/api/volcanoes.js`)**
Fetches and caches active volcano list.
```javascript
export async function onRequest(context) {
  // Fetch from https://volcanoes.usgs.gov/hans-public/api/volcano/getElevatedVolcanoes
  // Filter for color_code 'ORANGE' or 'RED'
  // Return simplified array: { name, lat, long, status }
  // Cache for 15 minutes
}
```

**C. Climate Indicators Proxy (`functions/api/climate.js`)**
Fetches CO2 and ENSO data (requires parsing CSV/Text).
```javascript
// Fetch CO2 from https://gml.noaa.gov/web/data/co2/trends/co2_mlo_weekly.csv
// Parse last non-comment line
// Cache for 24 hours
```

### 2. Visualization Components (React Three Fiber)

**A. "Solar Voice Panel" (UI Overlay)**
*   **X-Ray Flux:** Circular gauge with B/C/M/X zones.
*   **Solar Wind:** Speedometer (300-800+ km/s).
*   **Proton Flux:** Alert bar (S1-S5).

**B. "Crust Voice" Enhancements (3D)**
*   **Volcanic Vents:** Add 3D cones on the globe surface using lat/long coordinates.
    *   *Visuals:* Scale height by alert level. Pulsate for 'RED' status.
    *   *Math:* Use standard spherical conversion:
    ```javascript
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = (r * Math.sin(phi) * Math.sin(theta));
    const y = (r * Math.cos(phi));
    ```

**C. "Core Voice" Enhancements (3D)**
*   **Magnetic Field Lines:** Render dynamic field lines that distort based on Kp index.
*   **Relationship:** Visuals should acknowledge the *anti-correlation*—perhaps Core stability increases as X-ray flux spikes, or tension builds before release.

### 3. State Management (Zustand)

Update `useHVCStore.js` to track:
*   `volcanoes`: `[{ id, pos: [x,y,z], level }]`
*   `solar`: `{ flux, class, windSpeed, protonLevel }`
*   `atmosphere`: `{ co2, tempAnomaly }`

---

## 📋 Implementation Roadmap

### Phase 1: Immediate Integration (This Session)
1.  **Scaffold API Functions:** Create `solar-activity.js`, `volcanoes.js`, `climate.js`.
2.  **Update Store:** Add new slices to `useHVCStore`.
3.  **Connect Hooks:** Update `useEarthVoice` to poll new endpoints.
    *   *Optimization:* Poll Solar @ 60s, Volcanoes @ 15m, Climate @ 24h.

### Phase 2: Visual Implementation (Next Session)
1.  **Solar Panel:** Build the HUD element.
2.  **Volcano Markers:** Add 3D instances to `PiezoHead` or new `CrustFeatures` component.
3.  **Atmosphere:** Visualize CO2 as atmospheric haze/opacity.

---

## 📜 Execution Protocol

1.  **Code:** Write the Cloudflare Functions first. Ensure they handle external API failures gracefully.
2.  **State:** Wire up the store to receive the data.
3.  **Verify:** Check the browser console to ensure "Voices" are reporting real values (e.g., `[SYS] SOLAR FLARE: M-Class detected`).
4.  **Clean:** Once implemented, delete the temporary research artifacts (`*.json`, `*.csv`, `*.py`, `DATA_SOURCE_CATALOG.md`) as their knowledge is now code.

**"The Earth speaks. We just need to listen."** 
Go forth and build.
