import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

/**
 * Convert lat/lon to 3D position on sphere
 */
const latLonToVector3 = (lat, lon, radius) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
};

/**
 * SingleEarthquakeMarker - Individual earthquake marker
 */
const SingleEarthquakeMarker = ({ earthquake, index, earthRadius = 4.2 }) => {
  const meshRef = useRef();
  const pulseRef = useRef(Math.random() * Math.PI * 2); // Random start phase

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Pulsing animation based on magnitude
    const magnitude = earthquake.magnitude || 0;
    pulseRef.current += delta * (2 + earthquake.intensity * 3);
    const scale = 1 + Math.sin(pulseRef.current) * 0.3 * (0.5 + earthquake.intensity * 0.5);
    meshRef.current.scale.setScalar(scale);
  });

  // Color based on magnitude
  const magnitude = earthquake.magnitude || 0;
  let color = '#00ffff'; // Cyan for small
  if (magnitude >= 5) color = '#ff0000'; // Red for large
  else if (magnitude >= 4) color = '#ff8800'; // Orange for medium

  // Calculate age-based opacity
  const now = Date.now();
  const eqTime = new Date(earthquake.time || earthquake.timestamp).getTime();
  const ageHours = (now - eqTime) / (1000 * 60 * 60);
  const opacity = Math.max(0.3, 1 - (ageHours / 48)); // Fade over 48 hours

  // Position on Earth surface
  let position;
  if (earthquake.pos) {
    // Already has 3D position
    position = earthquake.pos;
  } else if (earthquake.lat !== undefined && earthquake.lon !== undefined) {
    // Convert from lat/lon
    const vec = latLonToVector3(earthquake.lat, earthquake.lon, earthRadius);
    position = [vec.x, vec.y, vec.z];
  } else {
    // Fallback - don't render
    return null;
  }

  return (
    <group ref={meshRef} position={position}>
      {/* Outer pulsing ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity * 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner core */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={opacity * 0.9}
        />
      </mesh>
    </group>
  );
};

/**
 * SeismicMarker - Visual markers for earthquake events on the Earth surface
 * Shows pulsing ring effects at earthquake locations
 */
const SeismicMarker = () => {
  const earthquakeHistory = useHVCStore((state) => state.metrics.earthquakeHistory);
  const lastEvent = useHVCStore((state) => state.metrics.lastSeismicEvent);

  // Combine history with last event if it's not already in history
  const earthquakes = useMemo(() => {
    const history = earthquakeHistory || [];

    // Check if lastEvent is already in history
    if (lastEvent && lastEvent.id) {
      const isInHistory = history.some(eq => eq.id === lastEvent.id);
      if (!isInHistory) {
        return [...history, lastEvent];
      }
    }

    return history;
  }, [earthquakeHistory, lastEvent]);

  // Only show earthquakes with valid data
  const validEarthquakes = earthquakes.filter(eq =>
    eq && eq.id && (eq.pos || (eq.lat !== undefined && eq.lon !== undefined))
  );

  if (validEarthquakes.length === 0) return null;

  return (
    <group>
      {validEarthquakes.map((earthquake, index) => (
        <SingleEarthquakeMarker
          key={earthquake.id || index}
          earthquake={earthquake}
          index={index}
        />
      ))}
    </group>
  );
};

export default SeismicMarker;

