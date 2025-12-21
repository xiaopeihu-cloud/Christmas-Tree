import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TreeParticles } from './TreeParticles';
import { Ornaments } from './Ornaments';
import { TopStar } from './TopStar';
import { PhotoGallery } from './PhotoGallery';
import { Ribbon } from './Ribbon';
import { Snow } from './Snow';
import { Greeting } from './Greeting';
import { CONFIG } from '../constants';
import { GestureState } from '../types';

interface ExperienceProps {
  gestureState: GestureState;
  simulationMode: boolean;
  onPhotoClose: () => void;
  activePhotoId: number | null;
  setActivePhotoId: (id: number | null) => void;
}

// Adjusts camera distance based on viewport aspect ratio to ensure tree fits on mobile/tablets
const ResponsiveCamera = ({ gestureState, activePhotoId }: { gestureState: GestureState, activePhotoId: number | null }) => {
  const { camera, size } = useThree();
  const initialZRef = useRef(14); // Reduced from 20 to 14 to fill screen

  useEffect(() => {
    const aspect = size.width / size.height;
    const baseDistance = 14;
    let targetZ = baseDistance;
    
    if (aspect < 1) {
      // PORTRAIT (iPhone)
      // The 7 / aspect formula ensures the camera stays far enough back 
      // even on very tall, thin screens.
      targetZ = baseDistance + (7 / aspect); 
    } else if (aspect < 1.6) {
      // SQUARE-ISH (iPad / Small Windows)
      targetZ = 18;
    } else {
      // WIDE BROWSER (Desktop)
      // As the browser gets wider, 'aspect' increases. 
      // This math moves the camera back slightly as the height of the window shrinks.
      targetZ = baseDistance + (aspect * 1.5); 
    }

    initialZRef.current = targetZ;
    
    // Use lerp for a smooth transition if you resize the window
    camera.position.z = targetZ;
    camera.updateProjectionMatrix();
  }, [size.width, size.height, camera]); // Watch width and height specifically
  useFrame((state, delta) => {
    // Camera Control via Hand (Only if NO photo active)
    if (gestureState.isHandDetected && activePhotoId === null) {
       // Map x (-1 to 1) to rotation offset
       const targetX = gestureState.handPosition.x * 0.5;
       const targetY = 4 + (gestureState.handPosition.y * 2);
       
       camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX * 10, delta);
       camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, delta);
       
       // Gently return to calculated Z
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, initialZRef.current, delta);
       
       camera.lookAt(0, 0, 0);
    } else if (activePhotoId === null) {
      // Idle return
       camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, delta);
       camera.position.y = THREE.MathUtils.lerp(camera.position.y, 4, delta);
       camera.position.z = THREE.MathUtils.lerp(camera.position.z, initialZRef.current, delta);
       camera.lookAt(0, 0, 0);
    }
  });

  return null;
}

const SceneContent = ({ gestureState, activePhotoId, setActivePhotoId, onPhotoClose }: any) => {
  // We use a ref for targetUnleash to maintain state across frames without causing re-renders itself, 
  // but we update it based on gestures.
  const targetUnleashRef = useRef(0);
  
  // State for the actual animated value to drive the UI/Visuals
  const [unleashFactor, setUnleashFactor] = useState(0);

  // Update target based on gesture (Latching logic)
  useEffect(() => {
    if (gestureState.gesture === 'Open_Palm') {
      targetUnleashRef.current = 1;
    } else if (gestureState.gesture === 'Closed_Fist') {
      targetUnleashRef.current = 0;
    }
  }, [gestureState.gesture]);

  // Logic Loop
  useFrame((state, delta) => {
    const target = targetUnleashRef.current;
    
    // Smooth transition logic
    if (Math.abs(target - unleashFactor) > 0.001) {
        const speed = target > unleashFactor ? CONFIG.UNLEASH_SPEED : CONFIG.RETURN_SPEED;
        const diff = target - unleashFactor;
        const newVal = THREE.MathUtils.clamp(unleashFactor + diff * delta * speed, 0, 1);
        setUnleashFactor(newVal);
    }
  });

  // Photo Trigger Logic
  useEffect(() => {
    if (gestureState.gesture === 'Pointing_Up' && activePhotoId === null) {
      const randomId = Math.floor(Math.random() * CONFIG.PHOTO_COUNT);
      setActivePhotoId(randomId);
      
      // Auto close after 5s
      setTimeout(() => {
        onPhotoClose();
      }, 5000);
    }
  }, [gestureState.gesture, activePhotoId, setActivePhotoId, onPhotoClose]);

  return (
    <>
      <color attach="background" args={['#050510']} />
      
      <ResponsiveCamera gestureState={gestureState} activePhotoId={activePhotoId} />

      <TreeParticles unleashFactor={unleashFactor} />
      <Ornaments unleashFactor={unleashFactor} />
      <Ribbon unleashFactor={unleashFactor} />
      <Snow />
      <TopStar unleashFactor={unleashFactor} />
      <Greeting unleashFactor={unleashFactor} />
      <PhotoGallery 
        unleashFactor={unleashFactor} 
        activePhotoId={activePhotoId}
        handPosition={gestureState.handPosition} 
      />

      <Environment preset="lobby" background={false} />
      <ambientLight intensity={0.2} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <EffectComposer enableNormalPass={false}>
        <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.5} 
            radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.5} />
      </EffectComposer>
    </>
  );
};

export const Experience: React.FC<ExperienceProps> = (props) => {
  return (
    <Canvas
  camera={{ 
    // If width < height (mobile), move camera back to 18 and widen FOV to 50
    // If width > height (desktop), stay at your original 14 with FOV 45
    position: [0, 4, window.innerWidth < window.innerHeight ? 18 : 14], 
    fov: window.innerWidth < window.innerHeight ? 50 : 45 
  }}
  gl={{ 
    antialias: false, 
    toneMapping: THREE.ReinhardToneMapping, 
    toneMappingExposure: 1.5 
  }}
  dpr={[1, 2]}
>
  <SceneContent {...props} />
  {!props.gestureState.isHandDetected && (
    <OrbitControls 
      enablePan={false} 
      maxPolarAngle={Math.PI / 1.5} 
      // Prevents the user from zooming in too close on mobile
      minDistance={window.innerWidth < window.innerHeight ? 10 : 5}
    />
  )}
</Canvas>
  );
};
