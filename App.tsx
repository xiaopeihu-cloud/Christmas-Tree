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
  
  // REFS FOR INSTANT LOGIC
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isDisplayingRef = useRef(false); // Is a photo currently on screen?
  const gestureLockRef = useRef(false); // Has this specific "pointing session" already triggered a photo?

  // Helper: Shuffle indices
  const getShuffledIndices = () => {
    const arr = Array.from({ length: PHOTO_URLS.length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const triggerNextPhoto = useCallback(() => {
    // 1. Block if a photo is already being displayed
    if (isDisplayingRef.current) return;
    
    // 2. Set display lock immediately (Synchronous)
    isDisplayingRef.current = true;

    setShuffledQueue(prev => {
      let currentQueue = [...prev];
      if (currentQueue.length === 0) {
        currentQueue = getShuffledIndices();
      }
      
      const nextId = currentQueue.pop();
      setActivePhotoId(nextId ?? 0);

      // Start 5-second timer to auto-hide
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActivePhotoId(null);
        isDisplayingRef.current = false;
        // Note: gestureLock remains TRUE until the user stops pointing
      }, 5000);

      return currentQueue;
    });
  }, []);

  const handleVisionUpdate = useCallback((newState: GestureState) => {
    setGestureState(newState);

    if (newState.gesture === 'Pointing_Up') {
      // Only trigger if we aren't displaying AND we haven't already triggered for this specific point
      if (!isDisplayingRef.current && !gestureLockRef.current) {
        triggerNextPhoto();
        gestureLockRef.current = true; // Lock it! User must stop pointing to unlock.
      }
    } else {
      // User lowered their finger or changed gesture -> Unlock for next time
      gestureLockRef.current = false;
      
      // If user makes a fist, close the current photo early
      if (newState.gesture === 'Closed_Fist' && isDisplayingRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        setActivePhotoId(null);
        isDisplayingRef.current = false;
      }
    }
  }, [triggerNextPhoto]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleManualGesture = (gesture: string) => {
    if (gesture === 'Pointing_Up') {
       gestureLockRef.current = false; // Reset lock for manual clicks
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
          onPhotoClose={() => {
            setActivePhotoId(null);
            isDisplayingRef.current = false;
          }}
        />
      </div>

      <VisionController onUpdate={handleVisionUpdate} simulationMode={simulationMode} />
      <UIOverlay simulationMode={simulationMode} setSimulationMode={setSimulationMode} gestureState={gestureState} setManualGesture={handleManualGesture} />
    </div>
  );
}

export default App;
