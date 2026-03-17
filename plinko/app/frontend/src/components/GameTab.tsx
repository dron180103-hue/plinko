import { useState, useCallback, useEffect, useRef } from 'react';
import { type Translations } from '@/lib/i18n';
import { type RiskLevel } from '@/lib/plinkoEngine';
import { type GameState, getXpForNextLevel, hasBooster, canClaimHourly, getHourlyCooldownRemaining, canSpinWheel, getWheelCooldownRemaining, FORTUNE_WHEEL_PRIZES } from '@/lib/gameStore';
import { haptic } from '@/lib/telegram';

export interface HistoryEntry { id: number; bet: number; multiplier: number; win: number; }

const BET_OPTIONS = [10, 25, 50, 100, 250, 500];
const BALL_COUNT_OPTIONS = [1, 3, 5, 10, 25];
const ROW_OPTIONS = [8, 12, 14, 16] as const;
const RISK_OPTIONS: RiskLevel[] = ['low', 'medium', 'high'];

const WHEEL_COLORS = [
  '#8B5CF6', '#F59E0B', '#EC4899', '#10B981',
  '#3B82F6', '#EF4444', '#A855F7', '#F97316',
];

interface GameTabProps {
  state: GameState;
  t: Translations;
  onTap: () => void;
  onDrop: (bet: number, count: number) => boolean;
  activeBalls: number;
  lastMultiplier: number | null;
  history: HistoryEntry[];
  autoDrop: boolean;
  onToggleAutoDrop: () => void;
  riskLevel: RiskLevel;
  onRiskChange: (r: RiskLevel) => void;
  rows: number;
  onRowsChange: (r: number) => void;
  soundOn: boolean;
  onToggleSound: () => void;
  tapFatigued: boolean;
  onHourlyBonus: () => void;
  onFortuneWheel: () => void;
  showWheel: boolean;
  wheelSpinning: boolean;
  wheelPrize: number | null;
}

