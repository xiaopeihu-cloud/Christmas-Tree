import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Image } from '@react-three/drei';
import * as THREE from 'three';
import { PHOTO_URLS, CONFIG, FRAME_PALETTE } from '../constants';

interface PhotoGalleryProps {
  unleashFactor: number;
  activePhotoId: number | null;
  handPosition: { x: number; y: number };
}

interface PhotoItemProps {
  url: string;
  index: number;
  unleashFactor: number;
  isActive: boolean;
  isAnyActive: boolean;
  handPosition: { x: number; y: number };
}

const PhotoItem: React.FC<PhotoItemProps> = ({ 
  url, 
  index, 
  unleashFactor, 
  isActive, 
  isAnyActive, 
  handPosition 
}) => {
  const ref = useRef<THREE.Group>(null);
  
  // Default aspect ratio (will update once image loads)
  const [aspect, setAspect] = useState(0.75);

  const frameColor = useMemo(() => {
    return FRAME_PALETTE[index % FRAME_PALETTE.length];
  }, [index]);

  const { targetPos, randomPos, targetRot } = useMemo(() => {
    const ratio = (index + 1) / (CONFIG.PHOTO_COUNT + 1);
    const h = ratio * CONFIG.TREE_HEIGHT - (CONFIG.TREE_HEIGHT / 2);
    const r = (1 - ratio) * (CONFIG.TREE_RADIUS + 0.5);
    const theta = (index / CONFIG.PHOTO_COUNT) * Math.PI * 4;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    
    const pos = new THREE.Vector3(x, h, z);
    const rot = new THREE.Euler(0, -theta, 0);

    const chaosR = 30 + Math.random() * 20;
    const chaosTheta = Math.random() * Math.PI * 2;
    const chaosPhi = Math.acos(2 * Math.random() - 1);
    
    const rand = new THREE.Vector3(
      chaosR * Math.sin(chaosPhi) * Math.cos(chaosTheta),
      chaosR * Math.sin(chaosPhi) * Math.sin(chaosTheta),
      chaosR * Math.cos(chaosPhi)
    );

    return { targetPos: pos, randomPos: rand, targetRot: rot };
  }, [index]);

  useFrame((state, delta) => {
    if (!ref.current) return;

    if (isActive) {
      const cameraPos = state.camera.position;
      const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
      const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(state.camera.quaternion);
      const cameraUp = new THREE.Vector3(0, 1, 0).applyQuaternion(state.camera.quaternion);
      
      const dist = 5; 
      const basePos = cameraPos.clone().add(cameraForward.multiplyScalar(dist));
      
      const xOffset = handPosition.x * 2.5; 
      const yOffset = handPosition.y * 2.5;
      
      basePos.add(cameraRight.multiplyScalar(xOffset));
      basePos.add(cameraUp.multiplyScalar(yOffset));
      
      ref.current.position.lerp(basePos, delta * 3);
      ref.current.quaternion.slerp(state.camera.quaternion, delta * 3);
      
      // Dynamic Scaling based on detected aspect ratio
      const camera = state.camera as THREE.PerspectiveCamera;
      const vH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * dist;
      const vW = vH * camera.aspect;
      
      let targetH = vH * 0.85;
      let targetW = targetH * aspect;
      
      // Ensure it doesn't overflow horizontally
      if (targetW > vW * 0.85) {
        targetW = vW * 0.85;
        targetH = targetW / aspect;
      }
      
      ref.current.scale.lerp(new THREE.Vector3(targetW, targetH, 1), delta * 3);

    } else {
      const currentTarget = new THREE.Vector3().lerpVectors(targetPos, randomPos, unleashFactor);
      ref.current.position.lerp(currentTarget, delta * 2);

      if (unleashFactor > 0.5) {
        ref.current.rotation.x += delta * 0.2;
        ref.current.rotation.y += delta * 0.3;
      } else {
        const targetQ = new THREE.Quaternion().setFromEuler(targetRot);
        ref.current.quaternion.slerp(targetQ, delta * 2);
      }

      const targetScale = isAnyActive ? 0 : 1;
      // Maintain aspect ratio while idle on the tree
      ref.current.scale.lerp(new THREE.Vector3(0.7 * aspect * targetScale, 0.7 * targetScale, 1), delta * 4);
    }
  });

  return (
    <group ref={ref}>
      {/* 1. THE FRAME - Scales with the image aspect */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[1.05, 1.05, 0.05]} />
        <meshStandardMaterial color={frameColor} metalness={0.2} roughness={0.8} />
      </mesh>

      {/* 2. THE PHOTO - Detects aspect on load */}
      <Image 
        url={url} 
        transparent 
        opacity={1}
        side={THREE.DoubleSide}
        onLoad={(texture) => {
          if (texture.image) {
            setAspect(texture.image.width / texture.image.height);
          }
        }}
      />
    </group>
  );
};

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ unleashFactor, activePhotoId, handPosition }) => {
  return (
    <>
      {PHOTO_URLS.map((url, i) => (
        <PhotoItem 
          key={`${url}-${i}`} 
          index={i} 
          url={url} 
          unleashFactor={unleashFactor}
          isActive={activePhotoId === i}
          isAnyActive={activePhotoId !== null}
          handPosition={handPosition}
        />
      ))}
    </>
  );
};
