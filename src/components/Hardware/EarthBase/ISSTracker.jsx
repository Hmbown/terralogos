import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import useHVCStore from '../../../core/store/useHVCStore';

const ISSTracker = () => {
  const issRef = useRef();
  const issData = useHVCStore((state) => state.metrics.satellites?.iss);

  useFrame((state, delta) => {
    if (issRef.current) {
      // Simple rotation to simulate orbit if data is stale
      // But ideally we rely on the position from store
      // Just visual polish: rotate the "station" itself
      issRef.current.rotation.y += delta * 0.5;
      issRef.current.rotation.z += delta * 0.2;
    }
  });

  if (!issData || !issData.pos) return null;

  // Scale position to our globe
  // The telemtry returns cartesian based on GLOBE_RADIUS
  const [x, y, z] = issData.pos;

  return (
    <group position={[x, y, z]}>
      <mesh ref={issRef}>
        <boxGeometry args={[0.1, 0.05, 0.05]} />
        <meshStandardMaterial color="#ffffff" emissive="#aaaaaa" />
      </mesh>
      {/* Solar panels */}
      <mesh position={[0.1, 0, 0]}>
        <boxGeometry args={[0.1, 0.2, 0.01]} />
        <meshStandardMaterial color="#3344cc" metallic={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[-0.1, 0, 0]}>
        <boxGeometry args={[0.1, 0.2, 0.01]} />
        <meshStandardMaterial color="#3344cc" metallic={0.8} roughness={0.2} />
      </mesh>
      
      {/* Label */}
      <Html distanceFactor={10} zIndexRange={[100, 0]}>
        <div style={{ 
          color: '#00ff88', 
          fontSize: '10px', 
          fontFamily: 'monospace', 
          background: 'rgba(0,0,0,0.8)',
          padding: '2px 4px',
          borderRadius: '2px',
          whiteSpace: 'nowrap'
        }}>
          ISS (Zarya)
          <br/>
          Alt: {issData.alt.toFixed(1)}km
        </div>
      </Html>
    </group>
  );
};

export default ISSTracker;

