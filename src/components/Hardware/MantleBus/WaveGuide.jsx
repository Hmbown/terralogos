import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './AlfvenBusShader'; // Registers 'alfvenMaterial'

const WaveGuide = ({ 
  busLoad = 0.5,     // Current bandwidth usage
  coreRadius = 2.5,
  mantleDepth = 1.5 
}) => {
  const matRef = useRef();
  
  // The Mantle geometry must be slightly larger than the Core
  const outerRadius = coreRadius + mantleDepth;

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uTime += delta;
      
      // Lerp signal density for smooth data spikes
      matRef.current.uSignalDensity = THREE.MathUtils.lerp(
        matRef.current.uSignalDensity,
        busLoad,
        delta * 5.0
      );
    }
  });

  return (
    <group>
      {/* We render the Mantle as a slightly larger sphere.
         Important: Ensure 'transparent' is true on the material 
         so we can see the Core (MHD) inside.
      */}
      <mesh>
        <sphereGeometry args={[outerRadius, 64, 64]} />
        <alfvenMaterial 
          ref={matRef} 
          transparent={true}
          side={THREE.DoubleSide} // Render inside and out for depth
          depthWrite={false}      // Prevent z-fighting with Core
          blending={THREE.AdditiveBlending} // Glow effect
        />
      </mesh>
    </group>
  );
};

export default WaveGuide;
