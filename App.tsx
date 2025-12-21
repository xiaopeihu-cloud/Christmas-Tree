import React, { useState, useCallback } from 'react';
import { VisionController } from './components/VisionController';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { GestureState } from './types';

function App() {
  const [gestureState, setGestureState] = useState<GestureState>({
    isHandDetected: false,
    gesture: 'None',
    handPosition: { x: 0, y: 0 }
  });

  const [simulationMode, setSimulationMode] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<number | null>(null);

  // Handler for Vision updates
  const handleVisionUpdate = useCallback((newState: GestureState) => {
    setGestureState(newState);
  }, []);

  // Handler for Manual Simulation updates
  const handleManualGesture = (gesture: string) => {
    if (gesture === 'Pointing_Up') {
       // Trigger once
       setGestureState(prev => ({ ...prev, isHandDetected: true, gesture: 'Pointing_Up' }));
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

      {/* Camera Logic (Hidden functionality, visible preview) */}
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
