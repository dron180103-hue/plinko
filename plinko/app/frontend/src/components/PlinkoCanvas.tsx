import { useEffect, useRef, useCallback, useMemo } from 'react';
import { type PlinkoBoard } from '@/lib/plinkoEngine';
import { type BoardTheme } from '@/lib/gameStore';

interface PlinkoCanvasProps {
  board: PlinkoBoard | null;
  theme?: BoardTheme;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Ambient particle system for background atmosphere
interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
}

function createAmbientParticles(w: number, h: number, count: number): AmbientParticle[] {
  const particles: AmbientParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -Math.random() * 0.1 - 0.02,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.15 + 0.03,
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
    });
  }
  return particles;
}

// Parse rgba color string to extract r,g,b components
function parseRgba(color: string): { r: number; g: number; b: number } {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
  return { r: 139, g: 92, b: 246 }; // fallback purple
}

// Generate gradient colors from a base hex color
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) return { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) };
  return { r: 6, g: 0, b: 15 }; // fallback dark
}

function darken(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const dr = Math.floor(r * factor);
  const dg = Math.floor(g * factor);
  const db = Math.floor(b * factor);
  return `rgb(${dr},${dg},${db})`;
}

function lighten(hex: string, factor: number): string {
  const { r, g, b } = hexToRgb(hex);
  const lr = Math.min(255, Math.floor(r + (255 - r) * factor));
  const lg = Math.min(255, Math.floor(g + (255 - g) * factor));
  const lb = Math.min(255, Math.floor(b + (255 - b) * factor));
  return `rgb(${lr},${lg},${lb})`;
}

const DEFAULT_THEME: BoardTheme = {
  id: 'default',
  name: 'Default',
  emoji: '🟣',
  price: 0,
  bgColor: '#06000f',
  pegColor: 'rgba(139,92,246,0.3)',
  pegGlow: 'rgba(139,92,246,0.6)',
  ambientColor: 'rgba(139,92,246,0.03)',
};

