import React, { useState, useRef } from 'react';

interface MaskSplitSliderProps {
  rawUrl: string;
  vesselMaskUrl: string;
  avOverlayUrl: string;
  className?: string;
}

export const MaskSplitSlider: React.FC<MaskSplitSliderProps> = ({
  rawUrl,
  vesselMaskUrl,
  avOverlayUrl,
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [leftImage, setLeftImage] = useState<string>(rawUrl);
  const [rightImage, setRightImage] = useState<string>(avOverlayUrl);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>
  ) => {
    if (!containerRef.current) return;

    if (e.type === 'mousemove' && (e as React.MouseEvent).buttons !== 1) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSliderPos(pos);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Controls */}
      <div className="flex items-center gap-2 justify-center text-xs">
        <select
          className="bg-surface border border-border text-foreground text-xs rounded px-2 py-1 focus:outline-none focus:border-border-strong"
          value={leftImage}
          onChange={(e) => setLeftImage(e.target.value)}
        >
          <option value={rawUrl}>Raw Color Fundus</option>
          <option value={vesselMaskUrl}>Vessel Segmentation Mask</option>
          <option value={avOverlayUrl}>Artery/Vein Classification</option>
        </select>
        <span className="text-muted-foreground text-xs font-mono">/</span>
        <select
          className="bg-surface border border-border text-foreground text-xs rounded px-2 py-1 focus:outline-none focus:border-border-strong"
          value={rightImage}
          onChange={(e) => setRightImage(e.target.value)}
        >
          <option value={rawUrl}>Raw Color Fundus</option>
          <option value={vesselMaskUrl}>Vessel Segmentation Mask</option>
          <option value={avOverlayUrl}>Artery/Vein Classification</option>
        </select>
      </div>

      {/* Slider Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square md:aspect-[16/10] bg-surface-deep overflow-hidden rounded border border-border cursor-col-resize select-none touch-none max-h-[460px]"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        {/* Right Image (Background) */}
        <img
          src={rightImage}
          alt="Right layer"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Left Image (Clipped via CSS polygon) */}
        <img
          src={leftImage}
          alt="Left layer"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
        />

        {/* Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-primary pointer-events-none transform -translate-x-1/2"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 bg-surface border border-primary text-primary rounded-full shadow-sm flex items-center justify-center font-mono text-[9px]">
            ↔
          </div>
        </div>
      </div>

      <p className="text-[11px] text-center text-muted-foreground">
        Click and drag divider to compare segmented vasculature against raw optical fundus.
      </p>
    </div>
  );
};
