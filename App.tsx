import React, { useState, useCallback, useEffect, useRef } from 'react';
import { VisionController } from './components/VisionController';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { GestureState } from './types';
import { PHOTO_URLS } from './constants';

function App() {
  const [gestureState, setGestureState] = useState<GestureState>({
    isHandDetected: false,
    gesture: 'None',
    handPosition: { x: 0, y: 0 }
  });

  const [simulationMode, setSimulationMode] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);
  const [shuffledQueue, setShuffledQueue] = useState<number[]>([]);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDisplayingRef = useRef(false); 
  const gestureLockRef = useRef(false); 

  const getShuffledIndices = () => {
    const arr = Array.from({ length: PHOTO_URLS.length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const triggerNextPhoto = useCallback(() => {
    if (isDisplayingRef.current) return;
    
    isDisplayingRef.current = true;

    setShuffledQueue(prev => {
      let currentQueue = [...prev];
      if (currentQueue.length === 0) {
        currentQueue = getShuffledIndices();
      }
      
      const nextId = currentQueue.pop();
      setActivePhotoId(nextId ?? 0);

      // --- THE 5-SECOND LOCK ---
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActivePhotoId(null);
        isDisplayingRef.current = false;
        // The photo only returns to the tree after this timer finishes
      }, 5000);

      return currentQueue;
    });
  }, []);

  const handleVisionUpdate = useCallback((newState: GestureState) => {
    // 1. Always update the state so the photo continues to follow hand coordinates
    setGestureState(newState);

    // 2. TRIGGER LOGIC
    if (newState.gesture === 'Pointing_Up') {
      if (!isDisplayingRef.current && !gestureLockRef.current) {
        triggerNextPhoto();
        gestureLockRef.current = true; 
      }
    } else {
      // If the user stops pointing, we ONLY reset the lock.
      // We DO NOT set activePhotoId to null here.
      gestureLockRef.current = false;
    }

    // 3. OPTIONAL: MANUAL OVERRIDE
    // If you want a specific gesture to force-close it (like a fist), keep this.
    // Otherwise, it will strictly stay for 5 seconds.
    if (newState.gesture === 'Closed_Fist' && isDisplayingRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setActivePhotoId(null);
      isDisplayingRef.current = false;
    }
  }, [triggerNextPhoto]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleManualGesture = (gesture: string) => {
    if (gesture === 'Pointing_Up') {
       gestureLockRef.current = false;
       triggerNextPhoto();
    } else {
       setGestureState(prev => ({ ...prev, isHandDetected: true, gesture: gesture as any }));
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <div className="absolute inset-0 z-0">
        <Experience 
          gestureState={gestureState} 
          simulationMode={simulationMode}
          activePhotoId={activePhotoId}
          setActivePhotoId={setActivePhotoId}
          // Ensure the 3D component doesn't internally reset based on gesture
          onPhotoClose={() => {
            // Only allows manual closure if necessary
          }}
        />
      </div>

      <VisionController onUpdate={handleVisionUpdate} simulationMode={simulationMode} />
      <UIOverlay simulationMode={simulationMode} setSimulationMode={setSimulationMode} gestureState={gestureState} setManualGesture={handleManualGesture} />
    </div>
  );
}

export default App;
