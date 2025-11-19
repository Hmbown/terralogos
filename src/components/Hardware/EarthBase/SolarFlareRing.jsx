import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

/**
 * SolarFlareRing - Visualizes solar flare activity as an energetic ring/corona
 * Shows on the sun-facing side of Earth with intensity based on flare class
 */
const SolarFlareRing = ({ earthRadius = 4.2 }) => {
    const ringRef = useRef();
    const glowRef = useRef();
    const { solar } = useHVCStore((state) => state.metrics);

    // Map flare class to intensity
    const getFlareIntensity = (flareClass) => {
        if (!flareClass) return 0;
        const classMap = { A: 0.1, B: 0.2, C: 0.4, M: 0.7, X: 1.0 };
        return classMap[flareClass] || 0;
    };

    const intensity = getFlareIntensity(solar?.class);
    const isActive = intensity > 0.3; // Show for C, M, X class flares

    // Color based on flare class
    const flareColor = useMemo(() => {
        if (!solar?.class) return new THREE.Color('#ffffff');
        if (solar.class === 'X') return new THREE.Color('#ff0000'); // Red for X-class
        if (solar.class === 'M') return new THREE.Color('#ff6600'); // Orange for M-class
        if (solar.class === 'C') return new THREE.Color('#ffaa00'); // Yellow for C-class
        return new THREE.Color('#ffdd88'); // Pale yellow for A/B
    }, [solar?.class]);

    useFrame((state, delta) => {
        if (!ringRef.current || !glowRef.current) return;

        if (isActive) {
            // Pulsing animation
            const pulseSpeed = 2 + intensity * 3;
            const pulse = Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.5 + 0.5;

            // Scale based on intensity
            const baseScale = 1 + intensity * 0.3;
            const scale = baseScale + pulse * 0.15 * intensity;
            ringRef.current.scale.setScalar(scale);
            glowRef.current.scale.setScalar(scale * 1.1);

            // Rotate slowly
            ringRef.current.rotation.z += delta * 0.5;
            glowRef.current.rotation.z -= delta * 0.3;

            // Opacity pulsing
            ringRef.current.material.opacity = 0.5 + pulse * 0.3;
            glowRef.current.material.opacity = 0.3 + pulse * 0.2;

            ringRef.current.visible = true;
            glowRef.current.visible = true;
        } else {
            ringRef.current.visible = false;
            glowRef.current.visible = false;
        }
    });

    if (!isActive) return null;

    const ringRadius = earthRadius * 1.4;
    const ringThickness = earthRadius * 0.2;

    return (
        <group position={[100, 0, 20].map(v => v * 0.05)}> {/* Sun-facing side */}
            {/* Main flare ring */}
            <mesh ref={ringRef}>
                <torusGeometry args={[ringRadius, ringThickness, 16, 64]} />
                <meshBasicMaterial
                    color={flareColor}
                    transparent
                    opacity={0.6}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Outer glow */}
            <mesh ref={glowRef}>
                <torusGeometry args={[ringRadius * 1.2, ringThickness * 0.8, 16, 64]} />
                <meshBasicMaterial
                    color={flareColor}
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Center flash for X-class */}
            {solar?.class === 'X' && (
                <mesh>
                    <sphereGeometry args={[earthRadius * 0.3, 16, 16]} />
                    <meshBasicMaterial
                        color="#ffffff"
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            )}
        </group>
    );
};

export default SolarFlareRing;
