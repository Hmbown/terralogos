import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import { EarthMaterial } from './EarthShader';
import { AtmosphereGlowMaterial } from './AtmosphereGlow';

const DAY_MAP =
  'https://raw.githubusercontent.com/ajaymt/textures/master/earthmap4k.jpg';
const NIGHT_MAP =
  'https://raw.githubusercontent.com/ajaymt/textures/master/earthlights4k.jpg';
const BUMP_MAP =
  'https://raw.githubusercontent.com/ajaymt/textures/master/earthbump4k.jpg';
const SPEC_MAP =
  'https://raw.githubusercontent.com/ajaymt/textures/master/earthspec4k.jpg';
const CLOUD_MAP =
  'https://raw.githubusercontent.com/ajaymt/textures/master/earthcloudmaptrans.jpg';

/**
 * EarthGlobe - textured Earth with volumetric shader + day/night cycle
 */
const EarthGlobe = ({ radius = 4.2 }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { gl } = useThree();

  const [dayTexture, nightTexture, bumpTexture, specTexture, cloudTexture] =
    useLoader(THREE.TextureLoader, [
      DAY_MAP,
      NIGHT_MAP,
      BUMP_MAP,
      SPEC_MAP,
      CLOUD_MAP,
    ]);

  const anisotropy = useMemo(
    () => Math.min(gl.capabilities.getMaxAnisotropy?.() || 8, 8),
    [gl]
  );

  useMemo(() => {
    [
      dayTexture,
      nightTexture,
      bumpTexture,
      specTexture,
      cloudTexture,
    ].forEach((texture) => {
      if (!texture) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      // wrapS for seamless rotation
      texture.wrapS = THREE.RepeatWrapping; 
      texture.wrapT = THREE.ClampToEdgeWrapping;
    });
  }, [anisotropy, dayTexture, nightTexture, bumpTexture, specTexture, cloudTexture]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
    if (materialRef.current) {
      materialRef.current.uTime += delta;
    }
  });

  return (
    <group>
      {/* Main Earth Sphere with Shader */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <earthMaterial
          ref={materialRef}
          uDayMap={dayTexture}
          uNightMap={nightTexture}
          uCloudMap={cloudTexture}
          uSunDirection={new THREE.Vector3(100, 0, 20)} // Sun position
          uAtmosphereDensity={0.6}
          uCloudSpeed={0.05}
        />
      </mesh>

      {/* Atmosphere Glow Halo */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <atmosphereGlowMaterial
          uColor={new THREE.Color('#4488ff')}
          uCoefficient={0.5}
          uPower={4.0}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default EarthGlobe;

