import React from 'react';
import { Html } from '@react-three/drei';

export const Greeting = ({ unleashFactor }: { unleashFactor: number }) => {
  // Opacity logic: Start showing at 0.5, fully visible at 0.8
  const opacity = Math.max(0, (unleashFactor - 0.5) / 0.3);

  return (
    <Html center pointerEvents="none" zIndexRange={[100, 0]}>
      <div 
        className="pointer-events-none select-none flex items-center justify-center w-[90vw]"
        style={{ opacity, transition: 'opacity 0.2s linear' }}
      >
        <h1 className="font-serif italic text-6xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-400 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] text-center tracking-tighter filter brightness-110" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
          Merry Christmas and Happy New Year!
        </h1>
      </div>
    </Html>
  );
};
