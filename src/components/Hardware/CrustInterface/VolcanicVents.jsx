import React, { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

const VolcanicVents = () => {
  const volcanoes = useHVCStore((state) => state.metrics.volcanoes);
  const meshRef = useRef();
  const dummyRef = useRef(new THREE.Object3D());
  const colorRef = useRef(new THREE.Color());
  const count = volcanoes.length;

  useLayoutEffect(() => {
    if (!meshRef.current || count === 0) return;
    const dummy = dummyRef.current;
    const color = colorRef.current;

    volcanoes.forEach((volcano, index) => {
      // 1. Position
      const [x, y, z] = volcano.pos;
      dummy.position.set(x, y, z);

      // 2. Rotation (Align with normal / Look away from center)
      dummy.lookAt(0, 0, 0); // Look at center
      // dummy.rotateX(Math.PI / 2); // Orient cone to point OUT

      const status = (volcano.level || volcano.status || '').toUpperCase();

      // 3. Scale (Red alert = larger)
      const scale = status === 'RED' ? 1.5 : 1.0;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(index, dummy.matrix);

      // 4. Color
      if (status === 'RED') {
        color.set('#ff0000'); // Red Alert
      } else {
        color.set('#ff8800'); // Orange Warning
      }
      meshRef.current.setColorAt(index, color);
    });

    meshRef.current.count = count;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    
  }, [volcanoes, count]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, 100]} // Max 100 volcanoes buffer
    >
      {/* Simple geometry: Pointy cones representing vents */}
      <coneGeometry args={[0.05, 0.2, 8]} /> 
      <meshStandardMaterial 
        emissive="#ff4400" 
        emissiveIntensity={2} 
        toneMapped={false} 
        color="#000000"
      />
    </instancedMesh>
  );
};

export default VolcanicVents;
