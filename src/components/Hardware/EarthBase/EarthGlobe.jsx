import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree, extend } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';
import { EarthMaterial } from './EarthShader';
import { AtmosphereGlowMaterial } from './AtmosphereGlow';

const DAY_MAP = '/textures/earthmap.jpg';
const NIGHT_MAP = '/textures/earthlights.png';
const BUMP_MAP = '/textures/earthbump.jpg';
const SPEC_MAP = '/textures/earthspec.jpg';
const CLOUD_MAP = '/textures/earthclouds.png';

/**
 * EarthGlobe - textured Earth with volumetric shader + day/night cycle
 */
const EarthGlobe = ({ radius = 4.2 }) => {
  const meshRef = useRef();
  const materialRef = useRef();
  const { gl } = useThree();
  
  // Connect to data store
  const { solar, atmosphere } = useHVCStore((state) => state.metrics);

  // Determine cloud speed from terrestrial wind (km/h -> shader speed)
  // Base speed 0.02 + wind factor
  const windSpeed = atmosphere?.windSpeed || 10;
  const cloudSpeed = 0.02 + (windSpeed / 1000);
  
  // Solar flare effect on atmosphere
  // 'X' class flares make the atmosphere brighter/hotter
  const isFlare = solar?.class === 'M' || solar?.class === 'X';
  const atmosphereColor = isFlare ? new THREE.Color('#88aaff') : new THREE.Color('#4488ff');
  const atmospherePower = isFlare ? 3.0 : 4.0; // Lower power = bigger spread for flare

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
          uCloudSpeed={cloudSpeed}
        />
      </mesh>

      {/* Atmosphere Glow Halo */}
      <mesh scale={[1.15, 1.15, 1.15]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <atmosphereGlowMaterial
          uColor={atmosphereColor}
          uCoefficient={0.5}
          uPower={atmospherePower}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default EarthGlobe;

