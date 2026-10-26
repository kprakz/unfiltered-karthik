"use client";

import { useEffect, useRef } from "react";

const B = 32; // block size in px; textures are 16×16 texels drawn at 2×
const GRAVITY = 1800; // px/s²

// Block ids. 0 is air.
const AIR = 0;
const GRASS = 1;
const DIRT = 2;
const STONE = 3;
const COAL = 4;
const IRON = 5;
const LOG = 6;
const LEAVES = 7;
const PLANKS = 8;
const BEDROCK = 9;

// Blocks a click in the sky places, in turn.
const PLACEABLE = [PLANKS, STONE, GRASS, LOG, LEAVES, DIRT];

const PALETTES: Record<number, string[]> = {
  [GRASS]: ["#6fbf3d", "#5fa833", "#7cc74a", "#58992f"],
  [DIRT]: ["#8b6340", "#7a5536", "#96704a", "#6b4a2f"],
  [STONE]: ["#8a8a8a", "#7d7d7d", "#959595", "#6f6f6f"],
  [COAL]: ["#2b2b2b", "#3a3a3a", "#8a8a8a"],
  [IRON]: ["#d8af93", "#c48f6d", "#8a8a8a"],
  [LOG]: ["#6b5130", "#5d4528", "#7a5e38", "#4f3a22"],
  [LEAVES]: ["#3f8f2a", "#4aa032", "#357a22", "#56ad3c", "#2f6e1f"],
  [PLANKS]: ["#b8945f", "#a8854f", "#c4a06a"],
  [BEDROCK]: ["#3d3d3d", "#575757", "#2a2a2a", "#6b6b6b"],
};

type Particle = { x: number; y: number; vx: number; vy: number; color: string; size: number; age: number; life: number };
type FallingBlock = { c: number; y: number; vy: number; id: number };
type Cloud = { x: number; y: number; speed: number; rects: [number, number, number, number][] };

/** Small seeded random number generator, so a block type always gets the same texture. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Paints a 16×16 pixel-art texture for one block type. */
function makeTexture(id: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 16;
  const ctx = canvas.getContext("2d")!;
  const rand = rng(id * 977);
  const pick = (palette: string[]) => palette[Math.floor(rand() * palette.length)];
  const px = (x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  };

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (id === GRASS) {
        const green = y < 3 || (y === 3 && rand() < 0.5) || (y === 4 && rand() < 0.15);
        px(x, y, pick(green ? PALETTES[GRASS] : PALETTES[DIRT]));
      } else if (id === COAL || id === IRON) {
        px(x, y, pick(PALETTES[STONE]));
      } else if (id === LOG) {
        // Bark runs in vertical stripes.
        const stripe = PALETTES[LOG][(x + (rand() < 0.2 ? 1 : 0)) % PALETTES[LOG].length];
        px(x, y, stripe);
      } else if (id === PLANKS) {
        const seam = y % 4 === 3 || (x === (y < 4 || (y >= 8 && y < 12) ? 7 : 15) && y % 4 !== 3);
        px(x, y, seam ? "#7d6035" : pick(PALETTES[PLANKS]));
      } else {
        px(x, y, pick(PALETTES[id]));
      }
    }
  }

  if (id === COAL || id === IRON) {
    // A few ore clusters on the stone.
    const ore = id === COAL ? PALETTES[COAL].slice(0, 2) : PALETTES[IRON].slice(0, 2);
    for (let i = 0; i < 4; i++) {
      const cx = 1 + Math.floor(rand() * 12);
      const cy = 1 + Math.floor(rand() * 12);
      for (let j = 0; j < 4; j++) px(cx + Math.floor(rand() * 3), cy + Math.floor(rand() * 2), pick(ore));
    }
  }
  return canvas;
}

/**
 * Full-screen Minecraft-style background: sky, drifting clouds and blocky terrain with trees.
 * Hovering outlines a block, clicking a block breaks it, and clicking the sky places a block that falls into place.
 * Clouds stand still and blocks skip the falling animation when the visitor prefers reduced motion.
 * @returns {JSX.Element} A fixed canvas behind the page content.
 */
