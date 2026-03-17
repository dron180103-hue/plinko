import { useState, useEffect } from 'react';
import { type Translations } from '@/lib/i18n';
import { openLink } from '@/lib/telegram';

const DAILY_OFFER_KEY = 'plinko_daily_offer_date';

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function shouldShowDailyOffer(): boolean {
  const last = localStorage.getItem(DAILY_OFFER_KEY);
  return last !== todayStr();
}

export function markDailyOfferSeen(): void {
  localStorage.setItem(DAILY_OFFER_KEY, todayStr());
}

interface DailyOfferProps {
  show: boolean;
  t: Translations;
  referralUrl: string;
  onClose: () => void;
}

export default function DailyOffer({ show, t, referralUrl, onClose }: DailyOfferProps) {
  const [countdown, setCountdown] = useState(3);
  const [canClose, setCanClose] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(59);
  const [timerSeconds, setTimerSeconds] = useState(59);

  useEffect(() => {
    if (!show) return;
    setCountdown(3);
    setCanClose(false);
    const iv = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setCanClose(true);
          clearInterval(iv);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const iv = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 0) {
          setTimerMinutes(m => Math.max(0, m - 1));
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [show]);

  if (!show) return null;

  const C = t.currency;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ touchAction: 'manipulation' }}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-amber-400/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float-particle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-sm w-full mx-4 animate-scale-in">
        <div className="rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_60px_rgba(245,158,11,0.3)]">
          <div className="relative bg-gradient-to-br from-amber-600 via-orange-500 to-red-600 p-6 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
            <div className="relative">
              <div className="text-5xl mb-2 animate-bounce" style={{ animationDuration: '2s' }}>💎</div>
              <h2 className="text-2xl font-black text-white drop-shadow-lg">{t.dailyOfferTitle}</h2>
              <p className="text-sm font-bold text-amber-100/80 mt-1">{t.dailyOfferSubtitle}</p>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#1a0a2e] to-[#0d0520] p-5 text-center">
            <p className="text-white/70 text-sm mb-4">{t.dailyOfferBody}</p>

            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-white/30 line-through text-lg">{t.dailyOfferOldPrice}</span>
              <span className="text-3xl font-black text-amber-400 animate-pulse">{t.dailyOfferPrice}</span>
            </div>

            <div className="flex justify-center gap-2 mb-4">
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold">
                💰 10,000 {C}
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/25 text-purple-400 text-xs font-bold">
                👑 VIP 24h
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
                🎡 x5 Spins
              </div>
            </div>

            <div className="mb-4">
              <p className="text-[10px] text-white/30 mb-1">{t.dailyOfferTimer}</p>
              <div className="flex justify-center gap-1">
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-1.5">
                  <span className="text-lg font-black text-red-400 tabular-nums">
                    {String(timerMinutes).padStart(2, '0')}:{String(timerSeconds).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => { openLink(referralUrl); onClose(); }}
              className="w-full py-4 rounded-2xl font-black text-base text-white bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 active:scale-95 transition-all relative overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.4)] min-h-[52px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2s ease-in-out infinite' }} />
              <span className="relative z-10">{t.dailyOfferCta}</span>
            </button>

            {canClose ? (
              <button onClick={onClose} className="mt-3 text-white/20 text-xs hover:text-white/40 transition-colors">
                {t.dailyOfferClose}
              </button>
            ) : (
              <p className="mt-3 text-white/15 text-xs">{countdown}...</p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes scale-in {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in { animation: scale-in 0.4s ease-out; }
      `}</style>
    </div>
  );
}