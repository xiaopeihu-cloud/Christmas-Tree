import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const FairyDust = ({ unleashFactor }: { unleashFactor: number }) => {
  const count = 500;
  const mesh = useRef<THREE.Points>(null);

  // Store static random data to drive animation deterministically
  const data = useMemo(() => {
    const randoms = new Float32Array(count * 3); // x=phase, y=speed, z=radiusOffset
    const sphereDirs = new Float32Array(count * 3); // Normalized directions for scatter
    
    for (let i = 0; i < count; i++) {
       randoms[i * 3] = Math.random() * Math.PI * 2; // Phase
       randoms[i * 3 + 1] = Math.random() * 0.5 + 0.2; // Speed
       randoms[i * 3 + 2] = Math.random() * 2; // Radius offset

       // Random sphere direction
       const theta = Math.random() * Math.PI * 2;
       const phi = Math.acos(2 * Math.random() - 1);
       sphereDirs[i * 3] = Math.sin(phi) * Math.cos(theta);
       sphereDirs[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
       sphereDirs[i * 3 + 2] = Math.cos(phi);
    }
    return { randoms, sphereDirs };
  }, []);

  useFrame((state) => {
    if (!mesh.current) return;
    const time = state.clock.getElapsedTime();
    const posAttribute = mesh.current.geometry.attributes.position;
    
    // Cubic ease for smooth transition
    const t = unleashFactor < 0.5 
        ? 4 * unleashFactor * unleashFactor * unleashFactor 
        : 1 - Math.pow(-2 * unleashFactor + 2, 3) / 2;

    for (let i = 0; i < count; i++) {
        // --- TREE STATE CALCULATION ---
        const phase = data.randoms[i * 3];
        const speed = data.randoms[i * 3 + 1];
        const rOffset = data.randoms[i * 3 + 2];

        // Spiral up motion
        const y = ((time * speed + phase) % 10) - 5; // -5 to 5
        const angle = time * 0.2 + phase;
        const r = 3 + Math.sin(time * 0.5 + phase) * 1 + rOffset;
        
        const treeX = Math.cos(angle) * r;
        const treeY = y;
        const treeZ = Math.sin(angle) * r;

        // --- UNIVERSE STATE CALCULATION ---
        // Scatter outwards but keep in view (reduced from 30+ to 12-18)
        const scatterDist = 12 + (phase * 1); 
        
        const univX = data.sphereDirs[i * 3] * scatterDist;
        const univY = data.sphereDirs[i * 3 + 1] * scatterDist * 0.6; // Flatten slightly
        const univZ = data.sphereDirs[i * 3 + 2] * scatterDist;

        // --- LERP ---
        const x = THREE.MathUtils.lerp(treeX, univX, t);
        const yPos = THREE.MathUtils.lerp(treeY, univY, t);
        const z = THREE.MathUtils.lerp(treeZ, univZ, t);

        posAttribute.setXYZ(i, x, yPos, z);
    }
    
    posAttribute.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(count * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#FFD700"
        size={0.15}
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};