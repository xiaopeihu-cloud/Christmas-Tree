import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';
import { CONFIG } from '../constants';

export const TopStar = ({ unleashFactor }: { unleashFactor: number }) => {
  const ref = useRef<THREE.Group>(null);

  // Generate 5-pointed star shape
  const starShape = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    // Reduced size
    const outerRadius = 0.5;
    const innerRadius = 0.2; 
    
    // Start at top
    shape.moveTo(0, outerRadius);
    
    for (let i = 1; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      shape.lineTo(Math.sin(angle) * radius, Math.cos(angle) * radius);
    }
    
    shape.closePath();
    return shape;
  }, []);

  // Extrude settings for "Diamond cut" look
  const extrudeSettings = useMemo(() => ({
    depth: 0.1, // Reduced thickness
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
  }), []);

  useFrame((state) => {
    if (ref.current) {
        // Spin faster when unleashed
        ref.current.rotation.y += 0.01 + (unleashFactor * 0.1);
        
        // Rise up significantly when unleashed to clear the center for text
        // Moves from ~6.8 to ~21.8
        ref.current.position.y = (CONFIG.TREE_HEIGHT / 2 + 0.8) + (unleashFactor * 15);
        
        // Gentle tilt
        ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
        <group ref={ref} position={[0, CONFIG.TREE_HEIGHT/2 + 0.8, 0]}>
          
          {/* Pure Silver Star - No Gold */}
          <mesh>
            <extrudeGeometry args={[starShape, extrudeSettings]} />
            <meshStandardMaterial 
              color="#FFFFFF" 
              metalness={1.0}
              roughness={0.05}     
              emissive="#222222"
            />
          </mesh>

          {/* Internal Glow for visibility - Cool White */}
          <mesh scale={[0.8, 0.8, 0.8]} position={[0, 0, 0.05]}>
            <shapeGeometry args={[starShape]} />
            <meshBasicMaterial color="#E0E0E0" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </mesh>

          {/* Core Light Source - Pure Cold White */}
          <pointLight color="#FFFFFF" intensity={1.5} distance={5} decay={2} />
        </group>
      </Float>
    </group>
  );
};