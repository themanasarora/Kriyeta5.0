import React, { useEffect, useRef } from "react";

const InteractiveBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    
    let width, height;
    let particles = [];
    
    const spacing = 22; // Space between dots
    let mouse = { x: -1000, y: -1000 };
    let time = 0;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const cols = Math.floor(width / spacing) + 2;
      const rows = Math.floor(height / spacing) + 2;

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          particles.push({
            x: i * spacing,
            y: j * spacing,
            baseX: i * spacing,
            baseY: j * spacing,
          });
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Calculate center of screen for wave origin
      const cx = width / 2;
      const cy = height / 2;
      
      time += 0.02;

      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; // Dot color

      particles.forEach((p) => {
        // Base wavy movement using sine and cosine functions
        // creating a complex landscape
        const distanceToCenter = Math.sqrt((p.baseX - cx) ** 2 + (p.baseY - cy) ** 2);
        
        let waveY = Math.sin((p.baseX * 0.005) + time) * 20;
        waveY += Math.cos((p.baseY * 0.005) + time * 0.8) * 20;
        waveY += Math.sin((distanceToCenter * 0.005) - time) * 30; // Circular ripple

        // Mouse interaction: push dots away or make them bigger near mouse
        const dx = mouse.x - p.baseX;
        const dy = mouse.y - p.baseY;
        const distToMouse = Math.sqrt(dx * dx + dy * dy);
        
        let mouseOffsetY = 0;
        let radius = 1.2; // Base dot size

        if (distToMouse < 200) {
          const force = (200 - distToMouse) / 200;
          mouseOffsetY = force * 40; // Lift up near mouse
          radius += force * 2; // Increase size near mouse
        }

        // Apply depth effect by changing size based on wave height
        const depthFactor = (waveY + 70) / 140; // Normalize roughly to 0-1
        radius *= 0.5 + depthFactor;

        p.x = p.baseX;
        p.y = p.baseY + waveY - mouseOffsetY;

        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.1, radius), 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    
    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        background: "linear-gradient(135deg, #020b1a 0%, #0a0e3a 35%, #1a0a2e 65%, #2d0840 100%)",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          mixBlendMode: "overlay",
        }}
      />
    </div>
  );
};

export default InteractiveBackground;
