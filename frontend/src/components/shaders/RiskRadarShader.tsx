import React, { useRef, useEffect } from 'react';

interface RiskRadarShaderProps {
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  confidence: number;
  className?: string;
}

export const RiskRadarShader: React.FC<RiskRadarShaderProps> = ({ riskLevel, confidence, className }) => {
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
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) - 10;

      // Base radar circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Determine color based on risk
      let r = 20, g = 184, b = 166; // secondary (low risk)
      if (riskLevel === 'MODERATE') {
        r = 245; g = 158; b = 11; // warning
      } else if (riskLevel === 'HIGH') {
        r = 239; g = 68; b = 68; // destructive
      }

      // Draw the confidence band (arc)
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (Math.PI * 2 * confidence);
      
      // Outer glow/uncertainty band pulses slightly
      const pulseRadius = radius + Math.sin(time * 4) * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, pulseRadius, startAngle, endAngle);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.lineWidth = 8;
      ctx.stroke();

      // Inner solid band
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.lineWidth = 4;
      ctx.stroke();

      time += 0.016;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [riskLevel, confidence]);

  return <canvas ref={canvasRef} className={`w-full h-full ${className}`} />;
};
