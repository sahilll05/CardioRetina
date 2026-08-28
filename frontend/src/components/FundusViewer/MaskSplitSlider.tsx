import React, { useState, useRef } from 'react';

interface MaskSplitSliderProps {
  rawUrl: string;
  vesselMaskUrl: string;
  avOverlayUrl: string;
  className?: string;
}

export const MaskSplitSlider: React.FC<MaskSplitSliderProps> = ({ 
  rawUrl, vesselMaskUrl, avOverlayUrl, className 
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [leftImage, setLeftImage] = useState<string>(rawUrl);
  const [rightImage, setRightImage] = useState<string>(avOverlayUrl);
  
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    // Only update on drag (left click held) or touch
    if (e.type === 'mousemove' && (e as React.MouseEvent).buttons !== 1) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Controls */}
      <div className="flex gap-2 justify-center">
        <select 
          className="bg-input text-foreground text-sm rounded px-2 py-1"
          value={leftImage} 
          onChange={e => setLeftImage(e.target.value)}
        >
          <option value={rawUrl}>Raw Fundus</option>
          <option value={vesselMaskUrl}>Vessel Mask</option>
          <option value={avOverlayUrl}>A/V Overlay</option>
        </select>
        <span className="text-muted-foreground text-sm flex items-center">vs</span>
        <select 
          className="bg-input text-foreground text-sm rounded px-2 py-1"
          value={rightImage} 
          onChange={e => setRightImage(e.target.value)}
        >
          <option value={rawUrl}>Raw Fundus</option>
          <option value={vesselMaskUrl}>Vessel Mask</option>
          <option value={avOverlayUrl}>A/V Overlay</option>
        </select>
      </div>

      {/* Slider Container */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-square md:aspect-[4/3] bg-black overflow-hidden rounded-lg cursor-col-resize select-none touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        {/* Right Image (Background) */}
        <img 
          src={rightImage} 
          alt="Right view" 
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Left Image (Clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img 
            src={leftImage} 
            alt="Left view" 
            className="absolute inset-0 w-full h-full object-cover max-w-none pointer-events-none"
            style={{ width: containerRef.current ? containerRef.current.offsetWidth : '100vw' }}
          />
        </div>

        {/* Divider Line */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] pointer-events-none transform -translate-x-1/2"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Thumb */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
            <div className="w-4 h-1 flex flex-col justify-between items-center gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-center text-muted-foreground">Drag to compare layers</p>
    </div>
  );
};
