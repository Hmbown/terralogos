import React from 'react';
import * as THREE from 'three';

/**
 * GridLines - Subtle latitude/longitude grid to help orient the Earth visualization
 */
const GridLines = ({ radius = 4.25 }) => {
  const lines = [];
  const segments = 32;

  // Latitude lines (horizontal circles)
  for (let i = -8; i <= 8; i++) {
    if (i === 0) continue; // Skip equator for less clutter
    const lat = (i / 8) * 90;
    const points = [];
    for (let j = 0; j <= segments; j++) {
      const lon = (j / segments) * 360 - 180;
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lon + 180) * Math.PI) / 180;
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    lines.push(
      <line key={`lat-${i}`} geometry={geometry}>
        <lineBasicMaterial color="#333366" transparent opacity={0.2} />
      </line>
    );
  }

  // Longitude lines (vertical arcs)
  for (let i = 0; i < 12; i++) {
    const lon = (i / 12) * 360 - 180;
    const points = [];
    for (let j = 0; j <= segments; j++) {
      const lat = (j / segments) * 180 - 90;
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lon + 180) * Math.PI) / 180;
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      points.push(new THREE.Vector3(x, y, z));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    lines.push(
      <line key={`lon-${i}`} geometry={geometry}>
        <lineBasicMaterial color="#333366" transparent opacity={0.2} />
      </line>
    );
  }

  return <group>{lines}</group>;
};

export default GridLines;

