import React, { useMemo, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CONFIG, COLORS, MORANDI_PALETTE } from '../constants';

// Helper to generate positions
const getTreePosition = (ratio: number, radiusBase: number, heightBase: number) => {
  const y = (ratio * heightBase) - (heightBase / 2);
  const r = (1 - ratio) * radiusBase;
  const theta = Math.random() * Math.PI * 2;
  const x = r * Math.cos(theta);
  const z = r * Math.sin(theta);
  return new THREE.Vector3(x, y, z);
};

// Generate simulation data for N particles
const generateData = (count: number) => {
  const targetPos = [];
  const randomPos = [];
  const rotations = [];
  const scales = [];
  const colors = [];

  for (let i = 0; i < count; i++) {
    // Tree position
    const ratio = Math.random();
    const pos = getTreePosition(ratio, CONFIG.TREE_RADIUS + 0.2, CONFIG.TREE_HEIGHT);
    targetPos.push(pos);

    // Random position (Universe scatter) - Constrained to screen
    const r = 10 + Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Flattened slightly
    const rPos = new THREE.Vector3(
      r * Math.sin(phi) * Math.cos(theta),
      (r * 0.7) * Math.sin(phi) * Math.sin(theta), 
      r * Math.cos(phi)
    );
    randomPos.push(rPos);

    rotations.push(new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0));
    scales.push(Math.random() * 0.25 + 0.15); // Slightly larger
    
    // Pick a Morandi color
    colors.push(new THREE.Color(MORANDI_PALETTE[Math.floor(Math.random() * MORANDI_PALETTE.length)]));
  }
  return { targetPos, randomPos, rotations, scales, colors };
};

export const Ornaments: React.FC<{ unleashFactor: number }> = ({ unleashFactor }) => {
  const ballRef = useRef<THREE.InstancedMesh>(null);
  const boxRef = useRef<THREE.InstancedMesh>(null);
  const diamondRef = useRef<THREE.InstancedMesh>(null);

  const ballCount = 60;
  const boxCount = 50;
  const diamondCount = 40;

  const balls = useMemo(() => generateData(ballCount), []);
  const boxes = useMemo(() => generateData(boxCount), []);
  const diamonds = useMemo(() => generateData(diamondCount), []); // Diamonds will override color to silver

  const tempObj = useMemo(() => new THREE.Object3D(), []);

  // Apply Colors Once
  useLayoutEffect(() => {
    if (ballRef.current) {
      balls.colors.forEach((col, i) => ballRef.current!.setColorAt(i, col));
      ballRef.current.instanceColor!.needsUpdate = true;
    }
    if (boxRef.current) {
      boxes.colors.forEach((col, i) => boxRef.current!.setColorAt(i, col));
      boxRef.current.instanceColor!.needsUpdate = true;
    }
    if (diamondRef.current) {
      // Diamonds are white/silver
      const silver = new THREE.Color('#FFFFFF');
      for (let i = 0; i < diamondCount; i++) {
        diamondRef.current.setColorAt(i, silver);
      }
      diamondRef.current.instanceColor!.needsUpdate = true;
    }
  }, [balls, boxes, diamonds]);

  useFrame((state) => {
    const t = unleashFactor; 
    const smoothT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateMesh = (ref: THREE.InstancedMesh | null, data: any, count: number, spinMult: number) => {
      if (!ref) return;
      for (let i = 0; i < count; i++) {
        const target = data.targetPos[i];
        const random = data.randomPos[i];

        const currentPos = new THREE.Vector3().lerpVectors(target, random, smoothT);
        
        if (t > 0 && t < 1) {
            const spin = (1 - t) * Math.PI * 2;
            currentPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), spin * spinMult);
        }

        tempObj.position.copy(currentPos);
        
        tempObj.rotation.copy(data.rotations[i]);
        tempObj.rotation.x += state.clock.getElapsedTime() * 0.2 * spinMult;
        tempObj.rotation.y += state.clock.getElapsedTime() * 0.3;

        const s = data.scales[i];
        tempObj.scale.setScalar(s);
        tempObj.updateMatrix();
        ref.setMatrixAt(i, tempObj.matrix);
      }
      ref.instanceMatrix.needsUpdate = true;
    };

    animateMesh(ballRef.current, balls, ballCount, 1);
    animateMesh(boxRef.current, boxes, boxCount, -1);
    animateMesh(diamondRef.current, diamonds, diamondCount, 1.5);
  });

  return (
    <group>
      {/* 1. Balls (Morandi) */}
      <instancedMesh ref={ballRef} args={[undefined, undefined, ballCount]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshPhysicalMaterial 
          roughness={0.2} 
          metalness={0.5} 
          clearcoat={1}
        />
      </instancedMesh>

      {/* 2. Gift Boxes (Morandi) */}
      <instancedMesh ref={boxRef} args={[undefined, undefined, boxCount]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial 
          roughness={0.3} 
          metalness={0.1}
        />
      </instancedMesh>

      {/* 3. Diamonds (Silver/Clear) */}
      <instancedMesh ref={diamondRef} args={[undefined, undefined, diamondCount]}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshPhysicalMaterial 
          color="#FFFFFF"
          roughness={0} 
          metalness={1.0} 
          transmission={0.2}
          reflectivity={1}
          clearcoat={1}
          emissive="#222222"
        />
      </instancedMesh>
    </group>
  );
};