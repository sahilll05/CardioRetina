import React, { useRef, useEffect } from 'react';

export const RetinalGridShader: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.1)'; // Teal / Secondary color faint
      ctx.lineWidth = 1;

      const gridSize = 40;
      const offsetX = (time * 10) % gridSize;
      const offsetY = (time * 5) % gridSize;

      ctx.beginPath();
      for (let x = offsetX; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
      }
      for (let y = offsetY; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
      }
      ctx.stroke();

      // Draw some pulsing nodes
      ctx.fillStyle = 'rgba(20, 184, 166, 0.3)';
      for (let x = offsetX; x < canvas.width; x += gridSize * 2) {
        for (let y = offsetY; y < canvas.height; y += gridSize * 2) {
          const pulse = Math.sin(time * 2 + (x + y) * 0.01) * 2 + 3;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(0, pulse), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      time += 0.016;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={`absolute inset-0 pointer-events-none ${className}`} />;
};
