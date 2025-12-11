import React from 'react';

interface VUMeterProps {
  value: number; // dB value, typically -60 to +3
  mode: 'GR' | 'OUTPUT';
}

export const VUMeter: React.FC<VUMeterProps> = ({ value, mode }) => {
  // Map dB to rotation angle
  // VU Meter Scale usually: -20 to +3 dB
  // Let's approximate: -20dB = -45deg, 0dB = 0deg, +3dB = +15deg
  
  // For GR mode (Reverse scale): 0dB = 0deg (Right), -10dB = -45deg (Left)
  
  let angle = -45; // resting position (left)
  
  if (mode === 'OUTPUT') {
    // Normal VU
    // Range -20 to +3
    const clamped = Math.max(-20, Math.min(3, value));
    // Normalize -20...3 to 0...1
    const norm = (clamped + 20) / 23; 
    // Map 0...1 to -45...45 deg
    angle = -45 + (norm * 90);
  } else {
    // GR Mode
    // Value is usually negative (e.g., -5 dB reduction)
    // 0 dB reduction = 45deg (Far right, resting)
    // -20 dB reduction = -45deg (Far left)
    const clamped = Math.max(-20, Math.min(0, value));
    // Normalize -20...0 to 0...1
    const norm = (clamped + 20) / 20;
    // Map 0...1 to -45...45
    angle = -45 + (norm * 90);
  }

  return (
    <div className="relative w-48 h-32 bg-[#EADDcf] rounded-t-lg overflow-hidden border-4 border-gray-600 shadow-inner">
      {/* Scale Markings */}
      <div className="absolute top-2 left-0 w-full h-full">
        <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Arcs */}
            <path d="M 20 100 A 90 90 0 0 1 180 100" fill="none" stroke="#333" strokeWidth="2" />
            
            {/* Ticks logic simplified for visual */}
            <line x1="100" y1="20" x2="100" y2="30" stroke="#333" strokeWidth="2" /> {/* 0 / 100 */}
            
            <text x="95" y="45" fontSize="10" fontWeight="bold" fill="#000">{mode === 'OUTPUT' ? '0' : '0'}</text>
            <text x="30" y="80" fontSize="8" fill="#000">{mode === 'OUTPUT' ? '-20' : '-20'}</text>
            <text x="160" y="80" fontSize="8" fill="#d00">{mode === 'OUTPUT' ? '+3' : ''}</text>
            
            <text x="100" y="90" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#555" className="font-serif">VU</text>
        </svg>
      </div>

      {/* Needle */}
      <div 
        className="absolute bottom-[-10px] left-1/2 w-1 h-32 bg-red-600 origin-bottom shadow-sm transition-transform duration-75 ease-out"
        style={{ transform: `translateX(-50%) rotate(${angle}deg)` }}
      />
      
      {/* Needle Pivot */}
      <div className="absolute bottom-[-5px] left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 border border-gray-600" />
      
      {/* Glass Reflection overlay */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
    </div>
  );
};