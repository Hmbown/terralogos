import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const AtmosphereGlowMaterial = shaderMaterial(
  {
    uSunDirection: new THREE.Vector3(1, 0, 0),
    uColor: new THREE.Color(0.3, 0.6, 1.0),
    uCoefficient: 0.6,
    uPower: 4.0,
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uSunDirection;
    uniform vec3 uColor;
    uniform float uCoefficient;
    uniform float uPower;
    varying vec3 vNormal;

    void main() {
      float intensity = pow(uCoefficient - dot(vNormal, vec3(0, 0, 1.0)), uPower);
      // Simple constant alpha
      gl_FragColor = vec4(uColor, intensity);
    }
  `
);

extend({ AtmosphereGlowMaterial });

export { AtmosphereGlowMaterial };

