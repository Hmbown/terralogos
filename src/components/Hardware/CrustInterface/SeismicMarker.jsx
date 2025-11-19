import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

/**
 * SeismicMarker - Visual marker for earthquake events on the Earth surface
 * Shows a pulsing ring effect at the earthquake location
 */
const SeismicMarker = () => {
  const meshRef = useRef();
  const lastEvent = useHVCStore((state) => state.metrics.lastSeismicEvent);
  const pulseRef = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Only show marker if we have a real event (not placeholder)
    const hasRealEvent = lastEvent && lastEvent.id && lastEvent.magnitude !== null;
    
    if (hasRealEvent && lastEvent.pos) {
      const [x, y, z] = lastEvent.pos;
      meshRef.current.position.set(x, y, z);
      
      // Orient marker to point outward from center
      meshRef.current.lookAt(0, 0, 0);
      meshRef.current.rotateX(Math.PI / 2);
      
      // Pulsing animation based on magnitude
      pulseRef.current += delta * (2 + lastEvent.intensity * 3);
      const scale = 1 + Math.sin(pulseRef.current) * 0.3 * (0.5 + lastEvent.intensity * 0.5);
      meshRef.current.scale.setScalar(scale);
      
      meshRef.current.visible = true;
    } else {
      meshRef.current.visible = false;
    }
  });

  if (!lastEvent || !lastEvent.id) return null;

  // Color based on magnitude
  const magnitude = lastEvent.magnitude || 0;
  let color = '#00ffff'; // Cyan for small
  if (magnitude >= 5) color = '#ff0000'; // Red for large
  else if (magnitude >= 4) color = '#ff8800'; // Orange for medium

  return (
    <group ref={meshRef}>
      {/* Outer pulsing ring */}
      <mesh>
        <ringGeometry args={[0.15, 0.25, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Inner core */}
      <mesh>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
};

export default SeismicMarker;

