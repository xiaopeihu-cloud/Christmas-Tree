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
  
  // New State: Queue of photo indices that haven't been shown yet in this round
  const [shuffledQueue, setShuffledQueue] = useState<number[]>([]);
  
  // Use a ref to track if a gesture has already triggered a photo 
  // This prevents the "Pointing" gesture from cycling through 10 photos in 1 second
  const hasTriggeredRef = useRef(false);

  // Helper: Shuffle an array (Fisher-Yates)
  const shuffle = (array: number[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  // Logic to get the next unique photo ID
  const getNextPhotoId = useCallback(() => {
    setShuffledQueue(prevQueue => {
      let currentQueue = [...prevQueue];
      
      // If queue is empty, refill and shuffle for a new round
      if (currentQueue.length === 0) {
        const allIndices = Array.from({ length: PHOTO_URLS.length }, (_, i) => i);
        currentQueue = shuffle(allIndices);
      }
      
      const nextId = currentQueue.pop();
      setActivePhotoId(nextId ?? 0);
      
      return currentQueue;
    });
  }, []);

  // Listen for Pointing gesture to trigger the next photo
  useEffect(() => {
    if (gestureState.gesture === 'Pointing_Up') {
      if (!hasTriggeredRef.current) {
        getNextPhotoId();
        hasTriggeredRef.current = true;
      }
    } else if (gestureState.gesture === 'None' || gestureState.gesture === 'Closed_Fist') {
      // Reset trigger lock and close photo
      hasTriggeredRef.current = false;
      setActivePhotoId(null);
    }
  }, [gestureState.gesture, getNextPhotoId]);

  // Handler for Vision updates
  const handleVisionUpdate = useCallback((newState: GestureState) => {
    setGestureState(newState);
  }, []);

  // Handler for Manual Simulation updates
  const handleManualGesture = (gesture: string) => {
    if (gesture === 'Pointing_Up') {
       // Reset trigger lock so manual point works every time
       hasTriggeredRef.current = false; 
       setGestureState(prev => ({ ...prev, isHandDetected: true, gesture: 'Pointing_Up' }));
       // Auto-reset gesture after 500ms
       setTimeout(() => {
          setGestureState(prev => ({ ...prev, gesture: 'None' }));
       }, 500);
    } else {
       setGestureState(prev => ({ ...prev, isHandDetected: true, gesture: gesture as any }));
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      {/* 3D World */}
      <div className="absolute inset-0 z-0">
        <Experience 
          gestureState={gestureState} 
          simulationMode={simulationMode}
          activePhotoId={activePhotoId}
          setActivePhotoId={setActivePhotoId}
          onPhotoClose={() => setActivePhotoId(null)}
        />
      </div>

      {/* Camera Logic */}
      <VisionController 
        onUpdate={handleVisionUpdate} 
        simulationMode={simulationMode} 
      />

      {/* UI Layer */}
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
