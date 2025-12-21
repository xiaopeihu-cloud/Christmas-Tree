import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const Snow = () => {
  // Reduced count for "Universe/Space" feel (Star dust)
  const count = 200;
  const mesh = useRef<THREE.Points>(null);
  
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    for(let i=0; i<count; i++) {
      // Wider scatter for space feel
      pos[i*3] = (Math.random() - 0.5) * 40; 
      pos[i*3+1] = Math.random() * 30 - 10;
      pos[i*3+2] = (Math.random() - 0.5) * 40;
      // Slower velocity for floating in space
      vel[i] = Math.random() * 0.02 + 0.005;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useFrame(() => {
    if (!mesh.current) return;
    const posAttr = mesh.current.geometry.attributes.position;
    
    for(let i=0; i<count; i++) {
        let y = posAttr.getY(i);
        y -= velocities[i];
        // Loop back up
        if (y < -15) y = 20;
        posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial 
        color="white" 
        size={0.08} 
        transparent 
        opacity={0.6} 
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
};