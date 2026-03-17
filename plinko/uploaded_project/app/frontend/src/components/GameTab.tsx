import { useState, useCallback } from 'react';
import { type Translations } from '@/lib/i18n';
import { type RiskLevel } from '@/lib/plinkoEngine';
import { type GameState, getXpForNextLevel, hasBooster, canClaimHourly, getHourlyCooldownRemaining, canSpinWheel, getWheelCooldownRemaining, FORTUNE_WHEEL_PRIZES } from '@/lib/gameStore';
import { haptic } from '@/lib/telegram';

export interface HistoryEntry { id: number; bet: number; multiplier: number; win: number; }

const BET_OPTIONS = [10, 25, 50, 100, 250, 500];
const BALL_COUNT_OPTIONS = [1, 3, 5, 10, 25];
const ROW_OPTIONS = [8, 12, 14, 16] as const;
const RISK_OPTIONS: RiskLevel[] = ['low', 'medium', 'high'];

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

export default function GameTab({
  state, t, onTap, onDrop, activeBalls, lastMultiplier, history,
  autoDrop, onToggleAutoDrop, riskLevel, onRiskChange, rows, onRowsChange,
  soundOn, onToggleSound, tapFatigued, onHourlyBonus, onFortuneWheel,
  showWheel, wheelSpinning, wheelPrize,
}: GameTabProps) {
  const [tapPulse, setTapPulse] = useState(false);
  const [dropPulse, setDropPulse] = useState(false);
  const [showError, setShowError] = useState(false);
  const [betIndex, setBetIndex] = useState(0);
  const [ballCountIndex, setBallCountIndex] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

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

  const getMultColor = (mult: number) => {
    if (mult >= 5) return 'text-amber-400';
    if (mult >= 3) return 'text-yellow-400';
    if (mult >= 1.5) return 'text-emerald-400';
    if (mult >= 1) return 'text-blue-400';
    return 'text-red-400';
  };

  const riskColors: Record<RiskLevel, string> = {
    low: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    medium: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
    high: 'bg-red-500/20 border-red-500/30 text-red-400',
  };
  const riskLabels: Record<RiskLevel, string> = { low: t.riskLow, medium: t.riskMed, high: t.riskHigh };

  const formatCooldown = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-1.5" style={{ touchAction: 'manipulation' }}>
      {/* Balance + Level */}
      <div className="text-center">
        <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 tabular-nums animate-balance">
          {Math.floor(state.balance).toLocaleString()}
        </div>
        <div className="text-[9px] text-purple-300/40 font-semibold tracking-wider uppercase">🪙 {t.demoCoins}</div>
        {/* Level + Prestige */}
        <div className="mt-1 mx-auto max-w-[220px]">
          <div className="flex items-center justify-between text-[9px] mb-0.5">
            <span className="text-purple-300 font-bold">
              {state.prestigeLevel > 0 && <span className="text-amber-400">{'⭐'.repeat(Math.min(state.prestigeLevel, 5))} </span>}
              {t.level} {state.level}
            </span>
            <span className="text-white/20 tabular-nums">{state.xp}/{xpNeeded}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500" style={{ width: `${xpPercent}%` }} />
          </div>
        </div>
        {state.comboCount > 1 && (
          <div className="mt-0.5 text-[10px] font-bold text-amber-400 animate-pulse">🔥 {t.combo} x{state.comboCount}</div>
        )}
      </div>

      {/* Bonuses row */}
      <div className="flex gap-1 justify-center">
        {hourlyAvailable ? (
          <button onClick={onHourlyBonus} className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 animate-pulse active:scale-95">
            🎰 {t.hourlyBonus.replace('!', '')}
          </button>
        ) : (
          <div className="px-2 py-1 rounded-lg text-[8px] font-bold bg-white/[0.02] border border-white/[0.04] text-white/15">
            🎰 {formatCooldown(getHourlyCooldownRemaining(state))}
          </div>
        )}
        {wheelAvailable ? (
          <button onClick={onFortuneWheel} className="px-2 py-1 rounded-lg text-[9px] font-bold bg-amber-500/20 border border-amber-500/30 text-amber-400 animate-pulse active:scale-95">
            🎡 {t.spin}
          </button>
        ) : (
          <div className="px-2 py-1 rounded-lg text-[8px] font-bold bg-white/[0.02] border border-white/[0.04] text-white/15">
            🎡 {formatCooldown(getWheelCooldownRemaining(state))}
          </div>
        )}
      </div>

      {/* Fortune Wheel Modal */}
      {showWheel && (
        <div className="rounded-xl bg-gradient-to-b from-purple-500/15 to-amber-500/10 border border-purple-400/20 p-3 text-center">
          <div className="text-base font-black text-amber-400 mb-2">{t.fortuneWheel}</div>
          <div className="flex flex-wrap gap-1 justify-center mb-2">
            {FORTUNE_WHEEL_PRIZES.map((prize, i) => (
              <div key={i} className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${wheelPrize !== null && FORTUNE_WHEEL_PRIZES[wheelPrize === prize ? i : -1] === prize && !wheelSpinning ? 'bg-amber-500/30 border-amber-400/50 text-amber-300 scale-110' : 'bg-white/[0.03] border-white/[0.06] text-white/30'}`}>
                {prize}🪙
              </div>
            ))}
          </div>
          {wheelSpinning ? (
            <div className="text-amber-400 font-bold animate-spin text-2xl">🎡</div>
          ) : wheelPrize !== null ? (
            <div className="text-lg font-black text-amber-400">+{wheelPrize} 🪙!</div>
          ) : null}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center justify-center gap-1.5 text-[9px]">
        <div className="text-center px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="text-white/25">{t.totalDrops}</div>
          <div className="text-purple-300 font-bold tabular-nums">{state.totalDrops}</div>
        </div>
        <div className="text-center px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="text-white/25">{t.biggestWin}</div>
          <div className="text-amber-400 font-bold tabular-nums">{Math.floor(state.biggestWin)}</div>
        </div>
        <div className="text-center px-2 py-0.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
          <div className="text-white/25">{t.totalWon}</div>
          <div className="text-emerald-400 font-bold tabular-nums">{Math.floor(state.totalWon)}</div>
        </div>
        {activeBalls > 0 && (
          <div className="text-center px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="text-amber-400 font-bold animate-pulse">{activeBalls} 🎱</div>
          </div>
        )}
      </div>

      {/* Risk + Rows + Sound */}
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {RISK_OPTIONS.map(r => (
          <button key={r} onClick={() => onRiskChange(r)}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${riskLevel === r ? riskColors[r] : 'bg-white/[0.02] border-white/[0.05] text-white/20'}`}>
            {riskLabels[r]}
          </button>
        ))}
        <div className="w-px h-3 bg-white/10" />
        {ROW_OPTIONS.map(r => (
          <button key={r} onClick={() => onRowsChange(r)}
            className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${rows === r ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' : 'bg-white/[0.02] border-white/[0.05] text-white/20'}`}>
            {r}
          </button>
        ))}
        <div className="w-px h-3 bg-white/10" />
        <button onClick={onToggleSound}
          className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${soundOn ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' : 'bg-white/[0.02] border-white/[0.05] text-white/20'}`}>
          {soundOn ? '🔊' : '🔇'}
        </button>
      </div>

      {showError && <div className="text-center text-red-400 text-xs font-bold animate-pulse">⚠️ {t.notEnoughCoins}</div>}

      {/* Bet + Ball Count */}
      <div className="flex items-center justify-center gap-1.5">
        <span className="text-[9px] text-white/30 font-semibold">{t.bet}:</span>
        <button onClick={() => setBetIndex(Math.max(0, betIndex - 1))} disabled={betIndex <= 0}
          className={`w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center transition-all ${betIndex > 0 ? 'bg-purple-600/40 border border-purple-400/30 text-purple-200 active:scale-90' : 'bg-white/[0.03] border border-white/[0.05] text-white/15'}`}>−</button>
        <div className="min-w-[50px] text-center px-2 py-0.5 rounded-lg bg-gradient-to-b from-amber-500/20 to-amber-600/10 border border-amber-400/25">
          <span className="text-sm font-black text-amber-300 tabular-nums">{currentBet}</span>
        </div>
        <button onClick={() => setBetIndex(Math.min(BET_OPTIONS.length - 1, betIndex + 1))} disabled={betIndex >= BET_OPTIONS.length - 1}
          className={`w-7 h-7 rounded-lg font-black text-sm flex items-center justify-center transition-all ${betIndex < BET_OPTIONS.length - 1 ? 'bg-purple-600/40 border border-purple-400/30 text-purple-200 active:scale-90' : 'bg-white/[0.03] border border-white/[0.05] text-white/15'}`}>+</button>

        <div className="w-px h-5 bg-white/10" />

        {/* Quick bet buttons */}
        <button onClick={() => setBetIndex(Math.max(0, betIndex - 1))} className="px-1.5 py-0.5 rounded-lg text-[8px] font-bold bg-white/[0.03] border border-white/[0.05] text-white/25 active:scale-90">{t.halfBet}</button>
        <button onClick={() => setBetIndex(Math.min(BET_OPTIONS.length - 1, betIndex + 1))} className="px-1.5 py-0.5 rounded-lg text-[8px] font-bold bg-white/[0.03] border border-white/[0.05] text-white/25 active:scale-90">{t.doubleBet}</button>
        <button onClick={() => { const maxIdx = BET_OPTIONS.findIndex(b => b > state.balance); setBetIndex(maxIdx > 0 ? maxIdx - 1 : BET_OPTIONS.length - 1); }}
          className="px-1.5 py-0.5 rounded-lg text-[8px] font-bold bg-red-500/15 border border-red-500/20 text-red-400 active:scale-90">{t.maxBet}</button>
      </div>

      {/* Ball count selector */}
      <div className="flex items-center justify-center gap-1">
        <span className="text-[9px] text-white/30 font-semibold">🎱:</span>
        {BALL_COUNT_OPTIONS.map((cnt, i) => (
          <button key={cnt} onClick={() => setBallCountIndex(i)}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all ${ballCountIndex === i ? 'bg-purple-500/20 border-purple-400/30 text-purple-300' : 'bg-white/[0.02] border-white/[0.05] text-white/20'}`}>
            {cnt}
          </button>
        ))}
        <button onClick={onToggleAutoDrop}
          className={`ml-1 px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${autoDrop ? 'bg-emerald-500/30 border border-emerald-400/40 text-emerald-300' : 'bg-white/[0.03] border border-white/[0.06] text-white/25'}`}>
          {t.autoDrop} {autoDrop ? '⏸' : '▶'}
        </button>
      </div>

      {/* Total cost */}
      {ballCount > 1 && (
        <div className="text-center text-[9px] text-white/25">
          {t.totalCost}: <span className="text-amber-400 font-bold">{totalCost}🪙</span>
          {hasDiscount && <span className="text-emerald-400 ml-1">(-20%)</span>}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button onClick={handleTap}
          className={`flex-1 relative py-2 rounded-2xl font-black text-sm min-h-[44px] bg-gradient-to-b from-purple-500 via-purple-600 to-purple-800 border border-purple-400/30 text-white active:scale-95 transition-all ${tapPulse ? 'scale-95 brightness-125' : ''} ${tapFatigued ? 'opacity-50' : ''}`}>
          <span>👆 {t.tapToEarn}</span>
          <div className="text-[7px] font-semibold text-purple-200/40 mt-0.5">{tapFatigued ? t.tapFatigue : t.tapHint}</div>
        </button>
        <button onClick={handleDrop} disabled={!canDrop}
          className={`flex-[1.4] relative py-2 rounded-2xl font-black text-sm min-h-[44px] transition-all active:scale-95 ${canDrop ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 border border-amber-300/40 text-amber-900' : 'bg-gradient-to-b from-gray-600 to-gray-800 border border-gray-500/20 text-gray-400 opacity-50'} ${dropPulse ? 'scale-95 brightness-125' : ''}`}>
          <span>{ballCount > 1 ? t.dropMulti.replace('{n}', String(ballCount)) : t.dropBall}</span>
          <div className={`text-[7px] font-semibold mt-0.5 ${canDrop ? 'text-amber-800/50' : 'text-gray-500'}`}>−{totalCost}🪙</div>
        </button>
      </div>

      {/* Last multiplier + history toggle */}
      <div className="flex items-center justify-between">
        {lastMultiplier !== null && (
          <span className={`text-xs font-bold ${getMultColor(lastMultiplier)}`}>{lastMultiplier}x 🎯</span>
        )}
        <button onClick={() => setShowHistory(!showHistory)} className="text-[9px] text-white/20 hover:text-white/40">
          {showHistory ? '▲' : '▼'} {t.game === 'Игра' ? 'История' : t.game === 'Гра' ? 'Історія' : 'History'}
        </button>
      </div>

      {/* History */}
      {showHistory && history.length > 0 && (
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-1.5 max-h-20 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            {history.slice().reverse().slice(0, 10).map(entry => (
              <div key={entry.id} className="flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded bg-white/[0.02]">
                <span className="text-white/20">#{entry.id}</span>
                <span className="text-white/30">{entry.bet}🪙</span>
                <span className={`font-bold ${getMultColor(entry.multiplier)}`}>{entry.multiplier}x</span>
                <span className={`font-bold ${entry.win >= entry.bet ? 'text-emerald-400' : 'text-red-400'}`}>
                  {entry.win >= entry.bet ? '+' : ''}{Math.floor(entry.win - entry.bet)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}