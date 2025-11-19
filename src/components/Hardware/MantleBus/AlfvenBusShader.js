import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export const AlfvenMaterial = shaderMaterial(
  {
    uTime: 0,
    uSignalDensity: 0.0,   // 0.0 - 1.0 (Bus Utilization)
    uPulseSpeed: 2.0,      // Rate of transmission
    uColorLow: new THREE.Color('#001133'), // Deep Silicate
    uColorHigh: new THREE.Color('#00ff88'), // Data Packets
    uCoreRadius: 2.5,      // Inner boundary
    uMantleRadius: 4.0     // Outer boundary
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec2 vUv;
    uniform float uTime;
    uniform float uSignalDensity;
    uniform float uPulseSpeed;
    uniform vec3 uColorLow;
    uniform vec3 uColorHigh;

    // Cellular Noise 3D
    // Source: https://github.com/stegu/webgl-noise/blob/master/src/cellular3D.glsl
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float cellular(vec3 P) {
      const float K = 0.142857142857; // 1/7
      const float K2 = 0.071428571428; // K/2
      const float jitter = 0.8; // jitter 1.0 makes F1 wrong more often
      vec3 Pi = floor(P);
      vec3 Pf = fract(P);
      vec3 oi = vec3(-1.0, 0.0, 1.0);
      vec3 of = vec3(-0.5, 0.5, 1.5);
      vec3 px = permute(Pi.x + oi);
      vec3 p = permute(px.x + Pi.y + oi); // p11, p12, p13
      vec3 ox = fract(p*K) - K2;
      vec3 oy = mod(floor(p*K),7.0)*K - K2;
      vec3 dx = Pf.x - 0.5 + jitter*ox;
      vec3 dy = Pf.y - of + jitter*oy;
      vec3 d1 = dx * dx + dy * dy; // d11, d12 and d13, squared
      p = permute(px.y + Pi.y + oi); // p21, p22, p23
      ox = fract(p*K) - K2;
      oy = mod(floor(p*K),7.0)*K - K2;
      dx = Pf.x - 1.5 + jitter*ox;
      dy = Pf.y - of + jitter*oy;
      vec3 d2 = dx * dx + dy * dy; // d21, d22 and d23, squared
      p = permute(px.z + Pi.y + oi); // p31, p32, p33
      ox = fract(p*K) - K2;
      oy = mod(floor(p*K),7.0)*K - K2;
      dx = Pf.x - 2.5 + jitter*ox;
      dy = Pf.y - of + jitter*oy;
      vec3 d3 = dx * dx + dy * dy; // d31, d32 and d33, squared
      vec3 d1a = min(d1, d2);
      d2 = max(d1, d2);
      d2 = min(d2, d3);
      d1 = min(d1a, d2); // F1 is now in d1
      d2 = max(d1a, d2); // F2 is now in d2
      d1.xy = (d1.x < d1.y) ? d1.xy : d1.yx;
      d1.xz = (d1.x < d1.z) ? d1.xz : d1.zx;
      d1.yz = min(d1.yz, d2.yz);
      d1.y = min(d1.y, d1.z);
      d1.y = min(d1.y, d2.x);
      return sqrt(d1.x);
    }

    void main() {
      // 1. Normalized Depth (0.0 at Core, 1.0 at Crust)
      float len = length(vPosition);
      
      // 2. Transmission Pulses (Radial Movement)
      // We animate the noise coordinate 'z' or 'time' to move OUTWARD
      float transmissionT = uTime * uPulseSpeed;
      
      // Cellular structure representing the mantle rocks
      float cell = cellular(vPosition * 2.0 - vec3(0.0, transmissionT, 0.0));
      
      // 3. Signal Visualization
      // Invert noise to get "veins" or "pathways"
      float signalPath = 1.0 - smoothstep(0.0, 0.5, cell);
      
      // Modulate visibility based on Signal Density (Bus Load)
      float activity = signalPath * uSignalDensity;
      
      // 4. Fresnel / Rim Effect for Volume Illusion
      vec3 viewDir = normalize(cameraPosition - vPosition);
      float fresnel = pow(1.0 - dot(viewDir, vNormal), 2.0);

      // 5. Composition
      vec3 finalColor = mix(uColorLow, uColorHigh, activity);
      
      // Alpha Blending: 
      // Transparent in the middle, opaque at the edges (Atmosphere-like)
      // Plus the signal pathways are additive.
      float alpha = (fresnel * 0.3) + (activity * 0.8);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ AlfvenMaterial });
