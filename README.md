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
- **Atmosphere**: Global temperature samples, Wind Speed, and Mauna Loa CO₂ trends (OpenMeteo / NOAA / Scripps).
- **Volcanism**: Elevated alert status for active volcanic regions (USGS).
- **Satellites**: Real-time ISS telemetry (WhereTheISS.at).

### Architecture
Data is normalized and processed through a serverless pipeline:
1. **Ingestion**: Cloudflare Workers poll APIs at 1-minute intervals.
2. **Persistence**: Snapshots are stored in a D1 database for historical context and caching.
3. **Broadcast**: A Server-Sent Events (SSE) stream pushes updates to clients.
4. **Output**:
   - **Visualization**: A React Three Fiber 3D interface representing system components (Core, Mantle, Atmosphere, Orbit).
   - **Sonification**: An audio engine that maps data values to sound parameters (e.g., solar wind density to pitch).
   - **Immersion**: WebXR support for VR/AR exploration.

### Visual + Audio Signal Mapping
- **Seismic** – Earthquake magnitude drives the crust ripple shader and triggers spatially panned percussive Tone.js hits.
- **Solar** – Solar wind speed + flare class recolor the mantle waveguide and retune the heliophonic drone. Major flares trigger atmospheric ionization effects.
- **Volcanic** – Active (Orange/Red) volcanoes rise animated plumes on the globe and thicken the global reverb tail.
- **Atmosphere** – CO₂ + surface temperature tint the ionosphere glow and swell the atmospheric pink-noise layer. Wind speed drives cloud rotation.
- **Orbit** – Real-time ISS tracking marker.
- **Temporal Memory** – Hourly D1 snapshots render as streamed traces (core load, wind, temperature, CO₂) for historical context.

## Features

### 🌍 **Advanced Earth Visualization**
- **Physically-Based Rendering**: Custom GLSL shaders with bump mapping, specular highlights, and Fresnel rim lighting
- **Dual Cloud Layers**: Independent animated cloud systems with realistic movement
- **Atmospheric Scattering**: Rayleigh + Mie scattering for realistic blue sky and sunset colors
- **Dynamic Day/Night Cycle**: Smooth terminator transition with enhanced city lights at twilight
- **LOD System**: 3-level detail optimization (64/32/16 segments) for smooth performance

### 📡 **Live Data Overlays**
- **Weather Particles**: 160 storm cells driven by real-time wind and ionization data
- **Flight Paths**: Animated orbital arcs connecting major cities worldwide
- **ISS Tracking**: Real-time International Space Station position
- **Aurora Visualization**: Dynamic polar auroras responsive to solar activity
- **Magnetosphere**: Dipole field lines showing Earth's magnetic structure

### 🎵 **Spatial Audio**
- **Seismic Events**: 3D-positioned earthquake sounds (Tone.js)
- **Solar Wind**: Heliophonic drone reacting to solar activity
- **Atmospheric Layer**: Wind-driven pink noise
- **Volcanic Events**: Reverb modulation for active volcanoes

### 🥽 **WebXR Support**
- Full VR mode for immersive planetary exploration
- Compatible with major VR headsets

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server (Frontend only - mock data)
npm run dev

# Run full stack (Frontend + Cloudflare Workers API)
npm run pages:dev:watch

# Build for production
npm run build
```

### Deployment

```bash
# Deploy to Cloudflare Pages
npm run pages:deploy
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
terralogos/
├── docs/                    # Documentation
│   ├── development/         # Code reviews and testing guides
│   ├── archive/             # Historical planning documents
│   ├── DEPLOYMENT.md        # Production deployment guide
│   └── QUICK_DEPLOY.md      # Quick reference
├── functions/
│   ├── _utils/              # Shared utilities (telemetry, caching)
│   └── api/                 # API Endpoints (Cloudflare Pages Functions)
│       ├── stream.js        # SSE channel and data aggregation
│       ├── seismic.js       # Earthquake data (USGS)
│       ├── solar-*.js       # Solar data (NOAA SWPC)
│       ├── weather.js       # Atmospheric data (OpenMeteo)
│       └── climate.js       # CO₂ data (Scripps)
├── migrations/              # Cloudflare D1 database schema
├── public/
│   └── textures/            # Earth surface textures (2K resolution)
├── src/
│   ├── components/
│   │   ├── Hardware/
│   │   │   ├── EarthBase/   # Earth globe + atmosphere + overlays
│   │   │   ├── CoreMHD/     # Magnetosphere visualization
│   │   │   ├── CrustInterface/ # Seismic + volcanic markers
│   │   │   ├── AtmosphereSink/ # Ionosphere effects
│   │   │   └── Audio/       # Spatial audio engine
│   │   ├── Dashboard/       # UI panels and data displays
│   │   └── Navigation/      # Mobile menu
│   └── core/
│       ├── hooks/           # useEarthVoice (audio + SSE)
│       ├── store/           # Zustand state management
│       └── utils/           # Helpers
├── docker-compose.yml       # Local D1 development
├── wrangler.toml            # Cloudflare Workers config
└── vite.config.js           # Build configuration
```

## Technology Stack

- **Frontend**: React 19, Three.js, React Three Fiber, @react-three/drei, @react-three/xr
- **Audio**: Tone.js (Web Audio API)
- **State**: Zustand
- **Backend**: Cloudflare Pages Functions (Serverless Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Build**: Vite
- **Deployment**: Cloudflare Pages

## Performance

- **60 FPS** on mid-range GPUs (GTX 1660+)
- **LOD optimization** maintains performance at all camera distances
- **GPU instancing** for efficient particle rendering
- **D1 caching** reduces API load and improves resilience
- **Stale-while-revalidate** ensures continuous data availability

## Recent Updates (Nov 2025)

✨ **Major Enhancement: Advanced Earth Rendering**
- Physically-based atmospheric scattering shader
- Dual animated cloud layers with weather integration
- Enhanced surface shader with bump/specular mapping
- LOD system for performance optimization
- Weather and flight path overlays
- **Code Quality**: 9/10 ([See Review](docs/development/REVIEW_SUMMARY.md))

## Documentation

- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment to Cloudflare
- **[Quick Deploy](docs/QUICK_DEPLOY.md)** - Fast deployment reference
- **[Verification Report](docs/development/VERIFICATION_REPORT.md)** - Technical code review
- **[Visual Testing](docs/development/VISUAL_TEST_CHECKLIST.md)** - Browser testing guide
- **[Texture Audit](docs/development/TEXTURE_AUDIT.md)** - Asset management

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test thoroughly (see [Visual Test Checklist](docs/development/VISUAL_TEST_CHECKLIST.md))
4. Submit a pull request

## Credits

### Data Sources
- **USGS** - Earthquake and volcanic activity data (public domain)
- **NOAA SWPC** - Solar wind and geomagnetic data (public domain)
- **Scripps CO₂ Program** - Atmospheric CO₂ measurements (public domain)
- **OpenMeteo** - Global weather data (open-source)
- **WhereTheISS.at** - ISS tracking API

### Textures
- Earth surface textures sourced from NASA Visible Earth (public domain)

## License

MIT

---

**Built with ❤️ for Earth observation and planetary data visualization**
