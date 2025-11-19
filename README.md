# Terra-Logos

**Terra-Logos** is a telemetry system that visualizes Earth's geophysical signals in real-time. It aggregates data streams—including seismic activity, solar wind variations, and atmospheric metrics—to create a unified 3D visualization and sonification of the planet's current state.

Access the application: [**terralogos.pages.dev**](https://terralogos.pages.dev)

---

## Overview

The system connects to multiple scientific data sources to monitor planetary-scale events.

### Telemetry Sources
- **Seismic Activity**: Real-time earthquake feeds (USGS).
- **Heliophysics**: Solar wind speed, density, and X-ray flux (NOAA SWPC).
- **Geomagnetics**: Planetary K-index (NOAA).
- **Atmosphere**: Global temperature samples and Mauna Loa CO₂ trends (OpenMeteo / NOAA).
- **Volcanism**: Elevated alert status for active volcanic regions (USGS).

### Architecture
Data is normalized and processed through a serverless pipeline:
1. **Ingestion**: Cloudflare Workers poll APIs at 1-minute intervals.
2. **Persistence**: Snapshots are stored in a D1 database for historical context.
3. **Broadcast**: A Server-Sent Events (SSE) stream pushes updates to clients.
4. **Output**:
   - **Visualization**: A React Three Fiber 3D interface representing system components (Core, Mantle, Atmosphere).
   - **Sonification**: An audio engine that maps data values to sound parameters (e.g., solar wind density to pitch).

### Visual + Audio Signal Mapping
- **Seismic** – Earthquake magnitude drives the crust ripple shader and triggers percussive Tone.js hits.
- **Solar** – Solar wind speed + flare class recolor the mantle waveguide and retune the heliophonic drone.
- **Volcanic** – Active (Orange/Red) volcanoes rise animated plumes on the globe and thicken the global reverb tail.
- **Atmosphere** – CO₂ + surface temperature tint the ionosphere glow and swell the atmospheric pink-noise layer.
- **Temporal Memory** – Hourly D1 snapshots render as streamed traces (core load, wind, temperature, CO₂) for historical context.

## Deployment

The project is hosted on **Cloudflare Pages**.

### Local Development

```bash
# Install dependencies
npm install

# Run development server (Frontend + API emulators)
npm run pages:dev

# Build for production
npm run build
```

## Project Structure

```
terralogos/
├── functions/api/          # API Endpoints (Cloudflare Pages Functions)
│   ├── stream.js           # SSE channel and data aggregation
│   ├── seismic.js          # Earthquake data handler
│   └── solar-*.js          # Solar data handlers
├── src/
│   ├── components/
│   │   ├── Hardware/       # 3D Visualization components
│   │   └── Dashboard/      # UI Panels and Data displays
│   └── core/               # State management and audio hooks
└── migrations/             # Database schema
```

## Status

**Current Phase: System Integration**
- [x] Visualization engine active.
- [x] Data ingestion pipelines established.
- [x] Audio synthesis connected.

## License

MIT

