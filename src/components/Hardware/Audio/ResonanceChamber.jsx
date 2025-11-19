import React, { useEffect, useRef } from 'react';
import * as Tone from 'tone';
import useHVCStore from '../../../core/store/useHVCStore';

const ResonanceChamber = ({ active }) => {
  const metrics = useHVCStore((state) => state.metrics);
  
  // Refs for Audio Nodes
  const masterGain = useRef(null);
  const solarDrone = useRef(null); // FM Synth
  const solarFilter = useRef(null);
  const seismicSynth = useRef(null); // PolySynth
  const atmosNoise = useRef(null); // Pink Noise
  const atmosFilter = useRef(null);

  // Track previous seismic event to trigger only on change
  const prevSeismicLabel = useRef(metrics.lastSeismicEvent?.label);

  // --- INIT AUDIO ENGINE ---
  useEffect(() => {
    // 1. Master Output
    masterGain.current = new Tone.Gain(0.5).toDestination();
    const limiter = new Tone.Limiter(-2).connect(masterGain.current);

    // 2. Solar Drone (The continuous hum of the heliosphere)
    solarFilter.current = new Tone.Filter(200, "lowpass").connect(limiter);
    solarDrone.current = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 3,
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 0, sustain: 1, release: 4 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    }).connect(solarFilter.current);
    solarDrone.current.volume.value = -20; // Subtle background

    // 3. Seismic Voice (Transient pings)
    const reverb = new Tone.Reverb(3).connect(limiter);
    seismicSynth.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.01, decay: 0.3, sustain: 0.1, release: 1 }
    }).connect(reverb);
    seismicSynth.current.volume.value = -5;

    // 4. Atmosphere Haze (Background Texture)
    atmosFilter.current = new Tone.AutoFilter({
        frequency: 0.1,
        baseFrequency: 200,
        octaves: 2
    }).connect(limiter);
    
    atmosNoise.current = new Tone.Noise("pink").connect(atmosFilter.current);
    atmosNoise.current.volume.value = -30; // Very quiet hiss
    
    return () => {
      // Cleanup
      if (solarDrone.current) {
        solarDrone.current.dispose();
        solarDrone.current = null;
      }
      if (seismicSynth.current) {
        seismicSynth.current.dispose();
        seismicSynth.current = null;
      }
      if (atmosNoise.current) {
        atmosNoise.current.dispose();
        atmosNoise.current = null;
      }
      if (atmosFilter.current) {
        atmosFilter.current.dispose();
        atmosFilter.current = null;
      }
      if (masterGain.current) {
        masterGain.current.dispose();
        masterGain.current = null;
      }
    };
  }, []);

  // --- HANDLE MUTE/UNMUTE ---
  useEffect(() => {
    if (!solarDrone.current || !atmosNoise.current || !atmosFilter.current) return;

    if (active) {
      // Only start audio context after user interaction (button click)
      // This prevents the AudioContext warnings
      Tone.start()
        .then(() => {
          Tone.Destination.mute = false;
          // Start Generators after context is resumed
          solarDrone.current.triggerAttack("C2");
          atmosNoise.current.start();
          atmosFilter.current.start();
        })
        .catch((err) => {
          console.warn('[AUDIO] Failed to start audio context:', err);
        });
    } else {
      Tone.Destination.mute = true;
      if (solarDrone.current) solarDrone.current.triggerRelease();
      if (atmosNoise.current) atmosNoise.current.stop();
      if (atmosFilter.current) atmosFilter.current.stop();
    }
  }, [active]);

  // --- REACT TO DATA STREAMS ---
  useEffect(() => {
    if (!active || !solarFilter.current || !solarDrone.current || !atmosNoise.current || !atmosFilter.current) return;

    // A. SOLAR MODULATION
    // Wind speed (300 - 800 km/s) maps to Filter Freq & Modulation
    const wind = metrics.solar?.windSpeed || 400;
    const normWind = Math.min(Math.max((wind - 300) / 500, 0), 1);
    
    if (solarFilter.current) {
        // More wind = brighter sound
        solarFilter.current.frequency.rampTo(200 + (normWind * 800), 2); 
    }
    if (solarDrone.current) {
        // More wind = more chaotic modulation
        solarDrone.current.modulationIndex.rampTo(3 + (normWind * 10), 2);
    }

    // B. ATMOSPHERE MODULATION
    // CO2 / Temp maps to Noise volume/density
    const temp = metrics.crustTemp ?? 300; // Kelvin
    // Hotter = Louder, more agitated noise
    const normTemp = Math.min(Math.max((temp - 273) / 50, 0), 1);
    
    if (atmosNoise.current) {
        atmosNoise.current.volume.rampTo(-30 + (normTemp * 10), 5);
    }
    if (atmosFilter.current) {
        atmosFilter.current.frequency.value = 0.1 + (normTemp * 2); // Faster swirling
    }

    // C. SEISMIC TRIGGERS
    const currentLabel = metrics.lastSeismicEvent?.label;
    const intensity = metrics.lastSeismicEvent?.intensity ?? 0;

    if (currentLabel !== prevSeismicLabel.current) {
        // New Event Detected!
        prevSeismicLabel.current = currentLabel;
        
        // Map intensity (0-1) to Pitch
        // Low intensity = High pitch ping
        // High intensity = Deep rumble
        // Actually, let's do: Big earthquake = Deep, scary chord. Small = High tick.
        
        if (intensity > 0.5) {
            // Big Event (> Mag 5.5)
            seismicSynth.current.triggerAttackRelease(["C2", "C3", "G2"], "4n");
        } else {
            // Small Event
            const note = ["C5", "E5", "G5", "B5"][Math.floor(Math.random() * 4)];
            seismicSynth.current.triggerAttackRelease(note, "8n");
        }
        
        console.log(`[AUDIO] Seismic Pulse: ${intensity.toFixed(2)}`);
    }

  }, [metrics, active]);

  return null; // This component has no visual output
};

export default ResonanceChamber;
