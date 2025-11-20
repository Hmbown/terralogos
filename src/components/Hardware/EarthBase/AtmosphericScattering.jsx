import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import { AtmosphericScatteringShader } from './AtmosphericScatteringShader';

const AtmosphericScatteringMaterial = shaderMaterial(
  {
    uSunDirection: new THREE.Vector3(1, 0, 0),
    uAtmosphereColor: new THREE.Color(0.3, 0.6, 1.0),
    uSunsetColor: new THREE.Color(1.0, 0.5, 0.0),
    uRadius: 4.2,
    uThickness: 0.15, // Relative to radius
    uPower: 4.0,
  },
  // Vertex Shader
  `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader - Simple Rayleigh approximation
  `
    uniform vec3 uSunDirection;
    uniform vec3 uAtmosphereColor;
    uniform vec3 uSunsetColor;
    uniform float uPower;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDir = normalize(cameraPosition - vPosition);
      vec3 normal = normalize(vNormal);
      
      // Fresnel / Rim factor
      float viewDot = dot(viewDir, normal);
      float rim = pow(1.0 - max(0.0, viewDot), uPower);
      
      // Day/Night Scattering
      // Angle to sun determines if it's blue sky or sunset
      // We use the normal vs sun direction for this surface-based approximation
      float sunDot = dot(normal, normalize(uSunDirection));
      
      // Mix blue (zenith) and orange (horizon/terminator)
      vec3 scatterColor = mix(uSunsetColor, uAtmosphereColor, max(0.0, sunDot + 0.3));
      
      // Only show rim on the lit side + twilight, fade out on deep night side
      float visibility = smoothstep(-0.2, 0.1, sunDot) * 0.8 + 0.2;
      
      gl_FragColor = vec4(scatterColor, rim * visibility);
    }
  `
);

extend({ AtmosphericScatteringMaterial });

const AtmosphericScattering = ({ radius = 4.2, sunDirection = new THREE.Vector3(1, 0, 0), intensity = 1.0 }) => {
  const innerRef = useRef();
  const outerRef = useRef();

  const tintColor = useMemo(() => new THREE.Color('#6fb9ff'), []);
  const sunsetColor = useMemo(() => new THREE.Color('#ff8844'), []);

  useFrame(({ camera }) => {
    const sun = sunDirection || new THREE.Vector3(1, 0, 0);

    if (innerRef.current) {
      innerRef.current.uSunDirection = sun;
      innerRef.current.uAtmosphereColor = tintColor;
      innerRef.current.uSunsetColor = sunsetColor;
      innerRef.current.uPower = 3.5 - Math.min(intensity, 1.5) * 0.6;
    }

    if (outerRef.current) {
      outerRef.current.uSunPosition.copy(sun);
      outerRef.current.cameraPosition.copy(camera.position);
      outerRef.current.uLightColor = tintColor.clone().lerp(new THREE.Color('#ffffff'), 0.25);
      outerRef.current.uRayleighCoefficient = 2.5 * intensity;
      outerRef.current.uMieCoefficient = 0.004 * intensity;
      outerRef.current.uMieDirectionalG = 0.78;
    }
  });

  return (
    <group>
      <mesh scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[radius, 96, 96]} />
        <atmosphericScatteringMaterial
          ref={innerRef}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          uRadius={radius}
        />
      </mesh>
      <mesh scale={[1.08, 1.08, 1.08]}>
        <sphereGeometry args={[radius, 64, 64]} />
        <atmosphericScatteringShader
          ref={outerRef}
          transparent
          side={THREE.BackSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uPlanetRadius={radius}
          uAtmosphereRadius={radius * 1.25}
        />
      </mesh>
    </group>
  );
};

export default AtmosphericScattering;
