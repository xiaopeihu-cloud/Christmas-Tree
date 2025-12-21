import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS, CONFIG } from '../constants';

const vertexShader = `
  uniform float uTime;
  uniform float uUnleash; // 0 = Tree, 1 = Chaos
  
  attribute vec3 aTargetPos;
  attribute vec3 aRandomPos;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aPhase;

  varying float vAlpha;

  // Cubic Bezier interpolation for smooth "S" curve
  float easeInOutCubic(float x) {
    return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) / 2.0;
  }

  void main() {
    float t = easeInOutCubic(uUnleash);
    
    // Mix between tree form and random chaos
    vec3 mixedPos = mix(aTargetPos, aRandomPos, t);
    
    // Add spiral effect during transition
    // Reduced spin multiplier for less violent transition (4.0 -> 2.0)
    float spinAngle = t * 2.0 * (aPhase - 3.14); 
    float c = cos(spinAngle);
    float s = sin(spinAngle);
    mat2 rot = mat2(c, -s, s, c);
    mixedPos.xz = rot * mixedPos.xz;
    
    // Add some organic movement breathing
    float breathe = sin(uTime * aSpeed + aPhase) * 0.1 * (1.0 - t); // Breathe only when tree
    
    // Add floating movement when unleashed
    // Reduced amplitude (2.0 -> 0.5) to keep particles from floating off screen
    float floatY = sin(uTime * 0.5 + aPhase) * 0.5 * t;
    
    vec3 finalPos = mixedPos + vec3(0.0, breathe + floatY, 0.0);

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Size attenuation
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    
    // Fade out slightly when moving
    vAlpha = 1.0;
  }
`;

const fragmentShader = `
  varying float vAlpha;
  uniform vec3 uColor;

  void main() {
    // Circular particle
    vec2 center = gl_PointCoord - 0.5;
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft glow edge
    float glow = 1.0 - smoothstep(0.3, 0.5, dist);
    
    gl_FragColor = vec4(uColor, vAlpha * glow);
  }
`;

export const TreeParticles: React.FC<{ unleashFactor: number }> = ({ unleashFactor }) => {
  const mesh = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const { count, geometry } = useMemo(() => {
    const count = CONFIG.PARTICLE_COUNT;
    const geom = new THREE.BufferGeometry();
    
    const targetPositions = [];
    const randomPositions = [];
    const sizes = [];
    const speeds = [];
    const phases = [];

    for (let i = 0; i < count; i++) {
      // Tree Shape (Cone)
      // Normalized height 0 to 1
      // Power of 1.5 biases distribution towards the bottom (0)
      const bias = Math.pow(Math.random(), 1.5); 
      // Cap at 0.95 to leave the star tip clear
      const h = bias * 0.95; 
      
      const y = h * CONFIG.TREE_HEIGHT - (CONFIG.TREE_HEIGHT / 2);
      // Radius decreases as height increases
      const r = (1 - h) * CONFIG.TREE_RADIUS;
      const theta = Math.random() * Math.PI * 2;
      
      // Add slight volume jitter so they aren't just on surface
      const jitter = 0.6; // Increased jitter for fluffier look
      
      const tx = (r + (Math.random() - 0.5) * jitter) * Math.cos(theta);
      const tz = (r + (Math.random() - 0.5) * jitter) * Math.sin(theta);
      
      targetPositions.push(tx, y, tz);

      // Random Chaos Shape -> OVAL FORM (Ellipsoid)
      // Constrained dimensions to keep particles ON SCREEN at Z=20
      
      const ovalWidth = 14;   // X radius (Total width ~28)
      const ovalHeight = 8;   // Y radius (Total height ~16)
      const ovalDepth = 4;    // Z radius (Flattish)
      
      // Random point in/on ellipsoid
      const u = Math.random();
      const v = Math.random();
      const thetaR = 2 * Math.PI * u;
      const phiR = Math.acos(2 * v - 1);
      
      // Thickness variance (0.6 to 1.0) - kept tighter
      const shellThickness = 0.6 + Math.random() * 0.4; 
      
      const rx = ovalWidth * shellThickness * Math.sin(phiR) * Math.cos(thetaR);
      const ry = ovalHeight * shellThickness * Math.sin(phiR) * Math.sin(thetaR);
      const rz = ovalDepth * shellThickness * Math.cos(phiR);
      
      randomPositions.push(rx, ry, rz);

      sizes.push(Math.random() * 0.4 + 0.1);
      speeds.push(Math.random() + 0.5);
      phases.push(Math.random() * Math.PI * 2);
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(targetPositions, 3));
    geom.setAttribute('aTargetPos', new THREE.Float32BufferAttribute(targetPositions, 3));
    geom.setAttribute('aRandomPos', new THREE.Float32BufferAttribute(randomPositions, 3));
    geom.setAttribute('aSize', new THREE.Float32BufferAttribute(sizes, 1));
    geom.setAttribute('aSpeed', new THREE.Float32BufferAttribute(speeds, 1));
    geom.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));

    return { count, geometry: geom };
  }, []);

  // Memoize uniforms so they don't reset on every render
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uUnleash: { value: 0 },
    uColor: { value: COLORS.PLATINUM },
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime();
      // Smooth lerp for the uniform
      materialRef.current.uniforms.uUnleash.value = THREE.MathUtils.lerp(
        materialRef.current.uniforms.uUnleash.value,
        unleashFactor,
        0.1
      );
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        uniforms={uniforms}
      />
    </points>
  );
};