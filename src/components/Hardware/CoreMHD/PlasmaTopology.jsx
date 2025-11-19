import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import './LogicGateShader'; // Registers 'mHDMaterial'

const SEGS = 64;
const RADIUS_EARTH = 4.2;

const Magnetosphere = ({ intensity = 1.0 }) => {
  const linesRef = useRef();
  
  // Generate Dipole Field Lines
  // r = L * sin^2(theta)
  const lines = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    const indices = [];
    const colors = [];
    
    let idx = 0;
    const L_SHELLS = [5, 6, 8, 10, 12]; // Distances in Earth Radii (approx)
    const LONGITUDES = 12; // Number of lines around
    
    const color1 = new THREE.Color(0x0088ff);
    const color2 = new THREE.Color(0xff0088);
    
    L_SHELLS.forEach(L => {
      for (let phi = 0; phi < Math.PI * 2; phi += (Math.PI * 2) / LONGITUDES) {
        const linePoints = [];
        // Theta goes from near 0 to PI (poles)
        // Singularity at poles, so clamp
        for (let t = 0.1; t < Math.PI - 0.1; t += 0.1) {
          const r = L * RADIUS_EARTH * 0.5 * Math.pow(Math.sin(t), 2); // Scale factor for visual fit
          // Convert to Cartesian
          // x = r sin(t) cos(phi)
          // y = r cos(t)  <-- Y is Up in Threejs usually? 
          // Wait, standard spherical: z is up? 
          // In ThreeJS Y is usually up.
          // Physics convention: theta is angle from Z axis.
          // Let's assume Y is the magnetic axis for simplicity in this viz.
          
          const x = r * Math.sin(t) * Math.cos(phi);
          const z = r * Math.sin(t) * Math.sin(phi);
          const y = r * Math.cos(t); // Pole to Pole
          
          points.push(x, y, z);
          
          // Vertex Color
          const c = color1.clone().lerp(color2, Math.abs(Math.cos(t)));
          colors.push(c.r, c.g, c.b);
          
          if (linePoints.length > 0) {
            indices.push(idx - 1, idx);
          }
          idx++;
          linePoints.push(true);
        }
        // Reset for next line (indices are separate segments)
      }
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    
    return geometry;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y -= 0.002; // Rotate with earth lag
      // Pulse opacity
      const pulse = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      linesRef.current.material.opacity = pulse * intensity;
    }
  });

  return (
    <lineSegments ref={linesRef} geometry={lines}>
      <lineBasicMaterial 
        vertexColors 
        transparent 
        opacity={0.3} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
};

const PlasmaTopology = ({ 
  systemLoad = 0.1,    // 0.0 - 1.0 (Turbulence)
  clockSpeed = 1.0,    // Solar Wind sync (Alfven Speed)
  radius = 2.5 
}) => {
  const materialRef = useRef();
  const meshRef = useRef();

  // Smooth state transitions (Laminar -> Turbulent)
  // We do not want instant jumps in viscosity; physics takes time to react.
  const currentTurbulence = useRef(0);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // 1. Update Global Time
      materialRef.current.uTime += delta;

      // 2. Lerp Turbulence for physical weight (Simulating fluid inertia)
      currentTurbulence.current = THREE.MathUtils.lerp(
        currentTurbulence.current,
        systemLoad,
        delta * 2.0 // Viscosity factor
      );
      
      materialRef.current.uTurbulence = currentTurbulence.current;
      materialRef.current.uAlfvenSpeed = clockSpeed;
    }
    
    // 3. Slow axial rotation (Coriolis effect approximation)
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 128, 128]} />
        <mHDMaterial 
          ref={materialRef} 
          transparent={false}
        />
      </mesh>
      {/* Field Lines extending outward */}
      <Magnetosphere intensity={0.5 + systemLoad * 0.5} />
    </group>
  );
};

export default PlasmaTopology;
