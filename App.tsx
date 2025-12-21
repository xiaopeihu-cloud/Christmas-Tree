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
  
  // REFS for immediate logic execution (avoids delay)
  const isCurrentlyShowingRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Shuffle indices
  const getShuffledIndices = () => {
    const arr = Array.from({ length: PHOTO_URLS.length }, (_, i) => i);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Logic to show a photo and start the 5-second countdown
  const triggerNextPhoto = useCallback(() => {
    if (isCurrentlyShowingRef.current) return;

    setShuffledQueue(prev => {
      let currentQueue = [...prev];
      if (currentQueue.length === 0) {
        currentQueue = getShuffledIndices();
      }
      
      const nextId = currentQueue.pop();
      setActivePhotoId(nextId ?? 0);
      isCurrentlyShowingRef.current = true;

      // Start 5-second timer to auto-hide
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActivePhotoId(null);
        isCurrentlyShowingRef.current = false;
      }, 5000);

      return currentQueue;
    });
  }, []);

  // Update Gesture State and trigger logic
  const handleVisionUpdate = useCallback((newState: GestureState) => {
    setGestureState(newState);

    // TRIGGER: If finger points and nothing is showing, show it NOW.
    if (newState.gesture === 'Pointing_Up' && !isCurrentlyShowingRef.current) {
      triggerNextPhoto();
    }
    
    // RESET TRIGGER LOCK: If hand is removed or fist made, allow next point immediately
    if (newState.gesture === 'None' || newState.gesture === 'Closed_Fist') {
       if (!activePhotoId) {
          isCurrentlyShowingRef.current = false;
       }
    }
  }, [triggerNextPhoto, activePhotoId]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const handleManualGesture = (gesture: string) => {
    if (gesture === 'Pointing_Up') {
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
            isCurrentlyShowingRef.current = false;
          }}
        />
      </div>

      <VisionController 
        onUpdate={handleVisionUpdate} 
        simulationMode={simulationMode} 
      />

      <UIOverlay 
        simulationMode={simulationMode} 
        setSimulationMode={setSimulationMode}
        gestureState={gestureState}
        setManualGesture={handleManualGesture}
      />
    </div>
  );
}

export default App;
