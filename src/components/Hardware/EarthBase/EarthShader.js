import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const EarthMaterial = shaderMaterial(
  {
    uDayMap: null,
    uNightMap: null,
    uCloudMap: null,
    uCloudMap2: null, // Second cloud layer
    uBumpMap: null,
    uSpecMap: null,
    uSunDirection: new THREE.Vector3(1, 0, 0),
    uTime: 0,
    uCloudSpeed: 0.05,
    uCloudSpeed2: 0.03, // Different speed for depth
    uNightBoost: 1.3,
    uSpecPower: 80.0,
    uSpecStrength: 1.15,
    uCityGlow: 1.2,
    uHorizonSoftness: 0.25,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    void main() {
      vUv = uv;
      // Calculate World Normal (assuming uniform scale, otherwise use inverse transpose)
      vNormalWorld = normalize(mat3(modelMatrix) * normal);
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      
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
    uniform sampler2D uCloudMap2;
    uniform sampler2D uBumpMap;
    uniform sampler2D uSpecMap;
    uniform vec3 uSunDirection;
    uniform float uTime;
    uniform float uCloudSpeed;
    uniform float uCloudSpeed2;
    uniform float uNightBoost;
    uniform float uSpecPower;
    uniform float uSpecStrength;
    uniform float uCityGlow;
    uniform float uHorizonSoftness;

    varying vec2 vUv;
    varying vec3 vNormalWorld;
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;

    float saturate(float x) {
      return clamp(x, 0.0, 1.0);
    }

    // Cheap tangent basis from normal; adequate for a sphere
    mat3 computeTBN(vec3 normal) {
      vec3 up = abs(normal.y) > 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
      vec3 tangent = normalize(cross(up, normal));
      vec3 bitangent = normalize(cross(normal, tangent));
      return mat3(tangent, bitangent, normal);
    }

    void main() {
      vec3 normal = normalize(vNormalWorld);
      vec3 viewDir = normalize(vViewPosition);
      vec3 sunDir = normalize(uSunDirection);

      // Lightweight normal perturbation from bump map
      float height = texture2D(uBumpMap, vUv).r;
      float heightU = texture2D(uBumpMap, vUv + vec2(0.0015, 0.0)).r;
      float heightV = texture2D(uBumpMap, vUv + vec2(0.0, 0.0015)).r;
      vec3 bumpNormal = normalize(vec3((heightU - height) * 14.0, (heightV - height) * 14.0, 1.0));
      normal = normalize(computeTBN(normal) * bumpNormal);

      // Sun/Earth alignment
      float sunOrientation = dot(normal, sunDir);
      float dayMix = smoothstep(-uHorizonSoftness, uHorizonSoftness, sunOrientation);
      float twilight = smoothstep(-0.25, 0.1, sunOrientation);

      // Sample base color maps
      vec3 dayColor = texture2D(uDayMap, vUv).rgb;
      vec3 nightColor = texture2D(uNightMap, vUv).rgb * uNightBoost;

      // Clouds Layer 1 - Fast
      vec2 cloudUv = vUv + vec2(-uTime * uCloudSpeed * 0.02, 0.0);
      vec4 cloudSample = texture2D(uCloudMap, cloudUv);
      float cloudAlpha = cloudSample.r;
      
      // Clouds Layer 2 - Slow/Different Pattern (Uses same texture but offset)
      vec2 cloudUv2 = vUv + vec2(uTime * uCloudSpeed2 * 0.01, uTime * 0.004);
      vec4 cloudSample2 = texture2D(uCloudMap2, cloudUv2 + vec2(0.3, 0.1));
      float cloudAlpha2 = cloudSample2.r;

      // Combine Clouds
      float totalCloud = saturate(cloudAlpha * 0.9 + cloudAlpha2 * 0.7);

      // Specular highlights driven by ocean mask
      float oceanMask = texture2D(uSpecMap, vUv).r;
      vec3 halfDir = normalize(sunDir + viewDir);
      float specularTerm = pow(saturate(dot(normal, halfDir)), uSpecPower) * oceanMask * uSpecStrength * dayMix;

      // Fresnel rim for subtle atmospheric glow on the surface
      float fresnel = pow(1.0 - saturate(dot(normal, viewDir)), 3.0);

      // Night side city glow enhanced near the terminator
      float nightMask = smoothstep(0.0, 0.4, -sunOrientation);
      vec3 cityGlow = nightColor * nightMask * uCityGlow * (1.0 - totalCloud * 0.7);

      // Day composition: mix with white for clouds
      vec3 dayComp = mix(dayColor, vec3(1.0), totalCloud * 0.85);
      dayComp += specularTerm;

      // Night composition: hide under clouds, add glow near twilight
      vec3 nightComp = mix(nightColor, cityGlow, twilight);

      vec3 finalColor = mix(nightComp, dayComp, dayMix);
      finalColor += fresnel * vec3(0.08, 0.12, 0.2);

      gl_FragColor = vec4(finalColor, 1.0);

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `
);

extend({ EarthMaterial });

export { EarthMaterial };