// ==================== FORTUNE WHEEL CANVAS ====================
function FortuneWheelCanvas({
  spinning,
  prize,
  onSpinComplete,
  C,
}: {
  spinning: boolean;
  prize: number | null;
  onSpinComplete?: () => void;
  C: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const spinSpeedRef = useRef(0);
  const targetAngleRef = useRef(0);
  const isSpinningRef = useRef(false);
  const animFrameRef = useRef(0);
  const prizeIdxRef = useRef(-1);

  const numSectors = FORTUNE_WHEEL_PRIZES.length;
  const sectorAngle = (2 * Math.PI) / numSectors;

  // Draw the wheel
  const drawWheel = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, angle: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 12;

    ctx.clearRect(0, 0, w, h);

    // Outer glow
    ctx.save();
    ctx.shadowColor = 'rgba(139, 92, 246, 0.4)';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Draw sectors
    for (let i = 0; i < numSectors; i++) {
      const startAngle = angle + i * sectorAngle;
      const endAngle = startAngle + sectorAngle;

      // Sector fill
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, endAngle);
      ctx.closePath();

      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.08)');
      gradient.addColorStop(0.5, WHEEL_COLORS[i]);
      gradient.addColorStop(1, WHEEL_COLORS[i]);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Sector border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Prize text
      const midAngle = startAngle + sectorAngle / 2;
      const textR = radius * 0.65;
      const tx = cx + Math.cos(midAngle) * textR;
      const ty = cy + Math.sin(midAngle) * textR;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(midAngle + Math.PI / 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${FORTUNE_WHEEL_PRIZES[i]}`, 0, -4);
      ctx.font = '9px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText(C, 0, 9);
      ctx.restore();
    }

    // Center circle
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 22);
    centerGrad.addColorStop(0, '#1a0a2e');
    centerGrad.addColorStop(1, '#0a0018');
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center emoji
    ctx.font = '16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎡', cx, cy);

    // Pointer (triangle at top)
    ctx.save();
    ctx.fillStyle = '#F59E0B';
    ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius - 10);
    ctx.lineTo(cx - 10, cy - radius + 6);
    ctx.lineTo(cx + 10, cy - radius + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Decorative dots around the rim
    for (let i = 0; i < numSectors * 3; i++) {
      const dotAngle = (i / (numSectors * 3)) * 2 * Math.PI;
      const dx = cx + Math.cos(dotAngle) * (radius + 7);
      const dy = cy + Math.sin(dotAngle) * (radius + 7);
      ctx.beginPath();
      ctx.arc(dx, dy, 2, 0, 2 * Math.PI);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(245,158,11,0.6)' : 'rgba(139,92,246,0.5)';
      ctx.fill();
    }
  }, [numSectors, sectorAngle, C]);

  // Start spinning animation
  useEffect(() => {
    if (!spinning) return;
    isSpinningRef.current = true;
    // Pick the winning sector index
    const prizeIdx = FORTUNE_WHEEL_PRIZES.indexOf(prize ?? FORTUNE_WHEEL_PRIZES[0]);
    prizeIdxRef.current = prizeIdx >= 0 ? prizeIdx : 0;

    // Calculate target angle: the pointer is at top (-PI/2), we need the winning sector centered there
    // Sector i starts at angle + i * sectorAngle. For it to be at top:
    // angle + i * sectorAngle + sectorAngle/2 = -PI/2 (mod 2PI)
    // So target angle = -PI/2 - i * sectorAngle - sectorAngle/2
    const winAngle = -Math.PI / 2 - prizeIdxRef.current * sectorAngle - sectorAngle / 2;
    // Add multiple full rotations for dramatic effect
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    targetAngleRef.current = winAngle - fullSpins * 2 * Math.PI;
    spinSpeedRef.current = 0.35; // Initial speed
  }, [spinning, prize, sectorAngle]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayW = canvas.clientWidth;
    const displayH = canvas.clientHeight;
    canvas.width = displayW * dpr;
    canvas.height = displayH * dpr;
    ctx.scale(dpr, dpr);

    const animate = () => {
      if (isSpinningRef.current) {
        const diff = targetAngleRef.current - angleRef.current;
        // Ease-out deceleration
        const speed = Math.max(0.002, Math.abs(diff) * 0.04);
        angleRef.current += diff > 0 ? speed : -speed;

        if (Math.abs(diff) < 0.005) {
          angleRef.current = targetAngleRef.current;
          isSpinningRef.current = false;
          onSpinComplete?.();
        }
      }

      drawWheel(ctx, displayW, displayH, angleRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [drawWheel, onSpinComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full aspect-square max-w-[220px] mx-auto"
      style={{ imageRendering: 'auto' }}
    />
  );
}

// ==================== MAIN GAME TAB ====================
export default function GameTab({
  state, t, onTap, onDrop, activeBalls, lastMultiplier,
  autoDrop, onToggleAutoDrop, riskLevel, onRiskChange, rows, onRowsChange,
  soundOn, onToggleSound, tapFatigued, onHourlyBonus, onFortuneWheel,
  showWheel, wheelSpinning, wheelPrize,
}: GameTabProps) {
  const [tapPulse, setTapPulse] = useState(false);
  const [dropPulse, setDropPulse] = useState(false);
  const [showError, setShowError] = useState(false);
  const [betIndex, setBetIndex] = useState(0);
  const [ballCountIndex, setBallCountIndex] = useState(0);
  const [balanceAnim, setBalanceAnim] = useState(state.balance);
  const [wheelDone, setWheelDone] = useState(false);
  const prevBalanceRef = useRef(state.balance);

  const currentBet = BET_OPTIONS[betIndex];
  const ballCount = BALL_COUNT_OPTIONS[ballCountIndex];
  const hasDiscount = hasBooster(state, 'multi_discount');
  const discountMult = hasDiscount && ballCount > 1 ? 0.8 : 1;
  const totalCost = Math.floor(currentBet * ballCount * discountMult);
  const canDrop = state.balance >= totalCost;
  const xpNeeded = getXpForNextLevel(state.level);
  const xpPercent = Math.min(100, (state.xp / xpNeeded) * 100);
  const hourlyAvailable = canClaimHourly(state);
  const wheelAvailable = canSpinWheel(state);
  const C = t.currency;

  // Reset wheelDone when wheel closes
  useEffect(() => {
    if (!showWheel) setWheelDone(false);
  }, [showWheel]);

  // Smooth balance counter animation
  useEffect(() => {
    const prev = prevBalanceRef.current;
    const target = state.balance;
    prevBalanceRef.current = target;
    if (Math.abs(target - prev) < 2) {
      setBalanceAnim(target);
      return;
    }
    const diff = target - prev;
    const steps = Math.min(20, Math.abs(Math.floor(diff)));
    if (steps <= 1) { setBalanceAnim(target); return; }
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const progress = step / steps;
      const eased = 1 - Math.pow(1 - progress, 3);
      setBalanceAnim(Math.floor(prev + diff * eased));
      if (step >= steps) { clearInterval(iv); setBalanceAnim(target); }
    }, 16);
    return () => clearInterval(iv);
  }, [state.balance]);

  const riskColors: Record<RiskLevel, string> = {
    low: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400',
    medium: 'bg-amber-500/20 border-amber-500/40 text-amber-400',
    high: 'bg-red-500/20 border-red-500/40 text-red-400',
  };
  const riskLabels: Record<RiskLevel, string> = { low: t.riskLow, medium: t.riskMed, high: t.riskHigh };

  const formatCooldown = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const handleTap = useCallback(() => {
    onTap();
    haptic('light');
    setTapPulse(true);
    setTimeout(() => setTapPulse(false), 150);
  }, [onTap]);

  const handleDrop = useCallback(() => {
    const success = onDrop(currentBet, ballCount);
    if (success) {
      haptic('medium');
      setDropPulse(true);
      setTimeout(() => setDropPulse(false), 200);
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 1500);
    }
  }, [onDrop, currentBet, ballCount]);

  const balanceDelta = state.balance - prevBalanceRef.current;
  const balanceGlow = balanceDelta > 50 ? 'drop-shadow(0_0_12px_rgba(245,158,11,0.4))' : balanceDelta < -50 ? 'drop-shadow(0_0_8px_rgba(239,68,68,0.3))' : '';

  return (
    <div className="flex flex-col gap-1.5 lg:gap-2" style={{ touchAction: 'manipulation' }}>
      {/* Balance + Level + Bonuses */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div
            className="text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 tabular-nums leading-tight transition-all duration-300"
            style={{ filter: balanceGlow }}
          >
            {Math.floor(balanceAnim).toLocaleString()} {C}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] lg:text-[11px] text-purple-300 font-bold">
              {state.prestigeLevel > 0 && <span className="text-amber-400">{'⭐'.repeat(Math.min(state.prestigeLevel, 3))} </span>}
              Lv.{state.level}
            </span>
            <div className="flex-1 h-1.5 lg:h-2 rounded-full bg-white/[0.06] overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-purple-400 to-amber-400 transition-all duration-700 ease-out relative"
                style={{ width: `${xpPercent}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            {state.comboCount > 1 && (
              <span className="text-[9px] font-bold text-amber-400 animate-pulse flex items-center gap-0.5">
                🔥<span className="text-amber-300">x{state.comboCount}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {hourlyAvailable ? (
            <button onClick={onHourlyBonus} className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl text-sm bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 animate-pulse active:scale-90 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)] transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              🎰
            </button>
          ) : (
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl text-[7px] bg-white/[0.02] border border-white/[0.04] text-white/15 flex items-center justify-center">
              {formatCooldown(getHourlyCooldownRemaining(state))}
            </div>
          )}
          {wheelAvailable ? (
            <button onClick={onFortuneWheel} className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl text-sm bg-amber-500/20 border border-amber-500/30 text-amber-400 animate-pulse active:scale-90 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)] transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              🎡
            </button>
          ) : (
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl text-[7px] bg-white/[0.02] border border-white/[0.04] text-white/15 flex items-center justify-center">
              {formatCooldown(getWheelCooldownRemaining(state))}
            </div>
          )}
        </div>
      </div>

      {/* Fortune Wheel Modal */}
      {showWheel && (
        <div className={`rounded-xl border p-3 text-center backdrop-blur-sm transition-all duration-500 ${wheelDone ? 'bg-gradient-to-b from-amber-500/25 to-amber-600/15 border-amber-400/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : 'bg-gradient-to-b from-purple-500/15 to-amber-500/10 border-purple-400/20'}`}>
          <div className="text-sm font-black text-amber-400 mb-2">🎡 {t.fortuneWheel}</div>
          <FortuneWheelCanvas
            spinning={wheelSpinning}
            prize={wheelPrize}
            onSpinComplete={() => setWheelDone(true)}
            C={C}
          />
          {wheelDone && wheelPrize !== null ? (
            <div className="flex flex-col items-center gap-1 mt-2 animate-bounce">
              <div className="text-2xl">🎉</div>
              <div className="text-xl font-black text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">+{wheelPrize} {C}!</div>
            </div>
          ) : wheelSpinning ? (
            <div className="text-[10px] text-amber-400/60 font-bold animate-pulse mt-2">{t.fortuneWheel}...</div>
          ) : null}
        </div>
      )}

      {/* Risk + Rows + Sound */}
      <div className="flex items-center gap-0.5 lg:gap-1 flex-wrap justify-center">
        {RISK_OPTIONS.map(r => (
          <button key={r} onClick={() => onRiskChange(r)}
            className={`px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold border transition-all duration-200 active:scale-90 ${riskLevel === r ? riskColors[r] + ' shadow-sm' : 'bg-white/[0.02] border-white/[0.05] text-white/20 hover:bg-white/[0.04]'}`}>
            {riskLabels[r]}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        {ROW_OPTIONS.map(r => (
          <button key={r} onClick={() => onRowsChange(r)}
            className={`px-1.5 py-1 lg:px-2 lg:py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold border transition-all duration-200 active:scale-90 ${rows === r ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' : 'bg-white/[0.02] border-white/[0.05] text-white/20 hover:bg-white/[0.04]'}`}>
            {r}
          </button>
        ))}
        <div className="w-px h-4 bg-white/10 mx-0.5" />
        <button onClick={onToggleSound}
          className={`px-1.5 py-1 lg:px-2 lg:py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold border transition-all duration-200 active:scale-90 ${soundOn ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' : 'bg-white/[0.02] border-white/[0.05] text-white/20 hover:bg-white/[0.04]'}`}>
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {showError && (
        <div className="text-center text-red-400 text-[10px] font-bold animate-pulse bg-red-500/5 rounded-lg py-1 border border-red-500/10">
          ⚠️ {t.notEnoughCoins}
        </div>
      )}

      {/* Bet selector */}
      <div className="flex items-center justify-center gap-1 lg:gap-2">
        <button onClick={() => setBetIndex(Math.max(0, betIndex - 1))} disabled={betIndex <= 0}
          className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl font-black text-sm lg:text-base flex items-center justify-center transition-all duration-200 active:scale-90 ${betIndex > 0 ? 'bg-purple-600/30 border border-purple-400/30 text-purple-200 hover:bg-purple-600/40' : 'bg-white/[0.03] border border-white/[0.05] text-white/15'}`}>−</button>
        <div className="min-w-[65px] lg:min-w-[85px] text-center px-3 py-1.5 lg:py-2 rounded-xl bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-400/25 shadow-[0_0_8px_rgba(245,158,11,0.1)]">
          <span className="text-base lg:text-lg font-black text-amber-300 tabular-nums">{currentBet}</span>
          <span className="text-[7px] lg:text-[9px] text-amber-400/40 ml-0.5">{C}</span>
        </div>
        <button onClick={() => setBetIndex(Math.min(BET_OPTIONS.length - 1, betIndex + 1))} disabled={betIndex >= BET_OPTIONS.length - 1}
          className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl font-black text-sm lg:text-base flex items-center justify-center transition-all duration-200 active:scale-90 ${betIndex < BET_OPTIONS.length - 1 ? 'bg-purple-600/30 border border-purple-400/30 text-purple-200 hover:bg-purple-600/40' : 'bg-white/[0.03] border border-white/[0.05] text-white/15'}`}>+</button>
        <div className="w-px h-5 bg-white/10" />
        <button onClick={() => setBetIndex(0)} className="px-1.5 py-1 lg:px-2 lg:py-1.5 rounded-lg text-[8px] lg:text-[10px] font-bold bg-white/[0.03] border border-white/[0.05] text-white/25 active:scale-90 hover:bg-white/[0.06] transition-all">MIN</button>
        <button onClick={() => { const maxIdx = BET_OPTIONS.findIndex(b => b > state.balance); setBetIndex(maxIdx > 0 ? maxIdx - 1 : BET_OPTIONS.length - 1); }}
          className="px-1.5 py-1 lg:px-2 lg:py-1.5 rounded-lg text-[8px] lg:text-[10px] font-bold bg-red-500/15 border border-red-500/20 text-red-400 active:scale-90 hover:bg-red-500/20 transition-all">{t.maxBet}</button>
      </div>

      {/* Ball count + auto */}
      <div className="flex items-center justify-center gap-0.5 lg:gap-1">
        <span className="text-[9px] text-white/30 font-semibold mr-0.5">🎱</span>
        {BALL_COUNT_OPTIONS.map((cnt, i) => (
          <button key={cnt} onClick={() => setBallCountIndex(i)}
            className={`px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold border transition-all duration-200 active:scale-90 ${ballCountIndex === i ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' : 'bg-white/[0.02] border-white/[0.05] text-white/20 hover:bg-white/[0.04]'}`}>
            {cnt}
          </button>
        ))}
        <button onClick={onToggleAutoDrop}
          className={`ml-0.5 px-2.5 py-1 lg:px-3 lg:py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold transition-all duration-200 active:scale-90 ${autoDrop ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]' : 'bg-white/[0.03] border border-white/[0.06] text-white/25 hover:bg-white/[0.05]'}`}>
          {t.autoDrop} {autoDrop ? '⏸' : '▶'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={handleTap}
          className={`flex-1 relative py-2.5 lg:py-3 rounded-2xl font-black text-sm lg:text-base bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800 border border-purple-400/30 text-white active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] overflow-hidden ${tapPulse ? 'scale-95 brightness-125' : ''} ${tapFatigued ? 'opacity-50' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" style={{ animation: 'shimmer 3s ease-in-out infinite' }} />
          <span className="relative z-10">👆 {t.tapToEarn}</span>
          <div className="relative z-10 text-[7px] lg:text-[9px] font-semibold text-purple-200/40 mt-0.5">{tapFatigued ? t.tapFatigue : t.tapHint}</div>
        </button>
        <button onClick={handleDrop} disabled={!canDrop}
          className={`flex-[1.5] relative py-2.5 lg:py-3 rounded-2xl font-black text-sm lg:text-base transition-all active:scale-95 overflow-hidden ${canDrop ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border border-amber-300/40 text-amber-900 shadow-[0_0_25px_rgba(245,158,11,0.3)]' : 'bg-gradient-to-b from-gray-600 to-gray-800 border border-gray-500/20 text-gray-400 opacity-50'} ${dropPulse ? 'scale-95 brightness-125' : ''}`}>
          {canDrop && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />}
          <span className="relative z-10">{ballCount > 1 ? t.dropMulti.replace('{n}', String(ballCount)) : t.dropBall}</span>
          <div className={`relative z-10 text-[7px] lg:text-[9px] font-semibold mt-0.5 ${canDrop ? 'text-amber-800/50' : 'text-gray-500'}`}>−{totalCost}{C}</div>
        </button>
      </div>

      {/* Last multiplier + active balls */}
      {(lastMultiplier !== null || activeBalls > 0) && (
        <div className="flex items-center justify-center gap-3 text-[10px] lg:text-xs">
          {lastMultiplier !== null && (
            <span className={`font-bold px-2 py-0.5 rounded-md transition-all duration-300 ${lastMultiplier >= 5 ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : lastMultiplier >= 3 ? 'text-yellow-400 bg-yellow-500/10' : lastMultiplier >= 1 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
              {lastMultiplier}x 🎯
            </span>
          )}
          {activeBalls > 0 && (
            <span className="text-amber-400 font-bold animate-pulse">{activeBalls} 🎱</span>
          )}
        </div>
      )}

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}