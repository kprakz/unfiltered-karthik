"use client";

import { useEffect, useRef } from "react";

const CELL = 18; // px between columns and rows of digits
const FPS = 18; // the rain ticks slowly, like an old terminal; scattered digits animate at full frame rate
const GRAVITY = 1400; // px/s²
const PUSH_RADIUS = 70; // px around the cursor that knocks digits loose
const BURST = 36; // digits thrown out by a click
const MAX_PARTICLES = 700;

type Particle = { x: number; y: number; vx: number; vy: number; ch: string; age: number; life: number; bounced: boolean };

const digit = () => (Math.random() < 0.5 ? "0" : "1");

/**
 * Full-screen background of falling 0s and 1s, like an old green-phosphor terminal.
 * Moving the cursor knocks digits loose and clicking the background throws out a burst; both tumble down under gravity.
 * Draws a single still frame (no interaction) when the visitor prefers reduced motion, and pauses while the tab is hidden.
 * @returns {JSX.Element} Fixed canvases behind the page content.
 */
export default function BinaryRain() {
  const rainRef = useRef<HTMLCanvasElement>(null);
  const sparkRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const rainCanvas = rainRef.current;
    const sparkCanvas = sparkRef.current;
    const rain = rainCanvas?.getContext("2d");
    const spark = sparkCanvas?.getContext("2d");
    if (!rainCanvas || !sparkCanvas || !rain || !spark) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const font = `${CELL - 4}px ui-monospace, "Geist Mono", monospace`;
    let drops: number[] = [];
    let particles: Particle[] = [];
    let frame = 0;
    let lastRain = 0;
    let lastFrame = 0;
    // Where the cursor is, how fast it moves, and when it last moved (it only pushes while active).
    const pointer = { x: -1e4, y: -1e4, vx: 0, vy: 0, at: 0 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const [canvas, ctx] of [
        [rainCanvas, rain],
        [sparkCanvas, spark],
      ] as const) {
        canvas.width = innerWidth * dpr;
        canvas.height = innerHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = font;
      }
      // Start each column at a random height so the rain is already falling on first paint.
      drops = Array.from({ length: Math.ceil(innerWidth / CELL) }, () => Math.random() * (innerHeight / CELL));
      rain.fillStyle = "#050805";
      rain.fillRect(0, 0, innerWidth, innerHeight);
      if (reduceMotion) drawStill();
    };

    const drawStill = () => {
      for (let x = 0; x < innerWidth; x += CELL) {
        for (let y = CELL; y < innerHeight; y += CELL) {
          rain.fillStyle = `rgba(34, 197, 94, ${0.05 + Math.random() * 0.12})`;
          rain.fillText(digit(), x, y);
        }
      }
    };

    const spawn = (x: number, y: number, vx: number, vy: number) => {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({ x, y, vx, vy, ch: digit(), age: 0, life: 1.6 + Math.random() * 1.4, bounced: false });
    };

    const pointerActive = (now: number) => now - pointer.at < 120;

    const tickRain = (now: number) => {
      // A translucent wash fades older digits into trails.
      rain.fillStyle = "rgba(5, 8, 5, 0.08)";
      rain.fillRect(0, 0, innerWidth, innerHeight);

      const active = pointerActive(now);
      if (active) {
        // Clear a soft gap around the cursor so it looks like it is parting the rain.
        rain.fillStyle = "rgba(5, 8, 5, 0.35)";
        rain.beginPath();
        rain.arc(pointer.x, pointer.y, PUSH_RADIUS * 0.8, 0, Math.PI * 2);
        rain.fill();
      }

      drops.forEach((row, i) => {
        const x = i * CELL;
        const y = row * CELL;
        const dx = x - pointer.x;
        const dy = y - pointer.y;
        const dist = Math.hypot(dx, dy);
        if (active && dist < PUSH_RADIUS) {
          // The cursor knocks this digit off its column: it flies away from the cursor and the column restarts at the top.
          const force = 260 + (1 - dist / PUSH_RADIUS) * 380;
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.6;
          spawn(x, y, Math.cos(angle) * force + pointer.vx * 0.25, Math.sin(angle) * force - 120 + pointer.vy * 0.25);
          drops[i] = -Math.random() * 20;
          return;
        }
        rain.fillStyle = Math.random() < 0.04 ? "rgba(187, 247, 208, 0.9)" : "rgba(34, 197, 94, 0.55)";
        rain.fillText(digit(), x, y);
        drops[i] = y > innerHeight && Math.random() > 0.975 ? 0 : row + 1;
      });
    };

    const tickParticles = (dt: number) => {
      spark.clearRect(0, 0, innerWidth, innerHeight);
      const floor = innerHeight - 6;
      particles = particles.filter((p) => {
        p.age += dt;
        p.vy += GRAVITY * dt;
        p.vx *= 1 - 0.8 * dt; // a little air drag
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.y > floor && !p.bounced) {
          // One small bounce off the bottom of the screen, then it falls away.
          p.y = floor;
          p.vy *= -0.35;
          p.vx *= 0.6;
          p.bounced = true;
        }
        if (p.age > p.life || p.y > innerHeight + CELL) return false;

        const fade = 1 - p.age / p.life;
        spark.fillStyle = p.age < 0.15 ? `rgba(220, 252, 231, ${fade})` : `rgba(74, 222, 128, ${fade * 0.9})`;
        spark.fillText(p.ch, p.x, p.y);
        return true;
      });
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - (lastFrame || now)) / 1000, 0.05);
      lastFrame = now;
      if (now - lastRain >= 1000 / FPS) {
        lastRain = now;
        tickRain(now);
      }
      tickParticles(dt);
    };

    const onMove = (e: PointerEvent) => {
      const now = performance.now();
      const elapsed = Math.max((now - pointer.at) / 1000, 0.016);
      if (now - pointer.at < 200) {
        pointer.vx = (e.clientX - pointer.x) / elapsed;
        pointer.vy = (e.clientY - pointer.y) / elapsed;
      }
      // A quick swipe also flicks out a few loose digits along its path.
      const speed = Math.hypot(pointer.vx, pointer.vy);
      if (speed > 600 && Math.random() < 0.5) {
        spawn(e.clientX, e.clientY, pointer.vx * 0.3 + (Math.random() - 0.5) * 200, pointer.vy * 0.3 - 150);
      }
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.at = now;
    };

    const onDown = (e: PointerEvent) => {
      // Clicks on links and buttons do their normal thing; only the background bursts.
      if (e.target instanceof Element && e.target.closest("a, button")) return;
      for (let i = 0; i < BURST; i++) {
        const angle = Math.random() * Math.PI * 2;
        const force = 200 + Math.random() * 520;
        spawn(e.clientX, e.clientY, Math.cos(angle) * force, Math.sin(angle) * force - 260);
      }
    };

    const onLeave = () => {
      pointer.at = 0;
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      if (!document.hidden && !reduceMotion) frame = requestAnimationFrame(tick);
    };

    resize();
    addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduceMotion) {
      addEventListener("pointermove", onMove, { passive: true });
      addEventListener("pointerdown", onDown, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      frame = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <canvas ref={rainRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={sparkRef} className="absolute inset-0 h-full w-full" />
      <div className="scanlines absolute inset-0" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75))]" />
    </div>
  );
}
