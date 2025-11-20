import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

// A physically-based atmospheric scattering shader.
// Based on the work of Sebastian Lague and other sources.
const AtmosphericScatteringShader = shaderMaterial(
  // Uniforms
  {
    uSunPosition: new THREE.Vector3(1, 0, 0),
    uPlanetRadius: 4.2,
    uAtmosphereRadius: 4.2 * 1.2,
    uRayleighCoefficient: 2.5,
    uMieCoefficient: 0.005,
    uMieDirectionalG: 0.8,
    uLightColor: new THREE.Color(1.0, 1.0, 0.95),
    cameraPosition: new THREE.Vector3(0, 0, 15),

    // Wavelengths of light (in nm)
    uRayleighWavelengths: new THREE.Vector3(700, 530, 440),
  },
  // Vertex Shader
  `
    varying vec3 vWorldPosition;

    void main() {
      // Pass world position of vertex to fragment shader
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform vec3 uSunPosition;
    uniform float uPlanetRadius;
    uniform float uAtmosphereRadius;
    uniform float uRayleighCoefficient;
    uniform float uMieCoefficient;
    uniform float uMieDirectionalG;
    uniform vec3 uLightColor;
    uniform vec3 uRayleighWavelengths;
    uniform vec3 cameraPosition; // Provided by useFrame

    varying vec3 vWorldPosition;

    const int NUM_SAMPLES = 16;
    const int NUM_LIGHT_SAMPLES = 8;
    const float PI = 3.14159265359;
    const float DEPOLARIZATION_FACTOR = 1.0; 

    // Function to solve for ray-sphere intersection
    // Returns a vec2 with the near and far intersection points.
    vec2 raySphereIntersect(vec3 rayOrigin, vec3 rayDir, float radius) {
      float a = dot(rayDir, rayDir);
      float b = 2.0 * dot(rayOrigin, rayDir);
      float c = dot(rayOrigin, rayOrigin) - (radius * radius);
      float discriminant = b * b - 4.0 * a * c;
      if (discriminant < 0.0) {
        return vec2(-1.0, -1.0);
      }
      float sqrtDiscriminant = sqrt(discriminant);
      float t0 = (-b - sqrtDiscriminant) / (2.0 * a);
      float t1 = (-b + sqrtDiscriminant) / (2.0 * a);
      return vec2(t0, t1);
    }
    
    // Rayleigh phase function
    float rayleighPhase(float cosTheta) {
        float phase = (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
        return phase / DEPOLARIZATION_FACTOR; // Unpolarized light
    }

    // Henyey-Greenstein Mie phase function
    float hgPhase(float cosTheta, float g) {
      float g2 = g * g;
      return (1.0 / (4.0 * PI)) * ((1.0 - g2) / pow(1.0 - 2.0 * g * cosTheta + g2, 1.5));
    }
    
    // Calculates scattering coefficients based on wavelength
    vec3 getScatteringCoefficients(float rayleighCoeff, vec3 wavelengths) {
        vec3 invWavelengths = 1.0 / pow(wavelengths, vec3(4.0));
        return rayleighCoeff * invWavelengths;
    }

    float getDensityAtPoint(vec3 point, float planetRadius, float atmosphereRadius) {
        float height = length(point) - planetRadius;
        float density = exp(-height / (atmosphereRadius - planetRadius));
        return density;
    }

    float getOpticalDepth(vec3 origin, vec3 dir, float rayLength, float planetRadius, float atmosphereRadius, int numSamples) {
        float opticalDepth = 0.0;
        float stepSize = rayLength / float(numSamples);
        for (int i = 0; i < numSamples; i++) {
            vec3 samplePoint = origin + dir * (float(i) + 0.5) * stepSize;
            float density = getDensityAtPoint(samplePoint, planetRadius, atmosphereRadius);
            opticalDepth += density * stepSize;
        }
        return opticalDepth;
    }


    void main() {
      // --- Final Color: Transmittance + In-Scattering ---
      vec3 finalColor = vec3(0.0);
      
      // Calculate ray from camera to vertex
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      
      // Intersection of view ray with atmosphere
      vec2 atmosphereIntersect = raySphereIntersect(cameraPosition, viewDir, uAtmosphereRadius);

      // Discard if ray doesn't hit atmosphere
      if(atmosphereIntersect.y < 0.0) {
        discard;
      }

      // Shorten ray length if it hits the planet
      vec2 planetIntersect = raySphereIntersect(cameraPosition, viewDir, uPlanetRadius);
      float rayLength = atmosphereIntersect.y;
      if (planetIntersect.y > 0.0) {
        rayLength = min(rayLength, planetIntersect.y);
      }

      // Ray march through the atmosphere
      float stepSize = rayLength / float(NUM_SAMPLES);
      vec3 transmittance = vec3(1.0);
      
      // Scattering coefficients
      vec3 rayleighScattering = getScatteringCoefficients(uRayleighCoefficient, uRayleighWavelengths);
      vec3 mieScattering = vec3(uMieCoefficient);

      for (int i = 0; i < NUM_SAMPLES; i++) {
        vec3 samplePoint = cameraPosition + viewDir * (float(i) + 0.5) * stepSize;
        
        // Calculate density at sample point
        float density = getDensityAtPoint(samplePoint, uPlanetRadius, uAtmosphereRadius);
        if (density <= 0.0) continue;

        // Optical depth from sample point to sun
        float sunRayLength = raySphereIntersect(samplePoint, uSunPosition, uAtmosphereRadius).y;
        float sunOpticalDepth = getOpticalDepth(samplePoint, uSunPosition, sunRayLength, uPlanetRadius, uAtmosphereRadius, NUM_LIGHT_SAMPLES);
        
        // Transmittance from sun to sample point
        vec3 sunTransmittance = exp(-(rayleighScattering + mieScattering) * sunOpticalDepth);
        
        // --- In-Scattering ---
        float cosTheta = dot(viewDir, uSunPosition);
        float rayleigh = rayleighPhase(cosTheta);
        float mie = hgPhase(cosTheta, uMieDirectionalG);

        vec3 inScatteredLight = (rayleigh * rayleighScattering + mie * mieScattering) * sunTransmittance;
        finalColor += inScatteredLight * density * stepSize * transmittance;

        // Update view ray transmittance
        transmittance *= exp(-(rayleighScattering + mieScattering) * density * stepSize);
      }

      gl_FragColor = vec4(uLightColor * finalColor, 1.0 - transmittance.r);
    }
  `
);

extend({ AtmosphericScatteringShader });

export { AtmosphericScatteringShader };
