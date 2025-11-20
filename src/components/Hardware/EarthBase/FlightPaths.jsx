import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { extend, useFrame } from '@react-three/fiber';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import flightData from '../../../core/utils/flightData';

extend({ MeshLineGeometry, MeshLineMaterial });

const AnimatedLine = ({ curve }) => {
  const material = useRef();

  useFrame((_, delta) => {
    if (material.current) {
      material.current.uniforms.dashOffset.value -= delta * 0.1;
    }
  });

  return (
    <mesh>
      <meshLineGeometry points={curve.getPoints(200)} />
      <meshLineMaterial
        ref={material}
        transparent
        lineWidth={0.02}
        color={new THREE.Color(0xffffff)}
        dashArray={0.1}
        dashRatio={0.5}
      />
    </mesh>
  );
};

const FlightPaths = ({ radius = 4.2 }) => {
  const [curves, points] = useMemo(() => {
    const lines = [];
    const points = [];
    flightData.forEach(flight => {
      const start = flight.start;
      const end = flight.end;

      const start3D = new THREE.Vector3().setFromSphericalCoords(radius + 0.1, THREE.MathUtils.degToRad(90 - start[0]), THREE.MathUtils.degToRad(start[1]));
      const end3D = new THREE.Vector3().setFromSphericalCoords(radius + 0.1, THREE.MathUtils.degToRad(90 - end[0]), THREE.MathUtils.degToRad(end[1]));
      points.push(start3D);
      points.push(end3D);

      const mid = new THREE.Vector3().addVectors(start3D, end3D).multiplyScalar(0.5);
      mid.setLength(radius * 1.3);

      const curve = new THREE.CatmullRomCurve3([start3D, mid, end3D]);
      lines.push({ curve });
    });
    return [lines, points];
  }, [radius]);

  const instancedMeshRef = useRef();
  useEffect(() => {
    if (instancedMeshRef.current) {
      const dummy = new THREE.Object3D();
      points.forEach((point, i) => {
        dummy.position.copy(point);
        dummy.updateMatrix();
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      });
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [points]);

  return (
    <group>
      {curves.map((line, index) => (
        <AnimatedLine key={index} curve={line.curve} />
      ))}
      <instancedMesh ref={instancedMeshRef} args={[null, null, points.length]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="white" />
      </instancedMesh>
    </group>
  );
};

export default FlightPaths;
