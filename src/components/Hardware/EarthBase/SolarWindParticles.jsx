import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useHVCStore from '../../../core/store/useHVCStore';

/**
 * SolarWindParticles - Visualizes solar wind as flowing particles
 * Particles stream from the sun toward and past Earth
 */
const SolarWindParticles = ({ count = 1000, earthRadius = 4.2 }) => {
    const particlesRef = useRef();
    const { solar, solarWindFlux } = useHVCStore((state) => state.metrics);

    // Solar wind speed (km/s) - typical range 300-800 km/s
    const windSpeed = solar?.windSpeed || solarWindFlux || 400;

    // Map wind speed to particle velocity (visual effect)
    const particleSpeed = (windSpeed / 400) * 0.5; // Normalized

    // Particle positions and velocities
    const particleData = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        const alphas = new Float32Array(count);

        // Sun is at roughly [100, 0, 20] direction, normalized
        const sunDir = new THREE.Vector3(100, 0, 20).normalize();

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Start particles along a cone from sun direction
            const spread = 15; // cone spread
            const distance = Math.random() * 30 + 10; // Distance from Earth

            // Random offset perpendicular to sun direction
            const offsetAngle = Math.random() * Math.PI * 2;
            const offsetMag = (Math.random() - 0.5) * spread;

            // Create perpendicular vectors
            const perp1 = new THREE.Vector3();
            const perp2 = new THREE.Vector3();
            if (Math.abs(sunDir.x) < 0.9) {
                perp1.crossVectors(sunDir, new THREE.Vector3(1, 0, 0)).normalize();
            } else {
                perp1.crossVectors(sunDir, new THREE.Vector3(0, 1, 0)).normalize();
            }
            perp2.crossVectors(sunDir, perp1).normalize();

            const offset = perp1.clone().multiplyScalar(Math.cos(offsetAngle) * offsetMag)
                .add(perp2.clone().multiplyScalar(Math.sin(offsetAngle) * offsetMag));

            const pos = sunDir.clone().multiplyScalar(distance).add(offset);

            positions[i3] = pos.x;
            positions[i3 + 1] = pos.y;
            positions[i3 + 2] = pos.z;

            // Velocity toward -sunDir (toward Earth and beyond)
            const baseVel = sunDir.clone().multiplyScalar(-1);
            velocities[i3] = baseVel.x + (Math.random() - 0.5) * 0.1;
            velocities[i3 + 1] = baseVel.y + (Math.random() - 0.5) * 0.1;
            velocities[i3 + 2] = baseVel.z + (Math.random() - 0.5) * 0.1;

            // Random particle sizes
            sizes[i] = Math.random() * 0.05 + 0.02;
            alphas[i] = Math.random() * 0.5 + 0.3;
        }

        return { positions, velocities, sizes, alphas };
    }, [count]);

    useFrame((state, delta) => {
        if (!particlesRef.current) return;

        const positions = particlesRef.current.geometry.attributes.position.array;
        const { velocities } = particleData;

        const sunDir = new THREE.Vector3(100, 0, 20).normalize();

        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Update position based on velocity and wind speed
            positions[i3] += velocities[i3] * particleSpeed * delta * 10;
            positions[i3 + 1] += velocities[i3 + 1] * particleSpeed * delta * 10;
            positions[i3 + 2] += velocities[i3 + 2] * particleSpeed * delta * 10;

            // Check if particle has passed far beyond Earth
            const distFromOrigin = Math.sqrt(
                positions[i3] ** 2 +
                positions[i3 + 1] ** 2 +
                positions[i3 + 2] ** 2
            );

            // Reset particle if it's too far
            if (distFromOrigin > 40 || distFromOrigin < earthRadius - 1) {
                const spread = 15;
                const distance = Math.random() * 30 + 10;
                const offsetAngle = Math.random() * Math.PI * 2;
                const offsetMag = (Math.random() - 0.5) * spread;

                const perp1 = new THREE.Vector3();
                const perp2 = new THREE.Vector3();
                if (Math.abs(sunDir.x) < 0.9) {
                    perp1.crossVectors(sunDir, new THREE.Vector3(1, 0, 0)).normalize();
                } else {
                    perp1.crossVectors(sunDir, new THREE.Vector3(0, 1, 0)).normalize();
                }
                perp2.crossVectors(sunDir, perp1).normalize();

                const offset = perp1.clone().multiplyScalar(Math.cos(offsetAngle) * offsetMag)
                    .add(perp2.clone().multiplyScalar(Math.sin(offsetAngle) * offsetMag));

                const pos = sunDir.clone().multiplyScalar(distance).add(offset);

                positions[i3] = pos.x;
                positions[i3 + 1] = pos.y;
                positions[i3 + 2] = pos.z;
            }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={count}
                    array={particleData.positions}
                    itemSize={3}
                />
                <bufferAttribute
                    attach="attributes-size"
                    count={count}
                    array={particleData.sizes}
                    itemSize={1}
                />
                <bufferAttribute
                    attach="attributes-alpha"
                    count={count}
                    array={particleData.alphas}
                    itemSize={1}
                />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                color="#00ccff"
                transparent
                opacity={0.6}
                sizeAttenuation={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
};

export default SolarWindParticles;
