import { type Translations } from '@/lib/i18n';
import { openLink } from '@/lib/telegram';

interface BankruptPopupProps {
  show: boolean;
  t: Translations;
  referralUrl: string;
  onDismiss: () => void;
}

export default function BankruptPopup({ show, t, referralUrl, onDismiss }: BankruptPopupProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md" style={{ touchAction: 'manipulation' }}>
      <div className="relative max-w-sm w-full mx-4 rounded-3xl overflow-hidden popup-enter">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-red-500 via-amber-500 to-red-500 p-[2px]">
          <div className="w-full h-full rounded-3xl bg-[#12082a]" />
        </div>

        <div className="relative z-10 p-6 text-center">
          <div className="text-5xl mb-3">💸</div>

          <h2 className="text-xl font-black text-red-400 mb-2">{t.bankruptTitle}</h2>
          <p className="text-sm text-purple-200/70 mb-5 leading-relaxed">{t.bankruptBody}</p>

          <button
            onClick={() => openLink(referralUrl)}
            className="w-full py-3.5 rounded-2xl font-black text-lg text-amber-900 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 active:scale-95 transition-all min-h-[48px]"
            style={{ animation: 'cta-pulse 2s ease-in-out infinite' }}
          >
            {t.bankruptCta}
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