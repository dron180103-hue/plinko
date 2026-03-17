import { useEffect, useRef, useCallback } from 'react';
import { type PlinkoBoard, type RiskLevel } from '@/lib/plinkoEngine';

interface PlinkoCanvasProps {
  board: PlinkoBoard | null;
}

const RISK_ORDER: RiskLevel[] = ['low', 'medium', 'high'];
const RISK_LABELS: Record<RiskLevel, string> = { low: 'Low', medium: 'Medium', high: 'High' };

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

export default function PlinkoCanvas({ board }: PlinkoCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

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
    }

    const sx = dw / board.width;
    const sy = dh / board.height;

    // === BACKGROUND: Teal gradient ===
    const bgGrad = ctx.createLinearGradient(0, 0, 0, dh);
    bgGrad.addColorStop(0, '#004D40');
    bgGrad.addColorStop(0.3, '#00695C');
    bgGrad.addColorStop(0.6, '#00796B');
    bgGrad.addColorStop(1, '#004D40');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, dw, dh);

    // Subtle circular decorative elements
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 6; i++) {
      const cx = dw * (0.15 + Math.sin(i * 1.2) * 0.35 + 0.5);
      const cy = dh * (0.1 + Math.cos(i * 0.8) * 0.3 + 0.3);
      const r = 40 + i * 25;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#80CBC4';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Radial glow at top center
    const topGlow = ctx.createRadialGradient(dw / 2, dh * 0.15, 0, dw / 2, dh * 0.15, dw * 0.5);
    topGlow.addColorStop(0, 'rgba(128,203,196,0.06)');
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, dw, dh);

    ctx.save();
    ctx.scale(sx, sy);

    // === TRIANGLE OUTLINE (dotted) ===
    const { triTop, triBottomLeft, triBottomRight } = board;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(128,203,196,0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(triTop.x, triTop.y - 8);
    ctx.lineTo(triBottomLeft.x - 5, triBottomLeft.y + 5);
    ctx.lineTo(triBottomRight.x + 5, triBottomRight.y + 5);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // === PEGS ===
    for (const peg of board.pegs) {
      const gl = peg.hitTimer;

      // Hit glow
      if (gl > 0.2) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius * (2.5 + gl * 3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${gl * 0.08})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.radius * (1 + gl * 0.3), 0, Math.PI * 2);

      if (gl > 0) {
        const pegGrad = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.radius * (1 + gl * 0.3));
        pegGrad.addColorStop(0, `rgba(255, 255, 255, ${0.9 + gl * 0.1})`);
        pegGrad.addColorStop(1, `rgba(200, 230, 225, ${0.5 + gl * 0.3})`);
        ctx.fillStyle = pegGrad;
      } else {
        const pegGrad = ctx.createRadialGradient(peg.x, peg.y, 0, peg.x, peg.y, peg.radius);
        pegGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        pegGrad.addColorStop(1, 'rgba(200, 230, 225, 0.35)');
        ctx.fillStyle = pegGrad;
      }
      ctx.fill();
    }

    // === 3 ROWS OF MULTIPLIER SLOTS ===
    const slotAreaStartY = triBottomLeft.y + 15;
    const rowHeight = board.height * 0.048;
    const rowGap = 3;

    for (let rowIdx = 0; rowIdx < board.allSlotRows.length; rowIdx++) {
      const slotRow = board.allSlotRows[rowIdx];
      const isActive = slotRow.risk === board.riskLevel;
      const rowY = slotAreaStartY + rowIdx * (rowHeight + rowGap);

      for (let i = 0; i < slotRow.slots.length; i++) {
        const slot = slotRow.slots[i];
        const isActiveSlot = isActive && board.slots[i]?.hitTimer > 0;
        const gl = isActive ? (board.slots[i]?.hitTimer || 0) : 0;

        const sx2 = slot.x + 0.8;
        const sw = slot.width - 1.6;
        const sh = rowHeight;
        const r = 2.5;

        // Glow for active hit
        if (gl > 0 && isActive) {
          ctx.shadowColor = slot.glowColor;
          ctx.shadowBlur = 12 * gl;
        }

        // Background
        const alpha = isActive ? (gl > 0 ? 0.95 : 0.7) : 0.25;
        const slotGrad = ctx.createLinearGradient(sx2, rowY, sx2, rowY + sh);
        slotGrad.addColorStop(0, slot.color + (alpha > 0.5 ? 'CC' : '40'));
        slotGrad.addColorStop(1, slot.color + (alpha > 0.5 ? '88' : '20'));
        ctx.fillStyle = slotGrad;

        drawRoundedRect(ctx, sx2, rowY, sw, sh, r);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Border
        if (isActive) {
          ctx.strokeStyle = slot.color + (gl > 0 ? '99' : '55');
          ctx.lineWidth = gl > 0 ? 1.2 : 0.5;
          drawRoundedRect(ctx, sx2, rowY, sw, sh, r);
          ctx.stroke();
        }

        // Text
        const fontSize = isActive ? Math.max(6, Math.min(9, sw * 0.38)) : Math.max(5, Math.min(7, sw * 0.32));
        ctx.font = `800 ${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textAlpha = isActive ? (gl > 0 ? 1 : 0.85) : 0.4;
        ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;

        const multText = slot.multiplier >= 100 ? `${slot.multiplier}` : `${slot.multiplier}x`;
        ctx.fillText(multText, slot.x + slot.width / 2, rowY + sh / 2);
      }

      // Risk label on the left
      const labelX = 8;
      const labelY = rowY + rowHeight / 2;
      const labelFontSize = isActive ? 7 : 5.5;
      ctx.font = `700 ${labelFontSize}px system-ui, -apple-system, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = isActive ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)';

      // Active indicator dot
      if (isActive) {
        ctx.beginPath();
        ctx.arc(labelX - 1, labelY, 2, 0, Math.PI * 2);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
      }
    }

    // === BALLS ===
    for (const ball of board.balls) {
      if (!ball.active && ball.landed) continue;

      // Trail
      for (let i = 0; i < ball.trail.length; i++) {
        const tr = ball.trail[i];
        const progress = i / ball.trail.length;
        const trailAlpha = (1 - tr.age) * 0.5 * progress;
        if (trailAlpha <= 0) continue;
        ctx.beginPath();
        ctx.arc(tr.x, tr.y, ball.radius * (0.15 + 0.5 * progress), 0, Math.PI * 2);
        ctx.fillStyle = ball.trailColor.replace(/[\d.]+\)$/, `${trailAlpha})`);
        ctx.fill();
      }

      // Ball glow
      ctx.shadowColor = ball.glow;
      ctx.shadowBlur = 16;

      // Ball body
      const ballGrad = ctx.createRadialGradient(
        ball.x - ball.radius * 0.3, ball.y - ball.radius * 0.3, 0,
        ball.x, ball.y, ball.radius
      );
      ballGrad.addColorStop(0, '#FFFDE8');
      ballGrad.addColorStop(0.35, ball.color);
      ballGrad.addColorStop(1, '#3D2800');

      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = ballGrad;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.arc(ball.x - ball.radius * 0.25, ball.y - ball.radius * 0.3, ball.radius * 0.22, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }

    ctx.restore();
    animFrameRef.current = requestAnimationFrame(draw);
  }, [board]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-teal-500/20 shadow-[0_0_40px_rgba(0,150,136,0.12)]" style={{ aspectRatio: '3/4', maxHeight: '46vh' }}>
      <canvas ref={canvasRef} className="w-full h-full block" style={{ imageRendering: 'auto', touchAction: 'none' }} />
    </div>
  );
}