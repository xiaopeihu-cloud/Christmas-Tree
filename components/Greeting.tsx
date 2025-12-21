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
        <h1 className="text-4xl md:text-6xl font-serif text-white text-center tracking-[0.2em] leading-relaxed">
        Merry Christmas <br /> 
        
        AND <br /> 
        
        Happy New Year!
</h1>
      </div>
    </Html>
  );
};
