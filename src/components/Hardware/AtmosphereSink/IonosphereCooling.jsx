import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';
import './HeatDissipationShader'; // Registers 'atmosphereMaterial'

const IonosphereCooling = ({ 
  systemTemp = 300, // Kelvin. 300K = Standard.
  crustRadius = 4.2, // Must be larger than PiezoHead
  atmosphereDepth = 0.5
}) => {
  const matRef = useRef();
  
  // Subscribe to store for CO2 data
  const co2 = useHVCStore((state) => state.metrics.atmosphere.co2);
  
  // Calculate radius
  const outerRadius = crustRadius + atmosphereDepth;

  // Normalize Temperature to 0.0 - 1.0 range for shader
  // Assuming 273K is min, 350K is max operational temp
  const normalizedHeat = Math.min(Math.max((systemTemp - 273) / 77, 0), 1);

  // Normalize CO2 (Baseline 400ppm - 450ppm range)
  const normalizedCO2 = Math.min(Math.max((co2 - 350) / 150, 0), 1);

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uTime += delta;
      
      // Smoothly transition heat visualization
      matRef.current.uHeatLevel = THREE.MathUtils.lerp(
        matRef.current.uHeatLevel,
        normalizedHeat,
        delta * 0.5 // Thermodynamics are slow
      );

      // Smoothly transition CO2 visualization
      matRef.current.uCO2Density = THREE.MathUtils.lerp(
        matRef.current.uCO2Density,
        normalizedCO2,
        delta * 0.2 // Gases mix slowly
      );

      // Rotate the "Sun Direction" to simulate orbit/day-night cycle
      // In a real app, this would sync to the `useSolarWindClock` hook.
      const time = state.clock.getElapsedTime();
      matRef.current.uSunDirection.set(
        Math.sin(time * 0.1),
        0,
        Math.cos(time * 0.1)
      );
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[outerRadius, 64, 64]} />
      <atmosphereMaterial 
        ref={matRef}
        transparent={true}
        depthWrite={false} // Critical: Allows looking "through" to the crust
        side={THREE.FrontSide} // Only render outside
        blending={THREE.AdditiveBlending} // Glow effect
      />
    </mesh>
  );
};

export default IonosphereCooling;
