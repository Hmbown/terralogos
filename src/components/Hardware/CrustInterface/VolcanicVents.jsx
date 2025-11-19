import React, { useLayoutEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

const VolcanicVents = () => {
  const volcanoes = useHVCStore((state) => state.metrics.volcanoes);
  const meshRef = useRef();
  const ringMeshRef = useRef();
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());
  const timeRef = useRef(0);
  const count = volcanoes ? volcanoes.length : 0;

  useFrame((state, delta) => {
    timeRef.current += delta;
    if (ringMeshRef.current && count > 0) {
      // Animate pulsing rings for volcanoes
      ringMeshRef.current.rotation.z = timeRef.current * 0.5;
    }
  });

  useLayoutEffect(() => {
    if (!meshRef.current || count === 0) {
      if (meshRef.current) {
        meshRef.current.count = 0;
        meshRef.current.instanceMatrix.needsUpdate = true;
      }
      if (ringMeshRef.current) {
        ringMeshRef.current.count = 0;
        ringMeshRef.current.instanceMatrix.needsUpdate = true;
      }
      return;
    }
    
    const dummy = dummyRef.current;
    const color = colorRef.current;

    volcanoes.forEach((volcano, index) => {
      if (!volcano || !volcano.pos || !Array.isArray(volcano.pos)) return;
      
      // 1. Position - slightly above surface for visibility
      const [x, y, z] = volcano.pos;
      const radius = Math.sqrt(x * x + y * y + z * z);
      const scaleFactor = 1.02; // Slightly above surface
      dummy.position.set(x * scaleFactor, y * scaleFactor, z * scaleFactor);

      // 2. Rotation (Align with normal / Look away from center)
      dummy.lookAt(0, 0, 0); // Look at center
      dummy.rotateX(Math.PI / 2); // Orient cone to point OUT

      const status = (volcano.status || '').toUpperCase();

      // 3. Scale (Red alert = larger, more visible)
      const baseScale = status === 'RED' ? 1.8 : 1.2;
      dummy.scale.set(baseScale * 0.12, baseScale * 0.3, baseScale * 0.12);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);

      // 4. Color - brighter and more visible
      if (status === 'RED') {
        color.set('#ff0000'); // Red Alert
      } else {
        color.set('#ff8800'); // Orange Warning
      }
      meshRef.current.setColorAt(index, color);
      
      // Also update ring mesh for pulsing effect
      if (ringMeshRef.current) {
        ringMeshRef.current.setMatrixAt(index, dummy.matrix);
        const ringColor = status === 'RED' ? '#ff4444' : '#ffaa44';
        ringMeshRef.current.setColorAt(index, new THREE.Color(ringColor));
      }
    });

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
    if (ringMeshRef.current) {
      ringMeshRef.current.count = count;
      ringMeshRef.current.instanceMatrix.needsUpdate = true;
      if (ringMeshRef.current.instanceColor) ringMeshRef.current.instanceColor.needsUpdate = true;
    }
    
  }, [volcanoes, count]);

  if (count === 0) return null;

  return (
    <group>
      {/* Pulsing rings around volcanoes */}
      <instancedMesh
        ref={ringMeshRef}
        args={[null, null, 100]}
      >
        <ringGeometry args={[0.2, 0.25, 16]} />
        <meshBasicMaterial
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      
      {/* Volcano cones */}
      <instancedMesh
        ref={meshRef}
        args={[null, null, 100]} // Max 100 volcanoes buffer
      >
        {/* Larger, more visible cones */}
        <coneGeometry args={[0.12, 0.3, 8]} /> 
        <meshStandardMaterial 
          emissive="#ff4400" 
          emissiveIntensity={3} 
          toneMapped={false} 
          color="#000000"
        />
      </instancedMesh>
    </group>
  );
};

export default VolcanicVents;
