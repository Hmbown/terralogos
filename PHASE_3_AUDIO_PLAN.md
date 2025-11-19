# Phase 3: Audio Sonification

To truly "listen" to the Earth, we will integrate a generative audio engine using `Tone.js`. This will translate the data streams into a cohesive soundscape.

## 1. The Resonance Chamber (Audio Engine)
Create `src/components/Hardware/Audio/ResonanceChamber.jsx`.
- **Responsibility:** Manage the global Audio Context and Master Volume.
- **Architecture:**
  - **Solar Voice:** FM Synth + Noise source. Pitch = Solar Flux; Filter = Wind Speed.
  - **Seismic Voice:** PolySynth. Triggers distinct "pings" or "rumbles" when `lastSeismicEvent` updates. Pitch mapped to Magnitude.
  - **Atmosphere Voice:** Pink Noise. Volume/Filter mapped to Temperature/CO2.

## 2. UI Integration
- **Modify `src/components/Dashboard/SystemStatus.jsx`**:
  - Add a `MUTE / UNMUTE` toggle switch.
  - Browser policies require user interaction to start audio.

## 3. Data Binding
- **Hook into `useHVCStore`**:
  - Subscribe to `metrics.solar` for continuous drone modulation.
  - Subscribe to `metrics.lastSeismicEvent` for transient triggers.
  - Subscribe to `metrics.crustTemp` for background texture.

## Technical Implementation
- Use `Tone.start()` on the first user interaction.
- Use `Tone.Transport` for timing if needed (or just reactive state).
- Ensure audio is subtle and ambient (Drone/Ambient style), not chaotic.

