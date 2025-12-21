import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG } from '../constants';

export const Ribbon = ({ unleashFactor }: { unleashFactor: number }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const pearlCount = 500; // Reduced count for "Less is More" elegance

  // Pre-calculate positions
  const data = useMemo(() => {
    const targetPos = [];
    const randomPos = [];
    
    // Generate Curve Path
    const points = [];
    const turns = 5;
    const pointsPerTurn = 20; 
    const totalPoints = turns * pointsPerTurn;
    
    // Generate CatmullRom curve points
    const controlPoints = [];
    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      // Spiral down logic
      const h = (1 - t) * CONFIG.TREE_HEIGHT - (CONFIG.TREE_HEIGHT / 2);
      const r = (t * 0.8 + 0.2) * CONFIG.TREE_RADIUS * 1.05; 
      const angle = t * Math.PI * 2 * turns;
      controlPoints.push(new THREE.Vector3(Math.cos(angle) * r, h, Math.sin(angle) * r));
    }
    const curve = new THREE.CatmullRomCurve3(controlPoints);
    const curvePoints = curve.getSpacedPoints(pearlCount - 1);

    for (let i = 0; i < pearlCount; i++) {
        // Target: On the spiral ribbon
        targetPos.push(curvePoints[i]);

        // Random: Scattered in universe but constrained to screen
        // Radius 8 to 16 (matches the particle oval somewhat)
        const r = 8 + Math.random() * 8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = (r * 0.6) * Math.sin(phi) * Math.sin(theta); // Flatten Y slightly
        const z = r * Math.cos(phi);
        
        randomPos.push(new THREE.Vector3(x, y, z));
    }
    return { targetPos, randomPos };
  }, []);

  const tempObj = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!meshRef.current) return;
    
    const t = unleashFactor;
    // Cubic easing
    const smoothT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // Animate positions based on unleashFactor
    for (let i = 0; i < pearlCount; i++) {
        const target = data.targetPos[i];
        const random = data.randomPos[i];
        
        const currentPos = new THREE.Vector3().lerpVectors(target, random, smoothT);
        
        // Add spin around Y
        if (t > 0 && t < 1) {
            const spin = (1 - t) * Math.PI * 2;
            currentPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), spin);
        }

        tempObj.position.copy(currentPos);
        
        // Slight scale variation
        const scale = 0.8 + (i % 3) * 0.1;
        tempObj.scale.setScalar(scale);
        
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObj.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, pearlCount]}>
        {/* Very small radius for elegant thread look */}
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshPhysicalMaterial 
          color="#E0E0E0" // Silver/White
          emissive="#FFFFFF" 
          emissiveIntensity={0.2} // Reduced light grade (Less dominant)
          roughness={0.2} 
          metalness={1.0}
          transparent
          opacity={0.9}
        />
    </instancedMesh>
  );
};