import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const EarthMaterial = shaderMaterial(
  {
    uDayMap: null,
    uNightMap: null,
    uCloudMap: null,
    uSunDirection: new THREE.Vector3(1, 0, 0), // World space sun direction
    uTime: 0,
    uCloudSpeed: 0.05, // Increased slightly
    uAtmosphereDensity: 1.0,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      // Calculate World Normal (assuming uniform scale, otherwise use inverse transpose)
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  // Fragment Shader
  `
    uniform sampler2D uDayMap;
    uniform sampler2D uNightMap;
    uniform sampler2D uCloudMap;
    uniform vec3 uSunDirection;
    uniform float uTime;
    uniform float uCloudSpeed;

    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormalWorld);
      vec3 sunDir = normalize(uSunDirection);
      
      // Standard diffuse lighting based on World Space alignment
      float sunOrientation = dot(normal, sunDir);
      
      // Smooth Terminator
      float dayMix = smoothstep(-0.15, 0.15, sunOrientation);
      
      // Sample Textures
      vec3 dayColor = texture2D(uDayMap, vUv).rgb;
      vec3 nightColor = texture2D(uNightMap, vUv).rgb;
      
      // Clouds - Shift UVs for animation
      vec2 cloudUv = vUv;
      cloudUv.x -= uTime * uCloudSpeed * 0.05; 
      vec4 cloudSample = texture2D(uCloudMap, cloudUv);
      // Use Green channel if cloud map is not transparent, usually cloud maps are B/W
      float cloudAlpha = cloudSample.r; 
      
      // Cloud shadow on the ground (parallax fake)
      // float cloudShadow = smoothstep(0.5, 0.6, texture2D(uCloudMap, cloudUv + vec2(0.005, 0.0)).r);
      // dayColor *= (1.0 - cloudShadow * 0.3);

      // Composition
      // Night: Lights masked by clouds (clouds are dark at night usually, or slightly lit by city lights?)
      // For simplicity: Clouds block city lights.
      vec3 nightComp = nightColor * (1.0 - cloudAlpha * 0.8);
      
      // Day: Clouds are white
      vec3 dayComp = mix(dayColor, vec3(1.0), cloudAlpha * 0.9);
      
      vec3 finalColor = mix(nightComp, dayComp, dayMix);
      
      // Atmospheric Rim (Fresnel)
      // We use View Normal for this usually, but we can approximate with viewDir and World Normal if camera is far
      // Let's use a simple view-dependent rim
      // We need view direction in World Space OR Normal in View Space.
      // We have vViewPosition (View Space) -> View Direction is normalize(vViewPosition)
      // We need View Space Normal for accurate Fresnel.
      // Let's re-calculate View Normal roughly or just skip complex fresnel here and use separate atmosphere mesh.
      
      gl_FragColor = vec4(finalColor, 1.0);
      
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ EarthMaterial });

export { EarthMaterial };
