import { useState } from 'react';
import { toast } from 'sonner';
import { type Translations, getReferralUrl, saveReferralUrl, getRtp, saveRtp, getAdminTgId, setAdminTgId, getAdminPin, setAdminPin } from '@/lib/i18n';
import { getTelegramUserId } from '@/lib/telegram';

interface SettingsPanelProps {
  show: boolean;
  onClose: () => void;
  t: Translations;
  onRtpChange: (rtp: number) => void;
}

export default function SettingsPanel({ show, onClose, t, onRtpChange }: SettingsPanelProps) {
  const [url, setUrl] = useState(getReferralUrl);
  const [rtp, setRtp] = useState(getRtp);
  const [adminIdInput, setAdminIdInput] = useState(String(getAdminTgId() || ''));
  const [pinInput, setPinInput] = useState(getAdminPin() || '');
  const [pinEntry, setPinEntry] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  if (!show) return null;

  const currentTgId = getTelegramUserId();
  const savedAdminId = getAdminTgId();
  const savedPin = getAdminPin();

  const isAdmin = (() => {
    if (authenticated) return true;
    if (!savedAdminId && !savedPin) return true;
    if (currentTgId && savedAdminId && currentTgId === savedAdminId) return true;
    return false;
  })();

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" style={{ touchAction: 'manipulation' }}>
        <div className="relative max-w-xs w-full mx-4 rounded-2xl border border-red-500/30 bg-[#12082a] p-5">
          <div className="text-center mb-4">
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="text-base font-black text-white">{t.settingsTitle}</h3>
            <p className="text-xs text-white/30 mt-1">{t.enterPin}</p>
          </div>
          <input
            type="password"
            maxLength={6}
            value={pinEntry}
            onChange={e => setPinEntry(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-center text-2xl tracking-[0.5em] font-mono placeholder:text-white/15 focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex gap-2 mt-4">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-white/[0.05] border border-white/[0.08] text-white/40">
              {t.close}
            </button>
            <button
              onClick={() => {
                if (savedPin && pinEntry === savedPin) {
                  setAuthenticated(true);
                } else {
                  toast.error('Wrong PIN');
                  setPinEntry('');
                }
              }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-purple-600 border border-purple-400/30 text-white"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    const trimmed = url.trim();
    if (trimmed) saveReferralUrl(trimmed);
    saveRtp(rtp);
    onRtpChange(rtp);
    const newAdminId = parseInt(adminIdInput, 10);
    if (newAdminId > 0) setAdminTgId(newAdminId);
    else if (currentTgId) setAdminTgId(currentTgId);
    if (pinInput.length >= 4) setAdminPin(pinInput);
    toast.success(t.saved);
  };

  if (!savedAdminId && currentTgId) {
    setAdminTgId(currentTgId);
    setAdminIdInput(String(currentTgId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm" style={{ touchAction: 'manipulation' }}>
      <div className="relative max-w-sm w-full mx-4 rounded-2xl border border-purple-500/30 bg-[#12082a]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
          <h3 className="text-base font-black text-white">{t.settingsTitle}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 flex items-center justify-center text-sm">
            ✕
          </button>
        </div>
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-[10px] font-bold text-white/40 mb-1">{t.referralLink}</label>
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://your-link.com"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/40" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 mb-1">
              {t.rtp}: <span className="text-amber-400">{rtp}%</span>
            </label>
            <input type="range" min={50} max={95} value={rtp} onChange={e => setRtp(parseInt(e.target.value, 10))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, #EF4444 0%, #F59E0B ${((rtp - 50) / 45) * 100}%, #333 ${((rtp - 50) / 45) * 100}%, #333 100%)` }} />
            <div className="flex justify-between text-[9px] text-white/20 mt-0.5">
              <span>50%</span><span>95%</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 mb-1">{t.adminId}</label>
            <input type="text" value={adminIdInput} onChange={e => setAdminIdInput(e.target.value.replace(/\D/g, ''))} placeholder="Telegram User ID"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/40" />
            {currentTgId && <p className="text-[9px] text-white/20 mt-0.5">Current TG ID: {currentTgId}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/40 mb-1">{t.adminPin}</label>
            <input type="text" value={pinInput} onChange={e => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="4-6 digits"
              className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm font-mono tracking-widest placeholder:text-white/20 focus:outline-none focus:border-purple-500/40" />
          </div>
          <button onClick={handleSave}
            className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-500 to-purple-700 border border-purple-400/30 text-white active:scale-[0.98] transition-all">
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}