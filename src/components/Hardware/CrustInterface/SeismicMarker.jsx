import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

// Vertex Shader: Standard plane
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader: Expanding Ripple
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uOpacity;

  varying vec2 vUv;

  void main() {
    // Center is 0.5, 0.5
    vec2 center = vec2(0.5);
    float dist = distance(vUv, center);

    // Create ripples
    // Ring 1: Expanding from center
    float speed = 2.0;
    float t = uTime * speed;

    // Single expanding wave look
    // A wave is a value that peaks at a certain radius (t)

    // Make multiple waves that repeat
    float wave = sin(dist * 40.0 - t * 5.0);

    // Soften
    float ring = smoothstep(0.4, 0.5, wave) * smoothstep(0.6, 0.5, wave);

    // Mask circle
    float circle = 1.0 - smoothstep(0.4, 0.5, dist);

    // Core intensity
    float core = 1.0 - smoothstep(0.0, 0.1, dist);

    // Combine
    float alpha = (ring * 0.5 + core * 0.8) * circle * uOpacity;

    // Fade out over distance from center
    alpha *= (1.0 - dist * 2.0);

    gl_FragColor = vec4(uColor, alpha);
  }
`;

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

const SingleEarthquakeMarker = ({ earthquake, index, earthRadius = 4.2 }) => {
  const meshRef = useRef();

  // Color based on magnitude
  const magnitude = earthquake.magnitude || 0;
  let color = new THREE.Color('#00ffff');
  if (magnitude >= 7) color = new THREE.Color('#ff0000');
  else if (magnitude >= 5) color = new THREE.Color('#ff8800');
  else if (magnitude >= 3) color = new THREE.Color('#ffff00');

  // Calculate age-based opacity
  const now = Date.now();
  const eqTime = new Date(earthquake.time || earthquake.timestamp).getTime();
  const ageHours = (now - eqTime) / (1000 * 60 * 60);
  const opacity = Math.max(0.0, 1 - (ageHours / 24)); // Fade over 24 hours for visuals

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: color },
    uOpacity: { value: opacity }
  }), [color, opacity]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime + index * 100;
      // Look at center of earth (0,0,0) so the plane is tangent to surface
      meshRef.current.lookAt(0, 0, 0);
    }
  });

  if (opacity <= 0) return null;

  // Position
  let position;
  if (earthquake.pos) {
    position = new THREE.Vector3(...earthquake.pos);
  } else if (earthquake.lat !== undefined && earthquake.lon !== undefined) {
    position = latLonToVector3(earthquake.lat, earthquake.lon, earthRadius);
  } else {
    return null;
  }

  // Scale based on magnitude
  const size = 0.3 + (magnitude / 10) * 1.0;

  return (
    <mesh ref={meshRef} position={position}>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

const SeismicMarker = () => {
  // Accessing the new store structure
  const earthquakeHistory = useHVCStore((state) => state.data.metrics.earthquakeHistory);
  const lastEvent = useHVCStore((state) => state.data.metrics.lastSeismicEvent);

  // Combine history with last event
  const earthquakes = useMemo(() => {
    const history = earthquakeHistory || [];
    if (lastEvent && lastEvent.id) {
      const isInHistory = history.some(eq => eq.id === lastEvent.id);
      if (!isInHistory) {
        return [...history, lastEvent];
      }
    }
    return history;
  }, [earthquakeHistory, lastEvent]);

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
