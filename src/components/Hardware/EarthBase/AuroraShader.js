import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { extend } from '@react-three/fiber';

const AuroraMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#00ff88'), // Green default
    uColor2: new THREE.Color('#aa00ff'), // Purple top
    uOpacity: 0.5,
    uSpeed: 0.2,
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uSpeed;

    void main() {
      vUv = uv;
      vPosition = position;

      // Wiggle the vertices slightly for organic movement
      vec3 pos = position;
      float noise = sin(pos.x * 5.0 + uTime * uSpeed) * 0.1;
      pos.y += noise;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    varying vec2 vUv;
    varying vec3 vPosition;
    uniform float uTime;
    uniform float uSpeed;
    uniform vec3 uColor;
    uniform vec3 uColor2;
    uniform float uOpacity;

    // Simplex 2D noise
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
               -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }

    void main() {
      // Curtain effect: vertical streaks moving horizontally
      float noiseVal = snoise(vec2(vUv.x * 10.0 + uTime * uSpeed, vUv.y * 2.0));
      float noiseVal2 = snoise(vec2(vUv.x * 20.0 - uTime * uSpeed * 1.5, vUv.y * 5.0 + uTime * 0.1));
      
      float intensity = smoothstep(0.0, 0.8, noiseVal + noiseVal2 * 0.5);
      
      // Vertical Fade (top and bottom of the curtain)
      float verticalFade = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
      
      vec3 finalColor = mix(uColor, uColor2, vUv.y);
      
      gl_FragColor = vec4(finalColor, intensity * uOpacity * verticalFade);
    }
  `
);

extend({ AuroraMaterial });

export { AuroraMaterial };

