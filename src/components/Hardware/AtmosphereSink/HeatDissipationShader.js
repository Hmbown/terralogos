import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

export const AtmosphereMaterial = shaderMaterial(
  {
    uTime: 0,
    uHeatLevel: 0.2,           // 0.0 (Cool) to 1.0 (Overheating)
    uSunDirection: new THREE.Vector3(1, 0, 0),
    uCoolColor: new THREE.Color('#44aaff'), // Oxygen/Nitrogen default
    uHotColor: new THREE.Color('#ffaa00'),  // Ionized/Overheated
    uAtmosphereDensity: 0.5,
    uCO2Density: 0.0
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vViewPosition;
    uniform float uTime;
    uniform float uHeatLevel;
    uniform vec3 uSunDirection;
    uniform vec3 uCoolColor;
    uniform vec3 uHotColor;
    uniform float uAtmosphereDensity;
    uniform float uCO2Density;

    // Simple noise for heat shimmer
    float random(vec3 scale, float seed) {
      return fract(sin(dot(gl_FragCoord.xyz + seed, scale)) * 43758.5453 + seed);
    }

    void main() {
      // 1. Calculate Atmosphere Thickness (Fresnel)
      // We want the edge of the sphere to be opaque, center transparent
      vec3 viewDir = normalize(vViewPosition);
      vec3 normal = normalize(vNormal);
      
      // Dot product gives us the angle. 1.0 = center, 0.0 = edge.
      float viewDot = dot(viewDir, normal);
      float rim = pow(1.0 - viewDot, 3.0); // Standard fresnel
      
      // 2. Solar Alignment (Day/Night Cycle)
      // The atmosphere glows on the "Sun" side
      float sunIntensity = max(0.0, dot(normal, uSunDirection));
      
      // 3. Thermal Load Simulation
      // As Heat Level rises, the atmosphere becomes more turbulent/opaque
      // This represents "Cloud cover" or "Ionospheric interference"
      
      // Animated shimmer
      float shimmer = sin(vPosition.y * 10.0 + uTime * 2.0) * 0.1;
      
      // Mix colors based on heat
      vec3 baseColor = mix(uCoolColor, uHotColor, uHeatLevel);

      // CO2 Pollution Shift (Grey/Brown haze)
      vec3 pollutionColor = vec3(0.4, 0.35, 0.3); // Smog color
      baseColor = mix(baseColor, pollutionColor, uCO2Density * 0.7);
      
      // 4. Final Alpha Composition
      // Base visibility is determined by Rim (Edge) + Sun (Daylight)
      float alpha = rim * (uAtmosphereDensity + uCO2Density * 0.5);
      
      // Add heat bloom
      alpha += uHeatLevel * 0.2 * (1.0 - viewDot); 
      
      // Boost the "Day" side brightness
      vec3 finalColor = baseColor * (1.0 + sunIntensity);
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ AtmosphereMaterial });
