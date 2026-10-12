"use client";

import { useEffect, useRef } from "react";

const CELL = 18; // px between columns and rows of digits
const FPS = 18;

/**
 * Full-screen background of falling 0s and 1s, like an old green-phosphor terminal.
 * Draws a single still frame when the visitor prefers reduced motion, and pauses while the tab is hidden.
 * @returns {JSX.Element} A fixed canvas behind the page content.
 */
export default function BinaryRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let drops: number[] = [];
    let frame = 0;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `${CELL - 4}px ui-monospace, "Geist Mono", monospace`;
      // Start each column at a random height so the rain is already falling on first paint.
      drops = Array.from({ length: Math.ceil(innerWidth / CELL) }, () => Math.random() * (innerHeight / CELL));
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, innerWidth, innerHeight);
      if (reduceMotion) drawStill();
    };

    const drawStill = () => {
      for (let x = 0; x < innerWidth; x += CELL) {
        for (let y = CELL; y < innerHeight; y += CELL) {
          ctx.fillStyle = `rgba(34, 197, 94, ${0.05 + Math.random() * 0.12})`;
          ctx.fillText(Math.random() < 0.5 ? "0" : "1", x, y);
        }
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 1000 / FPS) return;
      last = now;

      // A translucent wash fades older digits into trails.
      ctx.fillStyle = "rgba(5, 8, 5, 0.08)";
      ctx.fillRect(0, 0, innerWidth, innerHeight);

      drops.forEach((row, i) => {
        const y = row * CELL;
        ctx.fillStyle = Math.random() < 0.04 ? "rgba(187, 247, 208, 0.9)" : "rgba(34, 197, 94, 0.55)";
        ctx.fillText(Math.random() < 0.5 ? "0" : "1", i * CELL, y);
        drops[i] = y > innerHeight && Math.random() > 0.975 ? 0 : row + 1;
      });
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !reduceMotion) frame = requestAnimationFrame(tick);
    };

    resize();
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduceMotion) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={canvasRef} className="h-full w-full" />
      <div className="scanlines absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75))]" />
    </div>
  );
}
