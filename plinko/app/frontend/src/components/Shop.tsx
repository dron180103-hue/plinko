import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { type Translations } from '@/lib/i18n';
import {
  type GameState, FREE_SKINS, PREMIUM_SKINS, BOARD_THEMES, BOOSTERS, SPECIAL_ITEMS,
  getSkinById, activateBooster, hasBooster, openMysteryBox, type BoardThemeId,
} from '@/lib/gameStore';
import { haptic, hapticSuccess } from '@/lib/telegram';
import { playBonus } from '@/lib/sound';

type ShopTab = 'skins' | 'themes' | 'boosters' | 'specials';

interface ShopProps {
  state: GameState;
  t: Translations;
  soundOn: boolean;
  onBuySkin: (id: string, price: number) => boolean;
  onEquipSkin: (id: string) => void;
  onBuyTheme: (id: BoardThemeId, price: number) => boolean;
  onEquipTheme: (id: BoardThemeId) => void;
  onBuyBooster: (id: string, price: number) => boolean;
  onBuySpecial: (id: string, price: number) => boolean;
  onAddBalance: (amount: number) => void;
}

export default function Shop({ state, t, soundOn, onBuySkin, onEquipSkin, onBuyTheme, onEquipTheme, onBuyBooster, onBuySpecial, onAddBalance }: ShopProps) {
  const [tab, setTab] = useState<ShopTab>('skins');
  const C = t.currency;

  const tabs: { id: ShopTab; label: string }[] = [
    { id: 'skins', label: t.skins },
    { id: 'themes', label: t.themes },
    { id: 'boosters', label: t.boosters },
    { id: 'specials', label: t.specials },
  ];

  const handleBuySkin = useCallback((id: string, price: number) => {
    if (onBuySkin(id, price)) {
      if (soundOn) playBonus();
      hapticSuccess();
      toast.success(t.purchased);
    }
  }, [onBuySkin, soundOn, t]);

  const handleBuyTheme = useCallback((id: BoardThemeId, price: number) => {
    if (onBuyTheme(id, price)) {
      if (soundOn) playBonus();
      hapticSuccess();
      toast.success(t.purchased);
    }
  }, [onBuyTheme, soundOn, t]);

  const handleBuyBooster = useCallback((id: string, price: number) => {
    if (onBuyBooster(id, price)) {
      if (soundOn) playBonus();
      hapticSuccess();
      toast.success(t.activated);
    }
  }, [onBuyBooster, soundOn, t]);

  const handleBuySpecial = useCallback((id: string, price: number) => {
    if (id === 'mystery_box') {
      if (state.balance < price) { toast.error(t.notEnoughCoins); return; }
      if (onBuySpecial(id, price)) {
        const result = openMysteryBox();
        if (result.type === 'coins') {
          onAddBalance(result.value);
          toast.success(`${t.mysteryResult} ${result.label}`);
        } else {
          const booster = BOOSTERS[result.value];
          if (booster) activateBooster(state, booster.id);
          toast.success(`${t.mysteryResult} ${result.label}`);
        }
        if (soundOn) playBonus();
        hapticSuccess();
      }
    } else {
      if (onBuySpecial(id, price)) {
        if (soundOn) playBonus();
        hapticSuccess();
        toast.success(t.purchased);
      }
    }
  }, [state, onBuySpecial, onAddBalance, soundOn, t]);

  const boosterNames: Record<string, string> = {
    lucky_charm: t.luckyCharm, double_xp: t.doubleXp, coin_magnet: t.coinMagnet,
    shield: t.shield, multi_discount: t.multiDiscount,
  };
  const specialNames: Record<string, string> = {
    mega_spin: t.megaSpin, mystery_box: t.mysteryBox, vip_pass: t.vipPass,
  };

  const formatTime = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-2">
      {/* Balance */}
      <div className="text-center">
        <span className="text-lg font-black text-amber-400 tabular-nums">{Math.floor(state.balance).toLocaleString()}</span>
        <span className="text-[9px] text-amber-400/40 ml-1">{C}</span>
      </div>

      {/* Active Boosters */}
      {state.activeBoosters.length > 0 && (
        <div className="flex gap-1 flex-wrap justify-center">
          {state.activeBoosters.map(ab => {
            const def = BOOSTERS.find(b => b.id === ab.id);
            if (!def) return null;
            const remaining = ab.expiresAt > 0 ? Math.max(0, ab.expiresAt - Date.now()) : 0;
            if (ab.expiresAt > 0 && remaining <= 0) return null;
            return (
              <div key={ab.id} className="px-1.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-[8px] text-emerald-400 font-bold">
                {def.emoji} {ab.expiresAt > 0 ? formatTime(remaining) : `${ab.usesLeft} ${t.usesLeft}`}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => { setTab(tb.id); haptic('light'); }}
            className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${tab === tb.id ? 'bg-purple-500/20 border border-purple-400/25 text-purple-300' : 'bg-white/[0.02] border border-white/[0.04] text-white/20'}`}>
            {tb.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[35vh] overflow-y-auto custom-scrollbar space-y-1.5 pb-1">
        {tab === 'skins' && (
          <>
            <div className="text-[9px] font-bold text-white/20 px-1">{t.free}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {FREE_SKINS.map(skin => {
                const isOwned = state.ownedSkins.includes(skin.id) || state.level >= skin.unlockLevel;
                const isEquipped = state.selectedSkin === skin.id;
                const canUnlock = state.level >= skin.unlockLevel;
                return (
                  <button key={skin.id} onClick={() => { if (isOwned || canUnlock) onEquipSkin(skin.id); }}
                    className={`p-1.5 rounded-xl border text-center transition-all ${isEquipped ? 'bg-amber-500/20 border-amber-400/40' : isOwned || canUnlock ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-40'}`}>
                    <div className="text-lg">{skin.emoji}</div>
                    <div className="text-[8px] font-bold text-white/40 truncate">{skin.name}</div>
                    {isEquipped ? <div className="text-[7px] text-amber-400 font-bold">✓</div>
                      : !canUnlock ? <div className="text-[7px] text-white/20">Lv.{skin.unlockLevel}</div>
                      : null}
                  </button>
                );
              })}
            </div>
            <div className="text-[9px] font-bold text-amber-400/40 px-1 mt-2">{t.premium} ✨</div>
            <div className="grid grid-cols-4 gap-1.5">
              {PREMIUM_SKINS.map(skin => {
                const isOwned = state.ownedSkins.includes(skin.id);
                const isEquipped = state.selectedSkin === skin.id;
                return (
                  <button key={skin.id}
                    onClick={() => { if (isOwned) onEquipSkin(skin.id); else handleBuySkin(skin.id, skin.price); }}
                    className={`p-1.5 rounded-xl border text-center transition-all ${isEquipped ? 'bg-amber-500/20 border-amber-400/40' : isOwned ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-purple-500/10 border-purple-400/20'}`}>
                    <div className="text-lg">{skin.emoji}</div>
                    <div className="text-[8px] font-bold text-white/40 truncate">{skin.name}</div>
                    {isEquipped ? <div className="text-[7px] text-amber-400 font-bold">✓</div>
                      : isOwned ? <div className="text-[7px] text-emerald-400">{t.owned}</div>
                      : <div className="text-[7px] text-amber-400 font-bold">{skin.price}{C}</div>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {tab === 'themes' && (
          <div className="grid grid-cols-2 gap-1.5">
            {BOARD_THEMES.map(theme => {
              const isOwned = state.ownedThemes.includes(theme.id);
              const isEquipped = state.selectedTheme === theme.id;
              return (
                <button key={theme.id}
                  onClick={() => { if (isOwned) onEquipTheme(theme.id); else handleBuyTheme(theme.id, theme.price); }}
                  className={`p-2 rounded-xl border text-center transition-all ${isEquipped ? 'bg-amber-500/15 border-amber-400/30' : isOwned ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-purple-500/10 border-purple-400/20'}`}>
                  <div className="w-full h-8 rounded-lg mb-1.5" style={{ background: theme.bgColor, border: `1px solid ${theme.pegGlow}` }}>
                    <div className="flex items-center justify-center h-full gap-1">
                      {[0, 1, 2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: theme.pegColor }} />)}
                    </div>
                  </div>
                  <div className="text-sm">{theme.emoji}</div>
                  <div className="text-[9px] font-bold text-white/50">{theme.name}</div>
                  {isEquipped ? <div className="text-[7px] text-amber-400 font-bold">✓ {t.equipped}</div>
                    : isOwned ? <div className="text-[7px] text-emerald-400">{t.owned}</div>
                    : <div className="text-[7px] text-amber-400 font-bold">{theme.price}{C}</div>}
                </button>
              );
            })}
          </div>
        )}

        {tab === 'boosters' && (
          <div className="space-y-1.5">
            {BOOSTERS.map(booster => {
              const isActive = hasBooster(state, booster.id);
              return (
                <div key={booster.id} className={`flex items-center gap-2 p-2 rounded-xl border ${isActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                  <div className="text-2xl">{booster.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white/60">{boosterNames[booster.id] || booster.name}</div>
                    <div className="text-[8px] text-white/25">{booster.description}</div>
                    {booster.durationMs > 0 && <div className="text-[8px] text-white/15">{Math.floor(booster.durationMs / 60000)} мін</div>}
                    {booster.uses > 0 && <div className="text-[8px] text-white/15">{booster.uses}x</div>}
                  </div>
                  {isActive ? (
                    <div className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">{t.active}</div>
                  ) : (
                    <button onClick={() => handleBuyBooster(booster.id, booster.price)}
                      className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-amber-500/20 border border-amber-400/30 text-amber-400 active:scale-95 transition-all">
                      {booster.price}{C}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'specials' && (
          <div className="space-y-1.5">
            {SPECIAL_ITEMS.map(item => (
              <div key={item.id} className="flex items-center gap-2 p-2 rounded-xl border bg-gradient-to-r from-purple-500/10 to-amber-500/10 border-purple-400/20">
                <div className="text-2xl">{item.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white/60">{specialNames[item.id] || item.name}</div>
                  <div className="text-[8px] text-white/25">{item.description}</div>
                </div>
                <button onClick={() => handleBuySpecial(item.id, item.price)}
                  className="px-2.5 py-1.5 rounded-lg text-[9px] font-bold bg-amber-500/20 border border-amber-400/30 text-amber-400 active:scale-95 transition-all whitespace-nowrap">
                  {item.price}{C}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}