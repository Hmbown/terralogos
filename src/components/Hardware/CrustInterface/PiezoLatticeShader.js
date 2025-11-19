import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export const CrustMaterial = shaderMaterial(
  {
    uTime: 0,
    uWriteIntensity: 0.0,     // 0.0 (Idle) to 1.0 (Earthquake/Write)
    uCursorPos: new THREE.Vector3(0, 0, 0), // Location of current I/O
    uLatticeColor: new THREE.Color('#ffffff'), // Pure Quartz
    uFaultColor: new THREE.Color('#00ffff'),   // High Voltage
    uResolution: new THREE.Vector2(1, 1)       // Screen res for sharp lines
  },
  // Vertex Shader
  `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      // slight breathing effect to show the crust "floating" on the mantle
      // Very subtle amplitude
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uWriteIntensity;
    uniform vec3 uCursorPos;
    uniform vec3 uLatticeColor;
    uniform vec3 uFaultColor;

    // Function to create a hexagonal grid pattern
    float hexGrid(vec2 uv) {
      vec2 r = vec2(1.0, 1.73);
      vec2 h = r * 0.5;
      vec2 a = mod(uv, r) - h;
      vec2 b = mod(uv - h, r) - h;
      vec2 g = dot(a, a) < dot(b, b) ? a : b;
      float d = length(g);
      return smoothstep(0.45, 0.48, d); // Sharp edges
    }

    void main() {
      // 1. Map UVs to Sphere Surface for tiling
      // Triplanar mapping would be better, but standard UVs work for the visual abstraction
      vec2 gridUV = vUv * 50.0; 
      
      // 2. Generate Lattice
      float lattice = hexGrid(gridUV);
      
      // 3. Calculate Distance to Active Write Head (Cursor)
      // vPosition is in local space. Ensure uCursorPos matches.
      float dist = distance(normalize(vPosition), normalize(uCursorPos));
      
      // Define the "Active Sector" radius
      float activationRadius = 0.3;
      float scanLine = smoothstep(activationRadius, activationRadius - 0.05, dist);
      
      // 4. Piezoelectric Discharge (The "Write" Flash)
      // Only show the fault color if within the scan radius AND intensity is high
      float discharge = scanLine * uWriteIntensity;
      
      // Pulse the discharge with time
      float pulse = sin(uTime * 20.0) * 0.5 + 0.5;
      discharge *= pulse;

      // 5. Composition
      // Base lattice is faint (Idle state)
      vec3 finalColor = mix(vec3(0.0), uLatticeColor, lattice * 0.1);
      
      // Add the discharge (Active state)
      finalColor += uFaultColor * discharge * lattice * 5.0; // Super bright lines
      
      // 6. Alpha: The crust is mostly empty space (lattice structure)
      // Only render the lines, not the faces
      float alpha = (lattice * 0.1) + discharge;
      gl_FragColor = vec4(finalColor, alpha);
      
      // Basic rim light for definition
      float fresnel = pow(1.0 - dot(normalize(cameraPosition), vNormal), 4.0);
      gl_FragColor.a += fresnel * 0.2;
    }
  `
);

extend({ CrustMaterial });
