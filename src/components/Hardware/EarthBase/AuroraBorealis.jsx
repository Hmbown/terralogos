import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';
import { AuroraMaterial } from './AuroraShader';

const AuroraBorealis = ({ radius = 4.3, offset = 0.1 }) => {
  const northernRef = useRef();
  const southernRef = useRef();
  
  // Solar data drives the intensity and color
  const { solar, coreLoad } = useHVCStore((state) => state.metrics);
  
  // Map Kp (coreLoad 0-1) to Aurora Intensity
  // Kp 0-9 mapped to 0-1. Stronger Kp = Brighter, wider auroras.
  const intensity = Math.max(0.1, coreLoad * 2.0); 
  const speed = 0.2 + coreLoad * 0.5;

  useFrame((state, delta) => {
    if (northernRef.current) {
      northernRef.current.uTime += delta;
      northernRef.current.uOpacity = THREE.MathUtils.lerp(northernRef.current.uOpacity, intensity, delta * 0.5);
      northernRef.current.uSpeed = speed;
    }
    if (southernRef.current) {
      southernRef.current.uTime += delta;
      southernRef.current.uOpacity = THREE.MathUtils.lerp(southernRef.current.uOpacity, intensity, delta * 0.5);
      southernRef.current.uSpeed = speed;
    }
  });

  const auroraRadius = radius + offset;
  const height = 1.5;

  return (
    <group>
      {/* Northern Lights */}
      <mesh position={[0, radius * 0.95, 0]} rotation={[0, 0, 0]}>
        {/* Conic cylinder to follow magnetic field lines roughly */}
        <cylinderGeometry args={[auroraRadius * 0.4, auroraRadius * 0.6, height, 64, 8, true]} />
        <auroraMaterial
          ref={northernRef}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uColor={new THREE.Color('#00ffaa')}
          uColor2={new THREE.Color('#aa00ff')}
        />
      </mesh>

      {/* Southern Lights */}
      <mesh position={[0, -radius * 0.95, 0]} rotation={[Math.PI, 0, 0]}>
         <cylinderGeometry args={[auroraRadius * 0.4, auroraRadius * 0.6, height, 64, 8, true]} />
        <auroraMaterial
          ref={southernRef}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uColor={new THREE.Color('#00ffaa')}
          uColor2={new THREE.Color('#ff0055')} // slightly different red/pink for south
        />
      </mesh>
    </group>
  );
};

export default AuroraBorealis;

