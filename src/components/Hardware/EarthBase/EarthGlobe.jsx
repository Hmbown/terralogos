import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * EarthGlobe - Base layer showing a recognizable Earth sphere
 * Uses a simple procedural texture to represent continents and oceans
 */
const EarthGlobe = ({ radius = 4.2 }) => {
  const meshRef = useRef();
  const materialRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      // Slow rotation to show it's a globe
      meshRef.current.rotation.y += 0.0005;
    }
  });

  // Create a simple procedural Earth-like texture
  const createEarthTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Base ocean color
    ctx.fillStyle = '#1a3a5c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add simple continent-like shapes (very simplified)
    ctx.fillStyle = '#2d5016';
    // North America
    ctx.beginPath();
    ctx.ellipse(100, 80, 40, 60, 0, 0, Math.PI * 2);
    ctx.fill();
    // South America
    ctx.beginPath();
    ctx.ellipse(120, 160, 25, 50, 0, 0, Math.PI * 2);
    ctx.fill();
    // Europe/Africa
    ctx.beginPath();
    ctx.ellipse(250, 100, 35, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    // Asia
    ctx.beginPath();
    ctx.ellipse(380, 70, 60, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    // Australia
    ctx.beginPath();
    ctx.ellipse(400, 180, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add some cloud-like white areas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 10 + Math.random() * 30;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  const texture = createEarthTexture();

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        emissive="#001122"
        emissiveIntensity={0.1}
        roughness={0.8}
        metalness={0.2}
      />
    </mesh>
  );
};

export default EarthGlobe;

