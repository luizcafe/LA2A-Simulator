import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  peakReduction: number; // 0-100
  threshold: number; // -60 to 0
  isPowered: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({ peakReduction, threshold, isPowered }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      timeRef.current += 0.05;
      
      // Clear
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Dynamic Threshold Line Calculation
      const normT = (threshold + 60) / 60; // 0 to 1
      const dist = 0.05 + (normT * 0.40); // 5% to 45% distance from center
      
      const thresholdY_Top = canvas.height * (0.5 - dist);
      const thresholdY_Bottom = canvas.height * (0.5 + dist);
      
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = '#ef4444'; // Red for threshold
      ctx.lineWidth = 1; // Thinner threshold lines
      
      ctx.beginPath();
      ctx.moveTo(0, thresholdY_Top);
      ctx.lineTo(canvas.width, thresholdY_Top);
      ctx.moveTo(0, thresholdY_Bottom);
      ctx.lineTo(canvas.width, thresholdY_Bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label Threshold
      ctx.fillStyle = '#ef4444';
      ctx.font = '10px sans-serif';
      ctx.fillText(`THRESHOLD (${Math.round(threshold)}dB)`, 5, thresholdY_Top - 5);


      if (isPowered) {
        // Draw Signal
        const baseAmp = 30;
        const prGain = peakReduction * 1.5; 
        const amplitude = baseAmp + prGain;

        // Calculate points
        const points: {x: number, y: number}[] = [];
        for (let x = 0; x < canvas.width; x++) {
          const yNorm = Math.sin((x * 0.05) + timeRef.current);
          const y = (canvas.height / 2) + (yNorm * amplitude);
          points.push({x, y});
        }

        // 1. Draw Compression Fills (Area beyond threshold)
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // Subtle Red fill
        
        // Top Fill
        ctx.beginPath();
        ctx.moveTo(0, thresholdY_Top);
        for (let i = 0; i < points.length; i++) {
             const p = points[i];
             // If point is above top line (y is smaller)
             if (p.y < thresholdY_Top) {
                 ctx.lineTo(p.x, p.y);
             } else {
                 ctx.lineTo(p.x, thresholdY_Top);
             }
        }
        ctx.lineTo(canvas.width, thresholdY_Top);
        ctx.fill();

        // Bottom Fill
        ctx.beginPath();
        ctx.moveTo(0, thresholdY_Bottom);
        for (let i = 0; i < points.length; i++) {
             const p = points[i];
             // If point is below bottom line (y is larger)
             if (p.y > thresholdY_Bottom) {
                 ctx.lineTo(p.x, p.y);
             } else {
                 ctx.lineTo(p.x, thresholdY_Bottom);
             }
        }
        ctx.lineTo(canvas.width, thresholdY_Bottom);
        ctx.fill();

        // 2. Draw Normal Signal (Green)
        ctx.strokeStyle = '#4ade80'; // Green signal
        ctx.lineWidth = 2;
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();

        // 3. Draw Compressed Signal Highlights (Orange/Red Overlay)
        // We clip the canvas to the area outside the thresholds and draw the line again with a different color
        ctx.save();
        ctx.beginPath();
        // Rect for top area
        ctx.rect(0, 0, canvas.width, thresholdY_Top);
        // Rect for bottom area
        ctx.rect(0, thresholdY_Bottom, canvas.width, canvas.height - thresholdY_Bottom);
        ctx.clip(); // Clip to these rects

        ctx.strokeStyle = '#f59e0b'; // Amber color for compression
        ctx.lineWidth = 3; // Slightly thicker
        ctx.beginPath();
        points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [peakReduction, threshold, isPowered]);

  return (
    <div className="w-full h-48 bg-black rounded border border-gray-700 relative overflow-hidden">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={200} 
        className="w-full h-full"
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-500 pointer-events-none">
        <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>Linear
        <span className="inline-block w-2 h-2 bg-amber-500 rounded-full ml-3 mr-1"></span>Compressed
      </div>
    </div>
  );
};