export default function PlinkoCanvas({ board, theme }: PlinkoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const ambientRef = useRef<AmbientParticle[]>([]);
  const timeRef = useRef(0);
  const fpsRef = useRef({ lastTime: 0, frames: 0, fps: 60 });

  const activeTheme = theme || DEFAULT_THEME;

  // Derive colors from theme
  const themeColors = useMemo(() => {
    const bg = activeTheme.bgColor;
    const pegRgba = parseRgba(activeTheme.pegColor);
    const glowRgba = parseRgba(activeTheme.pegGlow);
    const ambientRgba = parseRgba(activeTheme.ambientColor);

    return {
      bgTop: bg,
      bgMid1: lighten(bg, 0.15),
      bgMid2: lighten(bg, 0.25),
      bgBottom: bg,
      // Peg colors
      pegR: pegRgba.r, pegG: pegRgba.g, pegB: pegRgba.b,
      glowR: glowRgba.r, glowG: glowRgba.g, glowB: glowRgba.b,
      // Ambient particle color
      ambR: ambientRgba.r, ambG: ambientRgba.g, ambB: ambientRgba.b,
      // Triangle/decorative color (use glow color)
      accentR: glowRgba.r, accentG: glowRgba.g, accentB: glowRgba.b,
    };
  }, [activeTheme]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !board) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const dw = canvas.clientWidth;
    const dh = canvas.clientHeight;

    if (canvas.width !== dw * dpr || canvas.height !== dh * dpr) {
      canvas.width = dw * dpr;
      canvas.height = dh * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ambientRef.current = createAmbientParticles(dw, dh, 20);
    }

    // FPS tracking for adaptive quality
    const now = performance.now();
    fpsRef.current.frames++;
    if (now - fpsRef.current.lastTime > 1000) {
      fpsRef.current.fps = fpsRef.current.frames;
      fpsRef.current.frames = 0;
      fpsRef.current.lastTime = now;
    }
    const highQuality = fpsRef.current.fps > 30;

    timeRef.current += 0.016;
    const time = timeRef.current;

    const sx = dw / board.width;
    const sy = dh / board.height;

    const tc = themeColors;

    // === BACKGROUND: Theme-based gradient with depth ===
    const bgGrad = ctx.createLinearGradient(0, 0, 0, dh);
    bgGrad.addColorStop(0, tc.bgTop);
    bgGrad.addColorStop(0.25, tc.bgMid1);
    bgGrad.addColorStop(0.6, tc.bgMid2);
    bgGrad.addColorStop(1, tc.bgBottom);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, dw, dh);

    // Animated radial glow at top (using theme accent)
    if (highQuality) {
      const pulseAlpha = 0.04 + Math.sin(time * 0.8) * 0.02;
      const topGlow = ctx.createRadialGradient(dw / 2, dh * 0.1, 0, dw / 2, dh * 0.15, dw * 0.55);
      topGlow.addColorStop(0, `rgba(${tc.accentR},${tc.accentG},${tc.accentB},${pulseAlpha})`);
      topGlow.addColorStop(0.5, `rgba(${tc.accentR},${tc.accentG},${tc.accentB},${pulseAlpha * 0.5})`);
      topGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, dw, dh);
    }

    // Ambient floating particles (theme-colored)
    if (highQuality) {
      for (const p of ambientRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.y < -5) { p.y = dh + 5; p.x = Math.random() * dw; }
        if (p.x < -5) p.x = dw + 5;
        if (p.x > dw + 5) p.x = -5;
        const a = p.alpha * (0.5 + 0.5 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${tc.ambR},${tc.ambG},${tc.ambB},${a})`;
        ctx.fill();
      }
    }

    // Subtle decorative circles (theme-colored)
    if (highQuality) {
      ctx.globalAlpha = 0.025;
      for (let i = 0; i < 4; i++) {
        const cx = dw * (0.2 + Math.sin(i * 1.5 + time * 0.1) * 0.3 + 0.3);
        const cy = dh * (0.15 + Math.cos(i * 0.9 + time * 0.08) * 0.25 + 0.25);
        const r = 30 + i * 20;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${tc.accentR},${tc.accentG},${tc.accentB})`;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.save();
    ctx.scale(sx, sy);

    // === TRIANGLE OUTLINE (animated dotted, theme-colored) ===
    const { triTop, triBottomLeft, triBottomRight } = board;
    // Calculate proportional padding based on board dimensions
    const triHeight = triBottomLeft.y - triTop.y;
    const triWidth = triBottomRight.x - triBottomLeft.x;
    const padY = Math.max(4, triHeight * 0.04); // vertical padding proportional to height
    const padX = Math.max(3, triWidth * 0.02); // horizontal padding proportional to width
    const dashOffset = (time * 15) % 16;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = -dashOffset;
    ctx.strokeStyle = `rgba(${tc.accentR},${tc.accentG},${tc.accentB},${0.2 + Math.sin(time * 1.5) * 0.05})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(triTop.x, triTop.y - padY);
    ctx.lineTo(triBottomLeft.x - padX, triBottomLeft.y + padY * 0.6);
    ctx.lineTo(triBottomRight.x + padX, triBottomRight.y + padY * 0.6);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // === PEGS with theme-based glow ===
    for (const peg of board.pegs) {
      const gl = peg.hitTimer;

      // Outer glow ring on hit (theme glow color)
      if (gl > 0.15 && highQuality) {
        const glowRadius = peg.radius * (3 + gl * 4);
        const glowGrad = ctx.createRadialGradient(peg.x, peg.y, peg.radius, peg.x, peg.y, glowRadius);
        glowGrad.addColorStop(0, `rgba(${tc.glowR},${tc.glowG},${tc.glowB},${gl * 0.15})`);
        glowGrad.addColorStop(0.5, `rgba(${tc.pegR},${tc.pegG},${tc.pegB},${gl * 0.06})`);
        glowGrad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();
      }

      // Peg body with theme-enhanced gradient
      const pegScale = 1 + gl * 0.35;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.radius * pegScale, 0, Math.PI * 2);

      if (gl > 0) {
        const pegGrad = ctx.createRadialGradient(
          peg.x - peg.radius * 0.2, peg.y - peg.radius * 0.2, 0,
          peg.x, peg.y, peg.radius * pegScale
        );
        pegGrad.addColorStop(0, `rgba(255,255,255,${0.95 + gl * 0.05})`);
        pegGrad.addColorStop(0.4, `rgba(${Math.min(255, tc.glowR + 80)},${Math.min(255, tc.glowG + 80)},${Math.min(255, tc.glowB + 80)},${0.7 + gl * 0.2})`);
        pegGrad.addColorStop(1, `rgba(${tc.glowR},${tc.glowG},${tc.glowB},${0.3 + gl * 0.3})`);
        ctx.fillStyle = pegGrad;
      } else {
        // Subtle idle pulse with theme colors
        const idlePulse = 0.02 * Math.sin(time * 2 + peg.x * 0.05 + peg.y * 0.03);
        const pegGrad = ctx.createRadialGradient(
          peg.x - peg.radius * 0.15, peg.y - peg.radius * 0.15, 0,
          peg.x, peg.y, peg.radius
        );
        pegGrad.addColorStop(0, `rgba(255,255,255,${0.88 + idlePulse})`);
        pegGrad.addColorStop(0.5, `rgba(${Math.min(255, tc.pegR + 120)},${Math.min(255, tc.pegG + 120)},${Math.min(255, tc.pegB + 120)},${0.5 + idlePulse})`);
        pegGrad.addColorStop(1, `rgba(${Math.min(255, tc.pegR + 80)},${Math.min(255, tc.pegG + 80)},${Math.min(255, tc.pegB + 80)},${0.3 + idlePulse})`);
        ctx.fillStyle = pegGrad;
      }
      ctx.fill();

      // Tiny highlight dot on peg
      if (highQuality) {
        ctx.beginPath();
        ctx.arc(peg.x - peg.radius * 0.25, peg.y - peg.radius * 0.3, peg.radius * 0.18, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${gl > 0 ? 0.6 : 0.25})`;
        ctx.fill();
      }
    }

    // === 3 ROWS OF MULTIPLIER SLOTS ===
    const slotAreaStartY = triBottomLeft.y + 15;
    const rowHeight = board.height * 0.048;
    const rowGap = 3;

    for (let rowIdx = 0; rowIdx < board.allSlotRows.length; rowIdx++) {
      const slotRow = board.allSlotRows[rowIdx];
      const isActive = slotRow.risk === board.riskLevel;
      const rowY = slotAreaStartY + rowIdx * (rowHeight + rowGap);

      const slotCount = slotRow.slots.length;
      const totalRowWidth = board.width * 0.88;
      const slotWidth = totalRowWidth / slotCount;
      const rowStartX = (board.width - totalRowWidth) / 2;

      for (let i = 0; i < slotRow.slots.length; i++) {
        const slot = slotRow.slots[i];
        const gl = isActive ? (board.slots[i]?.hitTimer || 0) : 0;

        const slotX = rowStartX + i * slotWidth;
        const sx2 = slotX + 0.8;
        const sw = slotWidth - 1.6;
        const sh = rowHeight;
        const r = 3;

        // Enhanced glow for active hit
        if (gl > 0 && isActive && highQuality) {
          ctx.shadowColor = slot.glowColor;
          ctx.shadowBlur = 15 * gl;
        }

        // Background with better gradient
        const alpha = isActive ? (gl > 0 ? 0.95 : 0.7) : 0.2;
        const slotGrad = ctx.createLinearGradient(sx2, rowY, sx2, rowY + sh);
        slotGrad.addColorStop(0, slot.color + (alpha > 0.5 ? 'DD' : '35'));
        slotGrad.addColorStop(0.5, slot.color + (alpha > 0.5 ? 'AA' : '28'));
        slotGrad.addColorStop(1, slot.color + (alpha > 0.5 ? '77' : '18'));
        ctx.fillStyle = slotGrad;

        drawRoundedRect(ctx, sx2, rowY, sw, sh, r);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Border with glow effect
        if (isActive) {
          ctx.strokeStyle = slot.color + (gl > 0 ? 'BB' : '44');
          ctx.lineWidth = gl > 0 ? 1.5 : 0.5;
          drawRoundedRect(ctx, sx2, rowY, sw, sh, r);
          ctx.stroke();
        }

        // Text with better rendering
        const fontSize = isActive ? Math.max(6, Math.min(9, sw * 0.38)) : Math.max(5, Math.min(7, sw * 0.32));
        ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textAlpha = isActive ? (gl > 0 ? 1 : 0.88) : 0.35;
        // Text shadow for active slots
        if (gl > 0 && isActive && highQuality) {
          ctx.fillStyle = slot.color + '66';
          ctx.fillText(
            slot.multiplier >= 100 ? `${slot.multiplier}` : `${slot.multiplier}x`,
            slotX + slotWidth / 2, rowY + sh / 2 + 0.5
          );
        }
        ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
        ctx.fillText(
          slot.multiplier >= 100 ? `${slot.multiplier}` : `${slot.multiplier}x`,
          slotX + slotWidth / 2, rowY + sh / 2
        );
      }
    }

    // === BALLS with enhanced effects ===
    for (const ball of board.balls) {
      if (!ball.active && ball.landed) continue;

      // Enhanced trail with gradient fade
      if (highQuality) {
        for (let i = 0; i < ball.trail.length; i++) {
          const tr = ball.trail[i];
          const progress = i / ball.trail.length;
          const trailAlpha = (1 - tr.age) * 0.6 * progress;
          if (trailAlpha <= 0.01) continue;
          const trailSize = ball.radius * (0.1 + 0.55 * progress);
          ctx.beginPath();
          ctx.arc(tr.x, tr.y, trailSize, 0, Math.PI * 2);
          ctx.fillStyle = ball.trailColor.replace(/[\d.]+\)$/, `${trailAlpha})`);
          ctx.fill();
        }
      }

      // Ball outer glow (larger, softer)
      if (highQuality) {
        ctx.shadowColor = ball.glow;
        ctx.shadowBlur = 20;
      }

      // Ball body with enhanced 3D gradient
      const ballGrad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.35, ball.y - ball.radius * 0.35, 0,
        ball.x, ball.y, ball.radius * 1.1
      );
      ballGrad.addColorStop(0, '#FFFEF0');
      ballGrad.addColorStop(0.25, '#FFF8D6');
      ballGrad.addColorStop(0.5, ball.color);
      ballGrad.addColorStop(0.85, '#5C3D00');
      ballGrad.addColorStop(1, '#2D1A00');

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();

      // Primary highlight
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.28, ball.y - ball.radius * 0.32, ball.radius * 0.24, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fill();

      // Secondary smaller highlight
      if (highQuality) {
        ctx.beginPath();
        ctx.arc(ball.x - ball.radius * 0.1, ball.y - ball.radius * 0.15, ball.radius * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      }

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(draw);
  }, [board, themeColors]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  // Dynamic border color based on theme
  const borderColor = useMemo(() => {
    const { glowR, glowG, glowB } = themeColors;
    return `rgba(${glowR},${glowG},${glowB},0.25)`;
  }, [themeColors]);

  const shadowColor = useMemo(() => {
    const { glowR, glowG, glowB } = themeColors;
    return `0 0 50px rgba(${glowR},${glowG},${glowB},0.15), inset 0 1px 0 rgba(255,255,255,0.05)`;
  }, [themeColors]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '3/4', maxHeight: '44vh', border: `1px solid ${borderColor}`, boxShadow: shadowColor }}>
      <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'auto', touchAction: 'none' }} />
      {/* Subtle corner glow overlays */}
      <div className="absolute top-0 left-0 w-16 h-16 pointer-events-none rounded-tl-2xl" style={{ background: `linear-gradient(to bottom right, rgba(${themeColors.accentR},${themeColors.accentG},${themeColors.accentB},0.05), transparent)` }} />
      <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none rounded-tr-2xl" style={{ background: `linear-gradient(to bottom left, rgba(${themeColors.accentR},${themeColors.accentG},${themeColors.accentB},0.05), transparent)` }} />
    </div>
  );
}