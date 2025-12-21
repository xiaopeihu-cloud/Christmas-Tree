import React, { useState, useEffect, useRef } from 'react';
import { GestureState } from '../types';

// ----------------------------------------------------------------------
// CONFIGURATION: MUSIC FILE
// ----------------------------------------------------------------------
const AUDIO_SOURCE = "/christmas-tree/music.mp3"; 

interface UIOverlayProps {
  simulationMode: boolean;
  setSimulationMode: (v: boolean) => void;
  gestureState: GestureState;
  setManualGesture: (g: string) => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
  simulationMode, 
  setSimulationMode, 
  gestureState,
  setManualGesture 
}) => {
  const [isMagicHandOpen, setIsMagicHandOpen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Background Music
  useEffect(() => {
    const audio = new Audio(AUDIO_SOURCE);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.warn("Audio autoplay blocked", e));
      }
      setIsMusicPlaying(!isMusicPlaying);
    }
  };

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMagicHandOpen && 
        modalRef.current && 
        !modalRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMagicHandOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMagicHandOpen]);

  const buttonClass = "w-10 h-10 rounded-full border border-white/20 bg-black/20 backdrop-blur-md flex items-center justify-center transition-all duration-500 hover:bg-white/10 hover:border-white/50 hover:scale-105 active:scale-95 group pointer-events-auto";
  const handIconStyle = "text-xl w-8 text-center filter grayscale brightness-200 contrast-125 drop-shadow-[0_0_5px_rgba(255,255,255,0.6)] group-hover:scale-110 transition-transform duration-300";

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      
      {/* Top Bar: Music Control */}
      <div className="w-full flex justify-end items-start mt-2 mr-2">
        <button 
          onClick={toggleMusic}
          className={buttonClass}
          title={isMusicPlaying ? "Stop Music" : "Play Music"}
        >
          <div className={`relative flex items-center justify-center transition-all duration-500 ${isMusicPlaying ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'text-white/50'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163z" />
            </svg>
            {isMusicPlaying && (
              <span className="absolute inset-0 rounded-full animate-ping bg-white/20 opacity-75"></span>
            )}
          </div>
        </button>
      </div>

      {/* Jingle Hand Button */}
      <div className="absolute bottom-6 right-6 pointer-events-auto">
        <button
          ref={buttonRef}
          onClick={() => setIsMagicHandOpen(!isMagicHandOpen)}
          className={buttonClass}
        >
          <span className={`text-lg filter transition-all duration-500 ${isMagicHandOpen ? 'grayscale-0 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'grayscale opacity-70'}`}>
            ✨
          </span>
        </button>
      </div>

      {/* Magic Hand Modal */}
      {isMagicHandOpen && (
        <div 
          ref={modalRef}
          className="absolute bottom-20 right-6 w-72 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl pointer-events-auto origin-bottom-right"
        >
          <h3 className="text-sm text-gray-200 mb-4 border-b border-white/10 pb-2 tracking-widest text-center">GESTURES</h3>
          
          <div className="space-y-4 text-xs text-gray-400">
             <div className="flex items-center gap-4 group">
               <span className={handIconStyle}>✋</span>
               <div>
                 <p className="font-bold text-gray-200 tracking-wide">OPEN PALM</p>
                 <p className="text-[10px] text-gray-500 italic">Release the chaos</p>
               </div>
             </div>
             <div className="flex items-center gap-4 group">
               <span className={handIconStyle}>✊</span>
               <div>
                 <p className="font-bold text-gray-200 tracking-wide">CLOSED FIST</p>
                 <p className="text-[10px] text-gray-500 italic">Restore order</p>
               </div>
             </div>
             <div className="flex items-center gap-4 group">
               <span className={handIconStyle}>☝️</span>
               <div>
                 <p className="font-bold text-gray-200 tracking-wide">POINT UP</p>
                 <p className="text-[10px] text-gray-500 italic">Inspect memory</p>
               </div>
             </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <div className="flex justify-between items-center mb-2">
               <span className="text-[8px] uppercase text-gray-600 font-bold tracking-widest">Controls</span>
               <button 
                 onClick={() => setSimulationMode(!simulationMode)}
                 className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border ${simulationMode ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-gray-800'}`}
               >
                 {simulationMode ? "AUTO" : "MANUAL"}
               </button>
            </div>
            
            {simulationMode && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                <button onClick={() => setManualGesture('Open_Palm')} className="py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-gray-300">Open</button>
                <button onClick={() => setManualGesture('Closed_Fist')} className="py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-gray-300">Close</button>
                <button onClick={() => setManualGesture('Pointing_Up')} className="py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] text-gray-300">Point</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
