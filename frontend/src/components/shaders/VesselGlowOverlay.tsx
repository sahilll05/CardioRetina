import React, { useRef, useEffect, useState } from 'react';

interface VesselGlowOverlayProps {
  maskUrl: string;
  className?: string;
  onHoverVessel?: (vesselType: string, confidence: number) => void;
}

export const VesselGlowOverlay: React.FC<VesselGlowOverlayProps> = ({ maskUrl, className, onHoverVessel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = maskUrl;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
  }, [maskUrl]);

  useEffect(() => {
    if (!imageLoaded || !canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw the base mask image
      ctx.drawImage(imageRef.current!, 0, 0, canvas.width, canvas.height);
      
      // Apply a glowing pulse effect using global composite operations
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.sin(time * 3) * 0.2 + 0.3; // Pulse alpha between 0.1 and 0.5
      
      // Draw it again slightly scaled or blurred for glow
      ctx.filter = 'blur(4px)';
      ctx.drawImage(imageRef.current!, 0, 0, canvas.width, canvas.height);
      
      ctx.filter = 'none';
      ctx.globalAlpha = 1.0;
      ctx.globalCompositeOperation = 'source-over';
      
      time += 0.016;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [imageLoaded]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onHoverVessel) return;
    // In a real app, we'd sample the pixel color to determine Artery vs Vein
    // For this mock, we'll just emit a fake hover event based on position
    if (Math.random() > 0.95) {
      onHoverVessel(Math.random() > 0.5 ? 'Artery' : 'Vein', 0.8 + Math.random() * 0.2);
    }
  };

  return (
    <canvas 
      ref={canvasRef} 
      className={`absolute inset-0 w-full h-full object-cover cursor-crosshair ${className}`}
      onMouseMove={handleMouseMove}
    />
  );
};
