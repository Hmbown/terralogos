import React, { useMemo, useRef } from 'react';
import { useFrame, useLoader, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const DAY_MAP =
  'https://cdn.jsdelivr.net/gh/ajaymt/textures@master/earthmap4k.jpg';
const NIGHT_MAP =
  'https://cdn.jsdelivr.net/gh/ajaymt/textures@master/earthlights4k.jpg';
const BUMP_MAP =
  'https://cdn.jsdelivr.net/gh/ajaymt/textures@master/earthbump4k.jpg';
const SPEC_MAP =
  'https://cdn.jsdelivr.net/gh/ajaymt/textures@master/earthspec4k.jpg';
const CLOUD_MAP =
  'https://cdn.jsdelivr.net/gh/ajaymt/textures@master/earthcloudmaptrans.jpg';

/**
 * EarthGlobe - textured Earth with subtle night lights + cloud layer
 */
const EarthGlobe = ({ radius = 4.2 }) => {
  const meshRef = useRef();
  const cloudRef = useRef();
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
    });
  }, [anisotropy, dayTexture, nightTexture, bumpTexture, specTexture, cloudTexture]);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.02;
    }
    if (cloudRef.current) {
      cloudRef.current.rotation.y += delta * 0.03;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <meshPhongMaterial
          map={dayTexture}
          bumpMap={bumpTexture}
          bumpScale={0.03}
          specularMap={specTexture}
          specular={new THREE.Color('#223344')}
          shininess={10}
          emissive="#ffffff"
          emissiveMap={nightTexture}
          emissiveIntensity={0.35}
        />
      </mesh>

      {/* Clouds */}
      <mesh ref={cloudRef}>
        <sphereGeometry args={[radius + 0.03, 128, 128]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
};

export default EarthGlobe;

