import { useState, useCallback } from 'react';
import { type Translations } from '@/lib/i18n';
import { haptic, hapticSuccess } from '@/lib/telegram';

interface DoubleOrNothingProps {
  show: boolean;
  lastWin: number;
  currency: string;
  t: Translations;
  onResult: (won: boolean, amount: number) => void;
  onDismiss: () => void;
}

export default function DoubleOrNothing({ show, lastWin, currency, t, onResult, onDismiss }: DoubleOrNothingProps) {
  const [phase, setPhase] = useState<'choose' | 'flipping' | 'result'>('choose');
  const [choice, setChoice] = useState<'heads' | 'tails' | null>(null);
  const [won, setWon] = useState(false);
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');

  const handleChoice = useCallback((side: 'heads' | 'tails') => {
    setChoice(side);
    setPhase('flipping');
    haptic('medium');

    // Determine outcome (50/50)
    const result = Math.random() < 0.5 ? 'heads' : 'tails';

    setTimeout(() => {
      setCoinSide(result);
      const isWin = side === result;
      setWon(isWin);
      setPhase('result');
      if (isWin) hapticSuccess();
      else haptic('heavy');

      // Auto-close after showing result
      setTimeout(() => {
        onResult(isWin, isWin ? lastWin : 0);
      }, 1800);
    }, 1200);
  }, [lastWin, onResult]);

  const handleDismiss = useCallback(() => {
    setPhase('choose');
    setChoice(null);
    onDismiss();
  }, [onDismiss]);

  if (!show) return null;

  const C = currency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ touchAction: 'manipulation' }}>
      <div className="relative max-w-xs w-full mx-4 rounded-2xl bg-[#12082a] border border-purple-500/30 p-5 text-center popup-enter shadow-[0_0_60px_rgba(139,92,246,0.2)]">
        {phase === 'choose' && (
          <>
            <div className="text-3xl mb-2">🎲</div>
            <h3 className="text-lg font-black bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent mb-1">
              Double or Nothing?
            </h3>
            <p className="text-sm text-white/50 mb-1">
              {t.lastWin}: <span className="text-amber-400 font-bold">{lastWin} {C}</span>
            </p>
            <p className="text-xs text-white/30 mb-4">
              Win = <span className="text-emerald-400 font-bold">+{lastWin} {C}</span> bonus!
            </p>

            <div className="flex gap-3 mb-3">
              <button
                onClick={() => handleChoice('heads')}
                className="flex-1 py-4 rounded-xl font-black text-base bg-gradient-to-b from-amber-500/30 to-amber-600/20 border border-amber-400/30 text-amber-300 active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
              >
                <div className="text-2xl mb-1">🪙</div>
                <div className="text-xs">Heads</div>
              </button>
              <button
                onClick={() => handleChoice('tails')}
                className="flex-1 py-4 rounded-xl font-black text-base bg-gradient-to-b from-purple-500/30 to-purple-600/20 border border-purple-400/30 text-purple-300 active:scale-95 transition-all hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
              >
                <div className="text-2xl mb-1">⭐</div>
                <div className="text-xs">Tails</div>
              </button>
            </div>

            <button onClick={handleDismiss} className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
              Skip →
            </button>
          </>
        )}

        {phase === 'flipping' && (
          <>
            <div className="text-5xl mb-3 coin-flip">🪙</div>
            <p className="text-sm text-white/50 animate-pulse font-bold">Flipping...</p>
            <p className="text-xs text-white/20 mt-1">
              You chose: {choice === 'heads' ? '🪙 Heads' : '⭐ Tails'}
            </p>
          </>
        )}

        {phase === 'result' && (
          <>
            <div className={`text-5xl mb-2 ${won ? 'animate-bounce' : 'animate-pulse'}`}>
              {won ? '🎉' : '😔'}
            </div>
            <h3 className={`text-xl font-black mb-1 ${won ? 'text-emerald-400' : 'text-red-400'}`}>
              {won ? 'YOU WIN!' : 'No luck!'}
            </h3>
            <p className="text-sm text-white/50">
              Result: {coinSide === 'heads' ? '🪙 Heads' : '⭐ Tails'}
            </p>
            {won && (
              <div className="mt-2 text-lg font-black text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">
                +{lastWin} {C}!
              </div>
            )}
          </>
        )}

        <style>{`
          @keyframes coin-flip-anim {
            0% { transform: rotateY(0deg) scale(1); }
            25% { transform: rotateY(180deg) scale(1.2); }
            50% { transform: rotateY(360deg) scale(1); }
            75% { transform: rotateY(540deg) scale(1.2); }
            100% { transform: rotateY(720deg) scale(1); }
          }
          .coin-flip { animation: coin-flip-anim 1.2s ease-in-out; }
          .popup-enter { animation: scale-in 0.3s ease-out; }
          @keyframes scale-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    </div>
  );
}