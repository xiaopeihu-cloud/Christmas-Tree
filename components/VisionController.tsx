import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';
import { GestureState } from '../types';

interface VisionControllerProps {
  onUpdate: (state: GestureState) => void;
  simulationMode: boolean;
}

export const VisionController: React.FC<VisionControllerProps> = ({ onUpdate, simulationMode }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

  // Initialize MediaPipe
  useEffect(() => {
    if (simulationMode) return;

    // Suppress specific TFLite info logs that appear as "errors" to users
    const originalConsoleInfo = console.info;
    console.info = (...args: any[]) => {
      if (typeof args[0] === 'string' && args[0].includes('Created TensorFlow Lite XNNPACK delegate for CPU')) {
        return;
      }
      originalConsoleInfo.apply(console, args);
    };

    let isMounted = true;

    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
        );
        
        if (!isMounted) return;

        const recognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (isMounted) {
          gestureRecognizerRef.current = recognizer;
          setLoaded(true);
        }
      } catch (e) {
        console.error("Failed to load MediaPipe:", e);
      }
    };

    init();

    return () => {
      isMounted = false;
      console.info = originalConsoleInfo; // Restore original console
    };
  }, [simulationMode]);

  // Start Camera
  useEffect(() => {
    if (simulationMode || !loaded || !videoRef.current) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure play is called
          await videoRef.current.play().catch(e => console.error("Video play failed", e));
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    startCamera();

    return () => {
      // Cleanup stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
         const s = videoRef.current.srcObject as MediaStream;
         s.getTracks().forEach(track => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [loaded, simulationMode]);

  const predictWebcam = () => {
    if (simulationMode) return;
    const video = videoRef.current;
    const recognizer = gestureRecognizerRef.current;

    if (!video || !recognizer) {
        // Keep checking until ready
        requestRef.current = requestAnimationFrame(predictWebcam);
        return;
    }

    if (video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      
      try {
        const results = recognizer.recognizeForVideo(video, Date.now());

        let newState: GestureState = {
          isHandDetected: false,
          gesture: 'None',
          handPosition: { x: 0, y: 0 }
        };

        if (results.gestures.length > 0) {
          const category = results.gestures[0][0];
          const landmarks = results.landmarks[0];
          
          // Calculate centroid of hand
          let centerX = 0;
          let centerY = 0;
          landmarks.forEach(lm => {
              centerX += lm.x;
              centerY += lm.y;
          });
          centerX /= landmarks.length;
          centerY /= landmarks.length;

          // Map 0..1 to -1..1 (inverted X for mirror effect)
          const x = (1 - centerX) * 2 - 1; 
          const y = -(centerY * 2 - 1);

          newState = {
            isHandDetected: true,
            gesture: category.categoryName as any,
            handPosition: { x, y }
          };
        }

        onUpdate(newState);
      } catch (err) {
        console.warn("Recognition error:", err);
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  if (simulationMode) return null;

  // Hidden video element for processing only
  return (
    <div className="fixed top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted
        onLoadedData={predictWebcam}
        className="w-full h-full object-cover"
      />
    </div>
  );
};