export default function BlockWorld() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const textures: Record<number, HTMLCanvasElement> = {};
    for (const id of Object.keys(PALETTES).map(Number)) textures[id] = makeTexture(id);

    // The world is stored by column, counted up from the bottom of the screen, so it stays put
    // when a phone's address bar changes the window height.
    let grid: Uint8Array[] = [];
    let maxRows = 0;
    let width = 0;
    let height = 0;
    let clouds: Cloud[] = [];
    let particles: Particle[] = [];
    let falling: FallingBlock[] = [];
    let placeIndex = 0;
    let frame = 0;
    let last = 0;
    const hover = { x: -1, y: -1 };

    const get = (c: number, d: number) => grid[c]?.[d] ?? AIR;
    const set = (c: number, d: number, id: number) => {
      if (grid[c] && d >= 0 && d < maxRows) grid[c][d] = id;
    };

    const generate = () => {
      const cols = Math.ceil(width / B) + 1;
      maxRows = Math.ceil(Math.max(screen.height, height) / B) + 2;
      grid = Array.from({ length: cols }, () => new Uint8Array(maxRows));
      const rand = Math.random;
      const rows = Math.ceil(height / B);
      const base = Math.max(4, Math.round(rows * 0.2));
      const p1 = rand() * 10;
      const p2 = rand() * 10;
      const surface: number[] = [];

      for (let c = 0; c < cols; c++) {
        const s = base + Math.round(1.6 * Math.sin(c * 0.35 + p1) + Math.sin(c * 0.9 + p2));
        surface.push(s);
        for (let d = 0; d < s; d++) {
          let id = d === s - 1 ? GRASS : d >= s - 4 ? DIRT : STONE;
          if (d === 0) id = BEDROCK;
          else if (id === STONE) {
            const r = rand();
            id = r < 0.07 ? COAL : r < 0.1 ? IRON : STONE;
          }
          grid[c][d] = id;
        }
      }

      // Trees: a trunk and a blob of leaves, spaced apart.
      let lastTree = -10;
      for (let c = 2; c < cols - 2; c++) {
        if (c - lastTree < 5 || rand() > 0.14) continue;
        lastTree = c;
        const s = surface[c];
        const trunk = 4 + Math.floor(rand() * 2);
        for (let d = s; d < s + trunk; d++) set(c, d, LOG);
        const top = s + trunk;
        for (let dx = -2; dx <= 2; dx++) {
          for (const d of [top - 2, top - 1]) if (get(c + dx, d) === AIR) set(c + dx, d, LEAVES);
        }
        for (let dx = -1; dx <= 1; dx++) set(c + dx, top, LEAVES);
        set(c, top + 1, LEAVES);
      }

      // Blocky clouds made of a few overlapping rectangles, in half-block units.
      const u = B / 2;
      clouds = Array.from({ length: Math.max(3, Math.round(width / 260)) }, () => {
        const parts = 2 + Math.floor(rand() * 3);
        const rects: Cloud["rects"] = [];
        for (let i = 0; i < parts; i++) {
          rects.push([Math.floor(rand() * 6) * u, Math.floor(rand() * 2) * u, (4 + Math.floor(rand() * 7)) * u, 2 * u]);
        }
        return { x: rand() * width, y: 20 + rand() * height * 0.3, speed: 8 + rand() * 10, rects };
      });
    };

    const resize = () => {
      const widthChanged = innerWidth !== width;
      width = innerWidth;
      height = innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      if (widthChanged || Math.ceil(height / B) + 2 > maxRows) generate();
    };

    const rowTop = (d: number) => height - (d + 1) * B;
    const cellAt = (x: number, y: number) => ({ c: Math.floor(x / B), d: Math.floor((height - y) / B) });

    const burst = (c: number, d: number, id: number, count: number) => {
      if (reduceMotion) return;
      const palette = PALETTES[id];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: c * B + Math.random() * B,
          y: rowTop(d) + Math.random() * B,
          vx: (Math.random() - 0.5) * 260,
          vy: -120 - Math.random() * 280,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 4 + Math.floor(Math.random() * 3) * 2,
          age: 0,
          life: 0.6 + Math.random() * 0.6,
        });
      }
    };

    // The lowest free cell in column c at or below depth d: where a dropped block comes to rest.
    const landingDepth = (c: number, d: number) => {
      let l = Math.max(0, Math.min(d, maxRows - 1));
      while (l > 0 && get(c, l - 1) === AIR) l--;
      return l;
    };

    const update = (dt: number) => {
      if (!reduceMotion) {
        for (const cloud of clouds) {
          cloud.x += cloud.speed * dt;
          if (cloud.x > width + 20) cloud.x = -11 * (B / 2);
        }
      }

      falling = falling.filter((block) => {
        block.vy += GRAVITY * dt;
        block.y += block.vy * dt;
        const land = landingDepth(block.c, Math.ceil((height - block.y - B) / B));
        if (block.y < rowTop(land)) return true;
        set(block.c, land, block.id);
        burst(block.c, land, block.id, 5);
        return false;
      });

      particles = particles.filter((p) => {
        p.age += dt;
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        return p.age < p.life && p.y < height + 20;
      });
    };

    const draw = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, "#7ec0ff");
      sky.addColorStop(1, "#d6eeff");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, width, height);

      // A square sun with a soft halo.
      const sunX = width - Math.min(160, width * 0.28);
      ctx.fillStyle = "rgba(255, 249, 196, 0.45)";
      ctx.fillRect(sunX - 12, 36, 88, 88);
      ctx.fillStyle = "#fff6a6";
      ctx.fillRect(sunX, 48, 64, 64);

      ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
      for (const cloud of clouds) {
        for (const [x, y, w, h] of cloud.rects) ctx.fillRect(Math.round(cloud.x + x), Math.round(cloud.y + y), w, h);
      }

      const rows = Math.ceil(height / B) + 1;
      for (let c = 0; c < grid.length; c++) {
        for (let d = 0; d < Math.min(rows, maxRows); d++) {
          const id = grid[c][d];
          if (id !== AIR) ctx.drawImage(textures[id], c * B, rowTop(d), B, B);
        }
      }

      for (const block of falling) ctx.drawImage(textures[block.id], block.c * B, Math.round(block.y), B, B);

      for (const p of particles) {
        ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Minecraft-style selection outline on the block under the cursor (a faint one where a block would go).
      if (hover.x >= 0) {
        const { c, d } = cellAt(hover.x, hover.y);
        const solid = get(c, d) !== AIR;
        ctx.lineWidth = 2;
        ctx.strokeStyle = solid ? "rgba(0, 0, 0, 0.75)" : "rgba(255, 255, 255, 0.7)";
        ctx.strokeRect(c * B + 1, rowTop(d) + 1, B - 2, B - 2);
      }
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      update(dt);
      draw();
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      hover.x = e.clientX;
      hover.y = e.clientY;
    };

    const onLeave = () => {
      hover.x = -1;
    };

    // `click` (not pointerdown) so starting a scroll on a phone doesn't break blocks.
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a, button")) return;
      const { c, d } = cellAt(e.clientX, e.clientY);
      if (c < 0 || c >= grid.length || d < 0 || d >= maxRows) return;
      const id = get(c, d);
      if (id === BEDROCK) return;
      if (id !== AIR) {
        set(c, d, AIR);
        burst(c, d, id, 14);
        return;
      }
      const place = PLACEABLE[placeIndex++ % PLACEABLE.length];
      const land = landingDepth(c, d);
      if (reduceMotion || land === d) set(c, land, place);
      else falling.push({ c, y: rowTop(d), vy: 0, id: place });
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    resize();
    addEventListener("resize", resize);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("click", onClick);
    document.documentElement.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      removeEventListener("pointermove", onMove);
      removeEventListener("click", onClick);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 -z-10 h-full w-full" />;
}
