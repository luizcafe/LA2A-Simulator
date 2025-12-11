import React, { useState, useEffect, useRef } from 'react';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  label: string;
  onChange: (value: number) => void;
  color?: string;
  size?: number;
}

export const Knob: React.FC<KnobProps> = ({ 
  value, 
  min, 
  max, 
  label, 
  onChange, 
  color = "#222",
  size = 120
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);
  const knobRef = useRef<HTMLDivElement>(null);

  // Calculate rotation (-135deg to +135deg)
  const percentage = (value - min) / (max - min);
  const rotation = -135 + (percentage * 270);

  const handleStart = (clientY: number) => {
    setIsDragging(true);
    startY.current = clientY;
    startValue.current = value;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default scrolling when starting interaction with the knob
    if (e.cancelable) e.preventDefault(); 
    handleStart(e.touches[0].clientY);
  };

  useEffect(() => {
    const handleMove = (clientY: number) => {
      const deltaY = startY.current - clientY; // Up is positive, Down is negative
      const sensitivity = 0.5; // pixels per unit
      let newValue = startValue.current + (deltaY * sensitivity);
      newValue = Math.max(min, Math.min(max, newValue));
      onChange(newValue);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      handleMove(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      // Prevent scrolling while dragging
      if (e.cancelable) e.preventDefault();
      handleMove(e.touches[0].clientY);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleEnd);
      // Use { passive: false } to allow preventDefault to block scrolling
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
      window.addEventListener('touchcancel', handleEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleEnd);
      window.removeEventListener('touchcancel', handleEnd);
    };
  }, [isDragging, min, max, onChange]);

  return (
    <div className="flex flex-col items-center select-none" style={{ width: size }}>
      <div 
        ref={knobRef}
        className="relative cursor-ns-resize touch-none"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Background ticks */}
        <svg width="100%" height="100%" viewBox="0 0 100 100">
           {Array.from({ length: 11 }).map((_, i) => {
             const angle = -135 + (i * 27);
             const rad = (angle * Math.PI) / 180;
             const x1 = 50 + 40 * Math.cos(rad);
             const y1 = 50 + 40 * Math.sin(rad);
             const x2 = 50 + 48 * Math.cos(rad);
             const y2 = 50 + 48 * Math.sin(rad);
             return (
               <line 
                key={i} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="#666" 
                strokeWidth="2" 
              />
             );
           })}
        </svg>

        {/* The Knob Body */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-2xl border-b-4 border-r-4 border-black/30"
          style={{
            width: size * 0.75,
            height: size * 0.75,
            backgroundColor: color,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.2), 5px 5px 10px rgba(0,0,0,0.5)'
          }}
        >
          {/* Indicator Line */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1/3 bg-white rounded-sm shadow-md" />
        </div>
      </div>
      <span className="mt-2 font-bold text-gray-300 uppercase tracking-wider text-sm">{label}</span>
      <span className="text-xs text-gray-500 font-mono">{Math.round(value)}</span>
    </div>
  );
};