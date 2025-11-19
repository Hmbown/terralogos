import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

// Vertex Shader: Standard displacement
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Fragment Shader: Volumetric noise energy ring
const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  // Simplex noise 3D
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

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    // Permutations
    i = mod289(i);
    vec4 p = permute( permute( permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 0.142857142857; // 1.0/7.0
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                  dot(p2,x2), dot(p3,x3) ) );
  }

  void main() {
    // Create a rolling energy effect
    // Map position to noise space
    vec3 noiseCoord = vPosition * 0.5 + vec3(0.0, 0.0, uTime * 0.5);

    // Multiple layers of noise for detail
    float n1 = snoise(noiseCoord);
    float n2 = snoise(noiseCoord * 2.0 + vec3(uTime));

    float noise = n1 * 0.6 + n2 * 0.4;

    // Create ring shape logic in shader if using a quad, but here we are on a Torus.
    // We want to make the torus look like it's made of plasma.

    // Intensity falloff at edges of the torus tube is handled by geometry/view angle normally
    // But let's enhance it.
    // We don't have vViewPosition easily without calculating it in Vertex.
    // Let's just rely on additive blending and noise.

    // Pulse intensity
    float pulse = sin(uTime * 3.0) * 0.2 + 0.8;

    // Brightness threshold
    float brightness = smoothstep(0.2, 0.8, noise + 0.5);

    // Color
    vec3 finalColor = uColor * brightness * pulse * uIntensity * 2.0;

    // Add a core hot white
    float core = smoothstep(0.7, 1.0, noise + 0.5);
    finalColor += vec3(1.0) * core * uIntensity;

    float alpha = (brightness * 0.5 + core) * uIntensity;

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

const SolarFlareRing = ({ earthRadius = 4.2 }) => {
    const meshRef = useRef();
    const { solar } = useHVCStore((state) => state.data.metrics);

    const getFlareIntensity = (flareClass) => {
        if (!flareClass) return 0;
        const classMap = { A: 0.1, B: 0.2, C: 0.4, M: 0.7, X: 1.0 };
        return classMap[flareClass] || 0;
    };

    const intensity = getFlareIntensity(solar?.class);

    // Only render if there is significant activity
    // Lower threshold for visibility to show idle state nicely?
    // Prompt says "Pulse organically based on flare class", implying it might always be there but faint?
    // Prompt also says "Show for C, M, X".
    const isActive = intensity >= 0.1;

    const flareColor = useMemo(() => {
        if (!solar?.class) return new THREE.Color('#ffaa00');
        if (solar.class === 'X') return new THREE.Color('#ff0000');
        if (solar.class === 'M') return new THREE.Color('#ff6600');
        if (solar.class === 'C') return new THREE.Color('#ffaa00');
        return new THREE.Color('#ffeeaa');
    }, [solar?.class]);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#ffaa00') },
        uIntensity: { value: 0 }
    }), []);

    useFrame((state) => {
        if (!meshRef.current) return;

        meshRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
        meshRef.current.material.uniforms.uColor.value = flareColor;

        // Smooth intensity transition could be added here, but direct mapping is fine for now
        // Add a base low intensity for visibility if active
        const targetIntensity = isActive ? Math.max(intensity, 0.2) : 0;

        // Lerp current intensity for smoothness
        const current = meshRef.current.material.uniforms.uIntensity.value;
        meshRef.current.material.uniforms.uIntensity.value = THREE.MathUtils.lerp(current, targetIntensity, 0.1);

        // Rotate the ring to face the sun roughly?
        // Position is fixed in parent, but we can rotate the noise texture by rotating mesh
        meshRef.current.rotation.z += 0.002;
    });

    if (!isActive && intensity < 0.1) return null;

    return (
        <group position={[100, 0, 20].map(v => v * 0.05)} lookAt={[0,0,0]}>
             {/* Using a Sphere modified to look like a corona burst or a Torus as before?
                 Prompt says "TorusGeometry... Target: Create a volumetric, dynamic effect... Use a custom shader on a sphere or noise-displaced mesh"
                 Let's use a Sphere and use noise to make it look like a shell/shockwave.
              */}
             <mesh ref={meshRef} rotation={[0, Math.PI / 2, 0]}>
                {/* A sphere sector or just a sphere that is transparent */}
                <sphereGeometry args={[earthRadius * 1.5, 64, 64, 0, Math.PI * 2, 0, Math.PI * 0.7]} />
                {/* Partial sphere (hemisphere-ish) facing sun */}
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Core flash for high intensity */}
            {intensity > 0.8 && (
                <mesh>
                    <sphereGeometry args={[earthRadius * 0.5, 32, 32]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.5}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
        </group>
    );
};

export default SolarFlareRing;
