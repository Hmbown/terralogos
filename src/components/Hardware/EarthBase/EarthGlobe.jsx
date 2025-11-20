import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import { Detailed } from '@react-three/drei';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';
import { EarthMaterial } from './EarthShader';
import { AtmosphereGlowMaterial } from './AtmosphereGlow';
import AtmosphericScattering from './AtmosphericScattering';
import Weather from './Weather';
import FlightPaths from './FlightPaths';

const DAY_MAP = '/textures/earthmap.jpg';
const NIGHT_MAP = '/textures/earthlights.png';
const BUMP_MAP = '/textures/earthbump.jpg';
const SPEC_MAP = '/textures/earthspec.jpg';
const CLOUD_MAP = '/textures/earthclouds.png'; // Primary cloud layer (254K, valid)
const CLOUD_MAP_2 = '/textures/earthclouds.png'; // Second cloud layer (same texture, will be offset in shader)

/**
 * EarthGlobe - textured Earth with volumetric shader + day/night cycle
 */
const EarthGlobe = ({ radius = 4.2 }) => {
  const materialRefs = useRef([]);
  const glowRef = useRef();
  const { gl } = useThree();
  const sunDirection = useRef(new THREE.Vector3(1, 0.3, 0));
  const scatterSun = sunDirection.current;

  const registerMaterial = (mat) => {
    if (!mat) return;
    if (!materialRefs.current.includes(mat)) {
      materialRefs.current.push(mat);
    }
  };
  
  // Connect to data store
  const metrics = useHVCStore((state) => state.data?.metrics || state.metrics || {});
  const solar = metrics?.solar || {};
  const atmosphere = metrics?.atmosphere || {};

  // Determine cloud speed from terrestrial wind (km/h -> shader speed)
  // Base speed 0.02 + wind factor
  const windSpeed = atmosphere?.windSpeed || 10;
  const cloudSpeed = 0.02 + (windSpeed / 1000);
  const cloudSpeed2 = cloudSpeed * 0.6; // Slower upper layer
  
  // Solar flare effect on atmosphere
  // 'X' class flares make the atmosphere brighter/hotter
  const isFlare = solar?.class === 'M' || solar?.class === 'X';
  const atmosphereColor = isFlare ? new THREE.Color('#88aaff') : new THREE.Color('#3f7cff');
  const atmospherePower = isFlare ? 3.0 : 4.0; // Lower power = bigger spread for flare
  const atmosphereIntensity = isFlare ? 1.25 : 1.0;

  const [dayTexture, nightTexture, bumpTexture, specTexture, cloudTexture, cloudTexture2] =
    useLoader(THREE.TextureLoader, [
      DAY_MAP,
      NIGHT_MAP,
      BUMP_MAP,
      SPEC_MAP,
      CLOUD_MAP,
      CLOUD_MAP_2,
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
      cloudTexture2,
    ].forEach((texture) => {
      if (!texture) return;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      // wrapS for seamless rotation
      texture.wrapS = THREE.RepeatWrapping; 
      texture.wrapT = THREE.ClampToEdgeWrapping;
    });
  }, [anisotropy, dayTexture, nightTexture, bumpTexture, specTexture, cloudTexture, cloudTexture2]);

  // Ref for the group to rotate
  const groupRef = useRef();
  useFrame(({ clock, camera }, delta) => {
    const t = clock.getElapsedTime();

    // Slow axial rotation
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.018;
    }

    // Animate a softly orbiting sun direction for dynamic day/night sweep
    scatterSun.set(
      Math.sin(t * 0.12) * 0.8,
      0.22 + Math.sin(t * 0.27) * 0.08,
      Math.cos(t * 0.12)
    ).normalize();

    materialRefs.current.forEach((mat) => {
      mat.uTime = t;
      mat.uSunDirection = scatterSun;
      mat.uCloudSpeed = cloudSpeed;
      mat.uCloudSpeed2 = cloudSpeed2;
    });

    if (glowRef.current) {
      glowRef.current.uSunDirection = scatterSun;
      glowRef.current.uColor = atmosphereColor;
      glowRef.current.uPower = THREE.MathUtils.lerp(glowRef.current.uPower, atmospherePower, delta * 0.5);
    }
  });

  return (
    <group>
      <Detailed ref={groupRef} distances={[0, 50, 100]}>
        {/* High LOD */}
        <mesh>
          <sphereGeometry args={[radius, 64, 64]} />
          <earthMaterial
            ref={registerMaterial}
            uDayMap={dayTexture}
            uNightMap={nightTexture}
            uCloudMap={cloudTexture}
            uCloudMap2={cloudTexture2}
            uBumpMap={bumpTexture}
            uSpecMap={specTexture}
            uSunDirection={scatterSun}
            uNightBoost={1.4}
            uSpecPower={88}
            uSpecStrength={1.2}
            uCityGlow={1.25}
            uHorizonSoftness={0.24}
            uCloudSpeed={cloudSpeed}
            uCloudSpeed2={cloudSpeed2}
          />
        </mesh>
        
        {/* Medium LOD */}
          <mesh>
          <sphereGeometry args={[radius, 32, 32]} />
          <earthMaterial
            ref={registerMaterial}
            uDayMap={dayTexture}
            uNightMap={nightTexture}
            uCloudMap={cloudTexture}
            uCloudMap2={cloudTexture2}
            uBumpMap={bumpTexture}
            uSpecMap={specTexture}
            uSunDirection={scatterSun}
            uNightBoost={1.4}
            uSpecPower={88}
            uSpecStrength={1.2}
            uCityGlow={1.25}
            uHorizonSoftness={0.24}
            uCloudSpeed={cloudSpeed}
            uCloudSpeed2={cloudSpeed2}
          />
        </mesh>
        
        {/* Low LOD */}
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshStandardMaterial map={dayTexture} />
        </mesh>
      </Detailed>

      {/* Atmosphere Layers */}
      <mesh scale={[1.02, 1.02, 1.02]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <atmosphereGlowMaterial
          ref={glowRef}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uSunDirection={scatterSun}
          uColor={atmosphereColor}
          uCoefficient={0.6}
          uPower={atmospherePower}
        />
      </mesh>
      <AtmosphericScattering radius={radius} sunDirection={scatterSun} intensity={atmosphereIntensity} />

      {/* Low-orbit overlays */}
      <FlightPaths radius={radius + 0.05} />
      <Weather radius={radius + 0.05} />
    </group>
  );
};

export default EarthGlobe;
