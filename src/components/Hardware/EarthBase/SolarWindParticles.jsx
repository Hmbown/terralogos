import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

// Vertex Shader: Handles particle movement and size
const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3 uSunDir;

  attribute float aSize;
  attribute float aAlpha;
  attribute float aRandom;
  attribute vec3 aVelocity;

  varying float vAlpha;
  varying float vDist;

  // Simplex noise function for flow variance
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    // First corner
    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 = v - i + dot(i, C.xxx) ;

    // Other corners
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    //   x0 = x0 - 0.0 + 0.0 * C.xxx;
    //   x1 = x0 - i1  + 1.0 * C.xxx;
    //   x2 = x0 - i2  + 2.0 * C.xxx;
    //   x3 = x0 - 1.0 + 3.0 * C.xxx;
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    // Gradients: 7x7 points over a square, mapped onto an octahedron.
    // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
    //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    //Normalise gradients
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    // Mix final noise value
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    vAlpha = aAlpha;

    // Calculate position over time
    // Start from initial position (position attribute)
    vec3 pos = position;

    // Flow direction is roughly -uSunDir, but with noise
    vec3 flowDir = normalize(-uSunDir + vec3(0.0, 0.0, 0.0));

    // Add noise to movement based on time and position
    float noiseVal = snoise(pos * 0.1 + uTime * 0.2);

    // Calculate displacement
    // Loop behavior: map uTime to a cyclical path or reset logic
    // Here we use a simple modulo logic for the "stream" effect

    // Project position along the flow direction
    float distAlongFlow = dot(pos, flowDir);

    // Move along flow direction
    float moveDist = (uTime * uSpeed * 20.0 + aRandom * 100.0);

    // Create a "tunnel" or "stream" effect
    // We need to reset particles when they go too far.
    // Instead of true reset, we use modulo on the distance along the flow vector

    // Define the simulation box size
    float boxSize = 60.0;

    // Initial projection along sun-earth line
    vec3 startPos = pos;

    // Move
    vec3 currentPos = startPos + flowDir * moveDist;

    // Determine how far we are along the flow
    float currentDist = dot(currentPos, flowDir);

    // Wrap around
    // We want particles to appear from Sun direction (positive) and move to negative
    // Let's say Sun is at +dist, Earth at 0.
    // We want range from +40 to -20.

    float cycle = 60.0; // total length of path
    float offset = 20.0; // shift to center Earth

    // Improved wrap logic:
    // We construct the position relative to a moving frame

    vec3 seedPos = position; // Original random position in a cloud

    // Animated offset along flow direction
    float t = mod(uTime * uSpeed * 5.0 + aRandom * 10.0, 1.0);

    // Interpolate from start (near sun) to end (past earth)
    // Sun is roughly at uSunDir * 30
    // End is uSunDir * -10

    vec3 start = uSunDir * (30.0 + aRandom * 5.0);
    vec3 end = uSunDir * -20.0;

    // Add spread
    vec3 spread = seedPos - (uSunDir * dot(seedPos, uSunDir)); // Component perpendicular to sun dir

    // Add some noise divergence as they get closer to Earth (magnetic deflection)
    float deflection = smoothstep(10.0, -5.0, dot(currentPos, uSunDir));
    vec3 magneticNoise = vec3(
      snoise(vec3(t * 10.0, 0.0, 0.0)),
      snoise(vec3(0.0, t * 10.0, 0.0)),
      snoise(vec3(0.0, 0.0, t * 10.0))
    ) * deflection * 2.0;

    vec3 finalPos = mix(start, end, t) + spread + magneticNoise;

    // Calculate distance from Earth (0,0,0) for fading
    vDist = length(finalPos);

    // Fade in/out at ends
    float fade = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.8, t);
    vAlpha = aAlpha * fade;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
  }
`;

// Fragment Shader: Plasma/Energy look
const fragmentShader = `
  varying float vAlpha;
  varying float vDist;
  uniform vec3 uColor;

  void main() {
    // Soft circle particle
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);

    if (dist > 0.5) discard;

    // Glow effect (soft edge)
    float glow = 1.0 - (dist * 2.0);
    glow = pow(glow, 1.5);

    // Color intensity based on distance to Earth (brighter near Earth due to interaction?)
    // Or just uniform plasma color
    vec3 color = uColor;

    // Add a hot core
    color += vec3(0.2) * smoothstep(0.0, 0.2, glow);

    gl_FragColor = vec4(color, vAlpha * glow);
  }
`;

/**
 * SolarWindParticles - Visualizes solar wind as flowing particles
 * Using custom shaders for high performance and "wow" factor.
 */
const SolarWindParticles = ({ count = 2000, earthRadius = 4.2 }) => {
    const meshRef = useRef();
    const { solar, solarWindFlux } = useHVCStore((state) => state.data.metrics);

    // Solar wind speed (km/s) - typical range 300-800 km/s
    const windSpeed = solar?.windSpeed || solarWindFlux || 400;
    const particleSpeed = (windSpeed / 400) * 0.5;

    // Generate static attributes once
    const attributes = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const alphas = new Float32Array(count);
        const randoms = new Float32Array(count);
        const velocities = new Float32Array(count * 3);

        const sunDir = new THREE.Vector3(100, 0, 20).normalize();

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Create a cloud of points around the sun-earth axis
            // We will project them in the shader
            const spread = 15;

            // Random position in a cylinder along the axis
            const r = Math.sqrt(Math.random()) * spread;
            const theta = Math.random() * Math.PI * 2;

            // Perpendicular vectors
            const perp1 = new THREE.Vector3();
            const perp2 = new THREE.Vector3();
            if (Math.abs(sunDir.x) < 0.9) {
                perp1.crossVectors(sunDir, new THREE.Vector3(1, 0, 0)).normalize();
            } else {
                perp1.crossVectors(sunDir, new THREE.Vector3(0, 1, 0)).normalize();
            }
            perp2.crossVectors(sunDir, perp1).normalize();

            const offset = perp1.multiplyScalar(r * Math.cos(theta))
                .add(perp2.multiplyScalar(r * Math.sin(theta)));

            // Base position (relative to axis)
            positions[i3] = offset.x;
            positions[i3 + 1] = offset.y;
            positions[i3 + 2] = offset.z;

            sizes[i] = Math.random() * 0.2 + 0.1;
            alphas[i] = Math.random() * 0.6 + 0.4;
            randoms[i] = Math.random();

            velocities[i3] = 0; // Handled in shader
        }

        return { positions, sizes, alphas, randoms, velocities };
    }, [count]);

    // Uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uSpeed: { value: particleSpeed },
        uSunDir: { value: new THREE.Vector3(100, 0, 20).normalize() },
        uColor: { value: new THREE.Color('#00ccff') }
    }), []);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
            meshRef.current.material.uniforms.uSpeed.value = (windSpeed / 400) * 0.5;

            // Dynamic color adjustment based on speed/intensity
            const intensity = Math.min((windSpeed - 300) / 500, 1.0);
            const baseColor = new THREE.Color('#00ccff');
            const hotColor = new THREE.Color('#ccffff');
            meshRef.current.material.uniforms.uColor.value.lerpColors(baseColor, hotColor, intensity);
        }
    });

    return (
        <points ref={meshRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={attributes.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-aSize"
                    count={count}
                    array={attributes.sizes}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-aAlpha"
                    count={count}
                    array={attributes.alphas}
                    itemSize={1}
                />
                 <bufferAttribute
                    attach="attributes-aRandom"
                    count={count}
                    array={attributes.randoms}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
};

export default SolarWindParticles;
