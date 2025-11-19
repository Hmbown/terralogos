import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';
import './PiezoLatticeShader'; // Registers 'crustMaterial'

const PiezoHead = ({ 
  mantleRadius = 4.0, 
  crustDepth = 0.2 
}) => {
  const matRef = useRef();
  const [isWriting, setIsWriting] = useState(false);
  
  // Subscribe to store for seismic events
  const lastEvent = useHVCStore((state) => state.metrics.lastSeismicEvent);

  // The Crust sits on top of the Mantle
  const radius = mantleRadius + crustDepth;

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uTime += delta;
      
      // 1. Update Cursor Position to Real Earthquake Location
      // If lastEvent.pos is available
      if (lastEvent && lastEvent.pos) {
         matRef.current.uCursorPos.set(
          lastEvent.pos[0], 
          lastEvent.pos[1], 
          lastEvent.pos[2]
        );
      }

      // 2. Flash Intensity based on Magnitude
      // We smooth-lerp to the current "Global Seismic Noise" level.
      const targetIntensity = lastEvent ? lastEvent.intensity : 0.0;
      
      matRef.current.uWriteIntensity = THREE.MathUtils.lerp(
        matRef.current.uWriteIntensity,
        targetIntensity,
        delta * 2.0
      );
      
      // Also handle manual clicks if needed, but store takes precedence for now
      if (isWriting) {
          // If manual writing was implemented, it would mix here.
          // For now, we rely on the store.
      }
    }
  });

  const handleSectorClick = (e) => {
    // Convert click point to local vector
    const point = e.point;
    setIsWriting(true);
    
    console.log(`[SYS] SECTOR WRITE: Vector(${point.x.toFixed(2)}, ${point.y.toFixed(2)}, ${point.z.toFixed(2)})`);
    console.log(`[SYS] PIEZO RESPONSE: ${(Math.random() * 1000).toFixed(0)} mV`);
  };

  return (
    <mesh onClick={handleSectorClick}>
      <sphereGeometry args={[radius, 128, 128]} />
      <crustMaterial 
        ref={matRef}
        transparent={true}
        depthWrite={false} // Allow seeing the Mantle inside
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

export default PiezoHead;
