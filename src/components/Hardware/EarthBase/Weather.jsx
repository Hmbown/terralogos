import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

const Weather = ({ radius = 4.2, count = 160 }) => {
  const metrics = useHVCStore((state) => state.data?.metrics || state.metrics || {});
  const windSpeed = metrics?.atmosphere?.windSpeed || 40;
  const ionization = metrics?.atmosphere?.ionization || 0;

  const meshRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const lat = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(-70, 70, Math.random()));
      const lon = THREE.MathUtils.degToRad(Math.random() * 360 - 180);
      const altitude = 0.08 + Math.random() * 0.04;
      const wobble = Math.random() * Math.PI * 2;
      temp.push({ lat, lon, altitude, wobble });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    const spin = (windSpeed / 180) * delta;
    const tint = THREE.MathUtils.clamp(ionization / 10, 0, 1);
    const baseColor = new THREE.Color('#7fd0ff');
    const stormColor = new THREE.Color('#ffb347');
    const color = baseColor.lerp(stormColor, tint);

    if (meshRef.current) {
      particles.forEach((particle, i) => {
        particle.lon += spin + Math.sin(particle.wobble + state.clock.elapsedTime * 0.3) * 0.0008;
        const position = new THREE.Vector3().setFromSphericalCoords(
          radius + particle.altitude,
          Math.PI / 2 - particle.lat,
          particle.lon
        );

        dummy.position.copy(position);
        const pulse = 0.6 + Math.sin(state.clock.elapsedTime * 2 + particle.wobble) * 0.2;
        dummy.scale.setScalar(pulse * 0.6);
        dummy.lookAt(0, 0, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    if (meshRef.current?.material) {
      meshRef.current.material.color.copy(color);
      meshRef.current.material.opacity = 0.25 + tint * 0.35;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      <sphereGeometry args={[0.05, 5, 5]} />
      <meshBasicMaterial transparent opacity={0.35} />
    </instancedMesh>
  );
};

export default Weather;
