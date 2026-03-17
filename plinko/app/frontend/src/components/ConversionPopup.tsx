import { useEffect, useState } from 'react';
import { type Translations } from '@/lib/i18n';
import { openLink } from '@/lib/telegram';

interface ConversionPopupProps {
  show: boolean;
  t: Translations;
  onDismiss: () => void;
  referralUrl: string;
}

export default function ConversionPopup({ show, t, onDismiss, referralUrl }: ConversionPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(show);
  }, [show]);

  if (!visible) return null;

  const handleCTA = () => {
    openLink(referralUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" style={{ touchAction: 'manipulation' }}>
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#F59E0B', '#22C55E'];
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${(i * 37 + 13) % 100}%`,
                top: `${-10 - (i % 5) * 4}%`,
                width: 4 + (i % 4) * 2,
                height: (4 + (i % 4) * 2) * 1.5,
                backgroundColor: colors[i % colors.length],
                borderRadius: '2px',
                transform: `rotate(${(i * 47) % 360}deg)`,
                animation: `confetti-fall ${2 + (i % 3)}s ease-in ${(i * 0.1) % 2}s infinite`,
                opacity: 0.8,
              }}
            />
          );
        })}
      </div>

      {/* Popup */}
      <div className="relative max-w-sm w-full mx-4 rounded-3xl overflow-hidden popup-enter">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-amber-400 via-purple-500 to-amber-400 p-[2px]">
          <div className="w-full h-full rounded-3xl bg-[#12082a]" />
        </div>

        <div className="relative z-10 p-6 text-center">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="text-5xl mb-2 animate-bounce" style={{ animationDuration: '2s' }}>🎰</div>

          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 mb-2">
            {t.popupTitle}
          </h2>

          <p className="text-xs text-purple-200/70 mb-2 leading-relaxed">{t.popupBody}</p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
              250 Free Spins
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold">
              500% Bonus
            </span>
          </div>

          <button
            onClick={handleCTA}
            className="w-full py-3.5 rounded-2xl font-black text-lg text-amber-900 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 active:scale-95 transition-all min-h-[48px]"
            style={{ animation: 'cta-pulse 2s ease-in-out infinite' }}
          >
            {t.popupCta}
          </button>

          <button
            onClick={onDismiss}
            className="mt-3 text-xs text-white/20 hover:text-white/40 transition-colors underline underline-offset-2 min-h-[44px]"
          >
            {t.popupDismiss}
          </button>
        </div>
      </div>
    </div>
  );
}