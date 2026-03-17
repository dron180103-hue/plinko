import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import PlinkoCanvas from '@/components/PlinkoCanvas';
import GameTab, { type HistoryEntry } from '@/components/GameTab';
import Shop from '@/components/Shop';
import ConversionPopup from '@/components/ConversionPopup';
import BankruptPopup from '@/components/BankruptPopup';
import LanguageSelector from '@/components/LanguageSelector';
import SettingsPanel from '@/components/SettingsPanel';
import { type Language, getTranslations, getSavedLanguage, saveLanguage, getReferralUrl, getRtp, getAdminTgId, getAdminPin } from '@/lib/i18n';
import { type PlinkoBoard, type RiskLevel, createBoard, dropBall, updateBoard, getSlotMultiplier } from '@/lib/plinkoEngine';
import { initTelegram, openLink, haptic, hapticSuccess, isTelegram, getTelegramUserId } from '@/lib/telegram';
import { playTap, playDrop, playPegHit, playSlotLand, playBonus, isSoundEnabled, setSoundEnabled } from '@/lib/sound';
import {
  type GameState, type BoardThemeId, loadState, saveState, getSkinById,
  processDropResult, hasBooster, activateBooster, BOOSTERS, getPrestigeBonus,
  canPrestige, doPrestige, canClaimDaily, canSpinWheel, spinWheel,
  getXpForNextLevel,
} from '@/lib/gameStore';

type MainTab = 'game' | 'shop' | 'tasks' | 'profile';

const AUTO_DROP_MS = 2000;
const TAP_CD = 500;
const TAP_FAT_THRESH = 50;
const TAP_FAT_DUR = 30000;
const DAILY_BONUS = 75;
const POPUP_TRIGGER = 15;
const POPUP_REAPPEAR = 12;
const LUCKY_INTERVAL = 25;
const FAKES = ['CryptoKing', 'LuckyAce', 'GoldRush', 'DiamondH', 'NeonBet', 'StarPlay', 'MoonWin', 'FireDice'];

export default function PlinkoGame() {
  const [lang, setLang] = useState<Language>(getSavedLanguage);
  const [gs, setGs] = useState<GameState>(loadState);
  const [lastMult, setLastMult] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popDismAt, setPopDismAt] = useState(0);
  const [bigWin, setBigWin] = useState(false);
  const [board, setBoard] = useState<PlinkoBoard | null>(null);
  const [activeBalls, setActiveBalls] = useState(0);
  const [hist, setHist] = useState<HistoryEntry[]>([]);
  const [autoD, setAutoD] = useState(false);
  const [showSet, setShowSet] = useState(false);
  const [risk, setRisk] = useState<RiskLevel>('medium');
  const [rows, setRows] = useState(14);
  const [sndOn, setSndOn] = useState(isSoundEnabled);
  const [showBankr, setShowBankr] = useState(false);
  const [showDaily, setShowDaily] = useState(false);
  const [tapFat, setTapFat] = useState(false);
  const [rtp, setRtp] = useState(getRtp);
  const [tab, setTab] = useState<MainTab>('game');
  const [showWhl, setShowWhl] = useState(false);
  const [whlSpin, setWhlSpin] = useState(false);
  const [whlPrize, setWhlPrize] = useState<number | null>(null);

  const boardR = useRef<PlinkoBoard | null>(null);
  const gsR = useRef(gs);
  const tickR = useRef<number>(0);
  const autoDR = useRef(false);
  const autoBetR = useRef(10);
  const autoCntR = useRef(1);
  const hIdR = useRef(0);
  const popDR = useRef(popDismAt);
  const lastTapR = useRef(0);
  const tapCntR = useRef(0);
  const fatTR = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rtpR = useRef(rtp);
  const sndR = useRef(sndOn);
  const pegHR = useRef(0);

  const t = getTranslations(lang);

  useEffect(() => { gsR.current = gs; }, [gs]);
  useEffect(() => { autoDR.current = autoD; }, [autoD]);
  useEffect(() => { popDR.current = popDismAt; }, [popDismAt]);
  useEffect(() => { rtpR.current = rtp; }, [rtp]);
  useEffect(() => { sndR.current = sndOn; }, [sndOn]);
  useEffect(() => { initTelegram(); }, []);
  useEffect(() => { if (canClaimDaily(gs)) setShowDaily(true); }, []); // eslint-disable-line

  useEffect(() => {
    const iv = setInterval(() => saveState(gsR.current), 3000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const b = createBoard(400, 530, rows, risk);
    setBoard(b); boardR.current = b;
  }, [rows, risk]);

  // Game loop
  useEffect(() => {
    let lt = performance.now();
    pegHR.current = 0;
    const tick = (now: number) => {
      const d = (now - lt) / 16.67; lt = now;
      const cb = boardR.current;
      if (!cb) { tickR.current = requestAnimationFrame(tick); return; }
      const pp = cb.pegs.map(p => p.hitTimer);
      const landed = updateBoard(cb, d, rtpR.current);
      if (sndR.current) {
        for (let i = 0; i < cb.pegs.length; i++) {
          if (cb.pegs[i].hitTimer === 1 && pp[i] < 1) { pegHR.current++; if (pegHR.current % 3 === 0) playPegHit(); }
        }
      }
      setActiveBalls(cb.balls.filter(b => b.active).length);
      for (const ball of landed) {
        let mult = getSlotMultiplier(cb, ball.landedSlot);
        const bet = ball.bet || 10;
        setGs(prev => {
          const nx = { ...prev };
          const res = processDropResult(nx, mult, bet);
          if (res.shieldUsed && mult <= 0.1) mult = 1;
          const cm = hasBooster(nx, 'coin_magnet') ? 1.2 : 1;
          const pb = getPrestigeBonus(nx);
          const win = Math.floor(bet * mult * cm * pb);
          nx.balance += win; nx.totalWon += win; nx.biggestWin = Math.max(nx.biggestWin, win); nx.totalDrops++;
          if (res.leveledUp) { if (sndR.current) playBonus(); hapticSuccess(); toast.success(`⬆️ ${t.level} ${res.newLevel}!`, { duration: 2500 }); }
          if (res.comboBonus > 0) { nx.balance += res.comboBonus; toast(`🔥 ${t.comboBonus} +${res.comboBonus}🪙`, { duration: 1500 }); }
          if (res.shieldUsed) toast(t.shieldSaved, { duration: 1500 });
          if (res.achievementUnlocked.length > 0) toast.success(`🏆 ${t.achievements}!`, { duration: 2000 });
          return nx;
        });
        setLastMult(mult);
        const eid = ++hIdR.current;
        setHist(p => [...p, { id: eid, bet, multiplier: mult, win: bet * mult }].slice(-20));
        if (sndR.current) playSlotLand(mult);
        if (mult >= 5) { setBigWin(true); hapticSuccess(); setTimeout(() => setBigWin(false), 2000); toast.success(`🎉 ${mult}x → +${Math.floor(bet * mult)} 🪙`, { duration: 3000 }); }
        else if (mult >= 3) { haptic('medium'); toast(`✨ ${mult}x`, { duration: 1500 }); }
      }
      setBoard({ ...cb });
      tickR.current = requestAnimationFrame(tick);
    };
    tickR.current = requestAnimationFrame(tick);
    return () => { if (tickR.current) cancelAnimationFrame(tickR.current); };
  }, [t]);

  const doDropInternal = useCallback((bet: number, count: number) => {
    if (!boardR.current) return;
    const disc = hasBooster(gsR.current, 'multi_discount') && count > 1 ? 0.8 : 1;
    const cost = Math.floor(bet * count * disc);
    setGs(p => ({ ...p, balance: p.balance - cost, totalSpent: p.totalSpent + cost }));
    const skin = getSkinById(gsR.current.selectedSkin);
    const hot = gsR.current.consecutiveLosses >= 5;
    const lr = hasBooster(gsR.current, 'lucky_charm') ? Math.min(95, rtpR.current + 10) : rtpR.current;
    for (let i = 0; i < count; i++) {
      setTimeout(() => { if (boardR.current) dropBall(boardR.current, bet, lr, skin.color, skin.glow, skin.trail, skin.id, hot); }, i * 80);
    }
    if (sndR.current) playDrop();
    haptic('medium');
    autoBetR.current = bet; autoCntR.current = count;
    const nd = gsR.current.totalDrops + count;
    if (nd >= POPUP_TRIGGER) { const s = nd - (popDR.current || 0); if (nd === POPUP_TRIGGER || (popDR.current > 0 && s >= POPUP_REAPPEAR)) setShowPopup(true); }
    if (nd > 0 && nd % LUCKY_INTERVAL === 0) { const b = Math.floor(10 + Math.random() * 90); setGs(p => ({ ...p, balance: p.balance + b })); if (sndR.current) playBonus(); hapticSuccess(); toast.success(`🍀 +${b} 🪙!`, { duration: 2000 }); }
  }, []);

  useEffect(() => {
    if (!autoD) return;
    const iv = setInterval(() => {
      if (!autoDR.current || !boardR.current) return;
      const bet = autoBetR.current; const cnt = autoCntR.current;
      const disc = hasBooster(gsR.current, 'multi_discount') && cnt > 1 ? 0.8 : 1;
      if (gsR.current.balance < Math.floor(bet * cnt * disc)) { setAutoD(false); return; }
      doDropInternal(bet, cnt);
    }, AUTO_DROP_MS);
    return () => clearInterval(iv);
  }, [autoD, doDropInternal]);

  useEffect(() => {
    if (gs.balance <= 0 && gs.totalDrops > 0 && activeBalls === 0) setTimeout(() => setShowBankr(true), 500);
  }, [gs.balance, gs.totalDrops, activeBalls]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapR.current < TAP_CD) return;
    lastTapR.current = now; tapCntR.current++;
    if (sndR.current) playTap();
    if (tapCntR.current >= TAP_FAT_THRESH && !fatTR.current) {
      setTapFat(true);
      fatTR.current = setTimeout(() => { setTapFat(false); tapCntR.current = 0; fatTR.current = null; }, TAP_FAT_DUR);
    }
    const rw = tapCntR.current >= TAP_FAT_THRESH ? 0.2 : 0.5;
    setGs(p => ({ ...p, balance: p.balance + rw, tapCount: p.tapCount + 1 }));
  }, []);

  const handleDrop = useCallback((bet: number, count: number): boolean => {
    const disc = hasBooster(gsR.current, 'multi_discount') && count > 1 ? 0.8 : 1;
    const cost = Math.floor(bet * count * disc);
    if (gsR.current.balance < cost || !boardR.current) return false;
    doDropInternal(bet, count);
    return true;
  }, [doDropInternal]);

  const handleHourly = useCallback(() => {
    if (!boardR.current) return;
    setGs(p => (Date.now() - p.lastHourlyBonus < 3600000 ? p : { ...p, lastHourlyBonus: Date.now() }));
    const skin = getSkinById(gsR.current.selectedSkin);
    dropBall(boardR.current, 0, 95, skin.color, skin.glow, skin.trail, skin.id, false);
    if (sndR.current) playBonus(); hapticSuccess();
    toast.success(t.hourlyBonusMsg, { duration: 2000 });
  }, [t]);

  const handleWheel = useCallback(() => {
    setShowWhl(true); setWhlSpin(true); setWhlPrize(null);
    setTimeout(() => {
      setGs(p => {
        const prize = spinWheel(p);
        setWhlPrize(prize); setWhlSpin(false);
        if (sndR.current) playBonus(); hapticSuccess();
        toast.success(`🎡 +${prize} 🪙!`, { duration: 2500 });
        return { ...p, balance: p.balance + prize };
      });
    }, 2000);
    setTimeout(() => setShowWhl(false), 5000);
  }, []);

  const handleClaimDaily = useCallback(() => {
    setGs(p => ({ ...p, balance: p.balance + DAILY_BONUS, lastDailyBonus: Date.now() }));
    setShowDaily(false);
    if (sndR.current) playBonus(); hapticSuccess();
    toast.success(`+${DAILY_BONUS} 🪙!`, { duration: 2000 });
  }, []);

  const handleBuySkin = useCallback((id: string, price: number): boolean => {
    if (gsR.current.balance < price) { toast.error(t.notEnoughCoins); return false; }
    setGs(p => ({ ...p, balance: p.balance - price, ownedSkins: [...p.ownedSkins, id], selectedSkin: id, shopPurchases: p.shopPurchases + 1, totalSpent: p.totalSpent + price }));
    return true;
  }, [t]);

  const handleEquipSkin = useCallback((id: string) => { setGs(p => ({ ...p, selectedSkin: id })); }, []);

  const handleBuyTheme = useCallback((id: BoardThemeId, price: number): boolean => {
    if (gsR.current.balance < price) { toast.error(t.notEnoughCoins); return false; }
    setGs(p => ({ ...p, balance: p.balance - price, ownedThemes: [...p.ownedThemes, id], selectedTheme: id, shopPurchases: p.shopPurchases + 1, totalSpent: p.totalSpent + price }));
    return true;
  }, [t]);

  const handleEquipTheme = useCallback((id: BoardThemeId) => { setGs(p => ({ ...p, selectedTheme: id })); }, []);

  const handleBuyBooster = useCallback((id: string, price: number): boolean => {
    if (gsR.current.balance < price) { toast.error(t.notEnoughCoins); return false; }
    setGs(p => {
      const nx = { ...p, balance: p.balance - price, shopPurchases: p.shopPurchases + 1, totalSpent: p.totalSpent + price, activeBoosters: [...p.activeBoosters] };
      const ok = activateBooster(nx, id);
      if (!ok) { toast.error(t.maxBoosters); return p; }
      return nx;
    });
    return true;
  }, [t]);

  const handleBuySpecial = useCallback((id: string, price: number): boolean => {
    if (gsR.current.balance < price) { toast.error(t.notEnoughCoins); return false; }
    setGs(p => ({ ...p, balance: p.balance - price, shopPurchases: p.shopPurchases + 1, totalSpent: p.totalSpent + price }));
    if (id === 'mega_spin' && boardR.current) {
      const skin = getSkinById(gsR.current.selectedSkin);
      dropBall(boardR.current, 0, 99, skin.color, skin.glow, skin.trail, skin.id, false);
      toast.success(t.guaranteed, { duration: 2000 });
    } else if (id === 'vip_pass') {
      setGs(p => {
        const nx = { ...p, activeBoosters: [] };
        for (const b of BOOSTERS) activateBooster(nx, b.id);
        nx.activeBoosters = nx.activeBoosters.map(ab => ({ ...ab, expiresAt: Date.now() + 86400000, usesLeft: ab.usesLeft > 0 ? 999 : ab.usesLeft }));
        return nx;
      });
      toast.success('💎 VIP!', { duration: 2000 });
    }
    return true;
  }, [t]);

  const handleAddBal = useCallback((n: number) => { setGs(p => ({ ...p, balance: p.balance + n })); }, []);

  const handleClaimCh = useCallback((id: string, type: 'daily' | 'weekly') => {
    setGs(p => {
      const nx = { ...p };
      if (type === 'daily') {
        nx.dailyChallenges = p.dailyChallenges.map(ch => {
          if (ch.id === id && ch.progress >= ch.target && !ch.claimed) {
            nx.balance += ch.reward; if (sndR.current) playBonus(); hapticSuccess();
            toast.success(`+${ch.reward} 🪙!`, { duration: 1500 });
            return { ...ch, claimed: true };
          }
          return ch;
        });
      } else {
        nx.weeklyChallenges = p.weeklyChallenges.map(wm => {
          if (wm.id === id && wm.progress >= wm.target && !wm.claimed) {
            nx.balance += wm.reward; if (sndR.current) playBonus(); hapticSuccess();
            toast.success(`+${wm.reward} 🪙!`, { duration: 1500 });
            return { ...wm, claimed: true };
          }
          return wm;
        });
      }
      return nx;
    });
  }, []);

  const handlePrestige = useCallback(() => {
    setGs(p => {
      if (!canPrestige(p)) return p;
      const nx = { ...p }; doPrestige(nx);
      if (sndR.current) playBonus(); hapticSuccess();
      toast.success(`⭐ ${t.prestige} ${nx.prestigeLevel}!`, { duration: 3000 });
      return nx;
    });
  }, [t]);

  const isAdmin = (() => {
    const aid = getAdminTgId(); const pin = getAdminPin();
    if (!aid && !pin) return true;
    const tid = getTelegramUserId();
    if (tid && aid && tid === aid) return true;
    if (pin) return true;
    return false;
  })();

  const lb = FAKES.map((n, i) => ({ name: n, score: Math.floor(5000 - i * 400 + Math.random() * 200) }));
  lb.push({ name: t.you, score: Math.floor(gs.totalWon) });
  lb.sort((a, b) => b.score - a.score);

  const tgP = isTelegram() ? 'pt-2' : 'pt-1';
  const refUrl = getReferralUrl();
  const hasDailyUncl = gs.dailyChallenges.some(c => c.progress >= c.target && !c.claimed);
  const hasWeekUncl = gs.weeklyChallenges.some(w => w.progress >= w.target && !w.claimed);
  const taskBadge = hasDailyUncl || hasWeekUncl;

  const chLabel = (ch: { type: string; target: number }) => {
    if (ch.type === 'drops') return t.dropBalls.replace('{n}', String(ch.target));
    if (ch.type === 'multiplier') return t.winMultiplier.replace('{n}', String(ch.target));
    if (ch.type === 'combo') return t.reachCombo.replace('{n}', String(ch.target));
    if (ch.type === 'spend') return t.spendCoins.replace('{n}', String(ch.target));
    return '';
  };
  const wkLabel = (w: { type: string; target: number }) => {
    if (w.type === 'drops') return t.weeklyDrops.replace('{n}', String(w.target));
    if (w.type === 'shopBuy') return t.shopBuys.replace('{n}', String(w.target));
    if (w.type === 'level') return t.reachLevel.replace('{n}', String(w.target));
    return '';
  };
  const achL: Record<string, string> = {
    firstDrop: t.firstDrop, highRoller: t.highRoller, luckyStar: t.luckyStar,
    dedicated: t.dedicated, whale: t.whale, shopaholic: t.shopaholic,
    collector: t.collector, prestige: t.prestigeAch,
  };

  const xpN = getXpForNextLevel(gs.level);
  const xpP = Math.min(100, (gs.xp / xpN) * 100);

  return (
    <div className={`h-full h-[100dvh] bg-[#06000f] text-white relative overflow-hidden flex flex-col ${tgP}`} style={{ touchAction: 'manipulation' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0018] via-[#06000f] to-[#030006]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.04)_0%,transparent_60%)]" />
      {bigWin && <div className="absolute inset-0 z-30 pointer-events-none"><div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-amber-500/10 animate-pulse" style={{ animationDuration: '0.3s' }} /></div>}

      <div className="relative z-10 max-w-md mx-auto w-full px-2 flex flex-col flex-1 min-h-0">
        <header className="flex items-center justify-between mb-1 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-black bg-gradient-to-r from-purple-400 via-amber-400 to-purple-400 bg-clip-text text-transparent leading-tight">🎱 PLINKO</h1>
            {isAdmin && <button onClick={() => setShowSet(true)} className="w-5 h-5 rounded-md bg-white/[0.03] border border-white/[0.05] text-white/15 hover:text-white/40 flex items-center justify-center text-[8px]">⚙</button>}
          </div>
          <LanguageSelector currentLang={lang} onChangeLang={(l: Language) => { setLang(l); saveLanguage(l); }} />
        </header>

        <div className="flex-shrink-0 mb-1"><PlinkoCanvas board={board} /></div>

        <div className="flex-1 min-h-0 overflow-y-auto pb-28 custom-scrollbar">
          {tab === 'game' && (
            <GameTab state={gs} t={t} onTap={handleTap} onDrop={handleDrop} activeBalls={activeBalls}
              lastMultiplier={lastMult} history={hist} autoDrop={autoD}
              onToggleAutoDrop={() => setAutoD(p => !p)} riskLevel={risk} onRiskChange={setRisk}
              rows={rows} onRowsChange={setRows} soundOn={sndOn}
              onToggleSound={() => { setSndOn(p => { setSoundEnabled(!p); return !p; }); }}
              tapFatigued={tapFat} onHourlyBonus={handleHourly} onFortuneWheel={handleWheel}
              showWheel={showWhl} wheelSpinning={whlSpin} wheelPrize={whlPrize} />
          )}
          {tab === 'shop' && (
            <Shop state={gs} t={t} soundOn={sndOn} onBuySkin={handleBuySkin} onEquipSkin={handleEquipSkin}
              onBuyTheme={handleBuyTheme} onEquipTheme={handleEquipTheme}
              onBuyBooster={handleBuyBooster} onBuySpecial={handleBuySpecial} onAddBalance={handleAddBal} />
          )}
          {tab === 'tasks' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2 space-y-1.5">
                <div className="text-[10px] font-bold text-white/30">{t.dailyChallenges}</div>
                {gs.dailyChallenges.map(ch => {
                  const done = ch.progress >= ch.target;
                  return (
                    <div key={ch.id} className={`flex items-center gap-2 p-1.5 rounded-lg border ${done && !ch.claimed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-white/50">{chLabel(ch)}</div>
                        <div className="h-1 rounded-full bg-white/[0.06] mt-0.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all" style={{ width: `${Math.min(100, (ch.progress / ch.target) * 100)}%` }} />
                        </div>
                        <div className="text-[8px] text-white/20 mt-0.5">{ch.progress}/{ch.target}</div>
                      </div>
                      {done && !ch.claimed ? <button onClick={() => handleClaimCh(ch.id, 'daily')} className="px-2 py-1 rounded-lg text-[9px] font-bold bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 active:scale-95">+{ch.reward}🪙</button>
                        : ch.claimed ? <span className="text-[9px] text-emerald-400/50">✓</span>
                        : <span className="text-[9px] text-white/15">{ch.reward}🪙</span>}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2 space-y-1.5">
                <div className="text-[10px] font-bold text-white/30">{t.weeklyChallenges}</div>
                {gs.weeklyChallenges.map(wm => {
                  const done = wm.progress >= wm.target;
                  return (
                    <div key={wm.id} className={`flex items-center gap-2 p-1.5 rounded-lg border ${done && !wm.claimed ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                      <div className="flex-1">
                        <div className="text-[10px] font-bold text-white/50">{wkLabel(wm)}</div>
                        <div className="h-1 rounded-full bg-white/[0.06] mt-0.5 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all" style={{ width: `${Math.min(100, (wm.progress / wm.target) * 100)}%` }} />
                        </div>
                        <div className="text-[8px] text-white/20 mt-0.5">{wm.progress}/{wm.target}</div>
                      </div>
                      {done && !wm.claimed ? <button onClick={() => handleClaimCh(wm.id, 'weekly')} className="px-2 py-1 rounded-lg text-[9px] font-bold bg-amber-500/30 border border-amber-400/40 text-amber-300 active:scale-95">+{wm.reward}🪙</button>
                        : wm.claimed ? <span className="text-[9px] text-amber-400/50">✓</span>
                        : <span className="text-[9px] text-white/15">{wm.reward}🪙</span>}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2">
                <div className="text-[10px] font-bold text-white/30 mb-1">🏆 {t.leaderboard}</div>
                {lb.slice(0, 5).map((e, i) => (
                  <div key={i} className={`flex items-center justify-between text-[9px] px-1.5 py-0.5 rounded ${e.name === t.you ? 'bg-amber-500/10' : ''}`}>
                    <span className="text-white/20 w-4">{i + 1}.</span>
                    <span className={`flex-1 ${e.name === t.you ? 'text-amber-400 font-bold' : 'text-white/35'}`}>{e.name}</span>
                    <span className="text-white/25 tabular-nums font-bold">{e.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === 'profile' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-400/15 p-3 text-center">
                {gs.prestigeLevel > 0 && <div className="text-amber-400 text-sm mb-0.5">{'⭐'.repeat(Math.min(gs.prestigeLevel, 10))}</div>}
                <div className="text-2xl font-black text-purple-300">{t.level} {gs.level}</div>
                <div className="mx-auto max-w-[200px] mt-1">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500" style={{ width: `${xpP}%` }} />
                  </div>
                  <div className="text-[8px] text-white/20 mt-0.5">{gs.xp}/{xpN} {t.xp}</div>
                </div>
                {gs.prestigeLevel > 0 && <div className="text-[9px] text-amber-400/50 mt-1">{t.prestigeBonus} (x{gs.prestigeLevel})</div>}
                {canPrestige(gs) && (
                  <button onClick={handlePrestige} className="mt-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-400/40 text-white active:scale-95 transition-all">
                    {t.prestigeBtn}
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2">
                <div className="text-[10px] font-bold text-white/30 mb-1">📊 {t.stats}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    [t.totalDrops, gs.totalDrops], [t.totalWon, Math.floor(gs.totalWon)],
                    [t.totalSpent, Math.floor(gs.totalSpent)], [t.biggestWin, Math.floor(gs.biggestWin)],
                    [t.maxComboLabel, gs.maxCombo], [t.prestige, gs.prestigeLevel],
                  ].map(([label, val], i) => (
                    <div key={i} className="text-center p-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="text-[8px] text-white/20">{label}</div>
                      <div className="text-[11px] font-bold text-white/50 tabular-nums">{typeof val === 'number' ? val.toLocaleString() : val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2">
                <div className="text-[10px] font-bold text-white/30 mb-1">🏆 {t.achievements}</div>
                <div className="flex flex-wrap gap-1">
                  {gs.achievements.map(ach => (
                    <div key={ach.id} className={`px-1.5 py-0.5 rounded-lg text-[9px] border ${ach.unlocked ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' : 'bg-white/[0.02] border-white/[0.04] text-white/15'}`}>
                      {ach.emoji} {achL[ach.id] || ach.id}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        {/* Referral button */}
        <div className="max-w-md mx-auto px-2 mb-1">
          <button onClick={() => openLink(refUrl)}
            className="w-full py-2 rounded-2xl font-black text-sm text-amber-900 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 active:scale-[0.97] transition-all relative overflow-hidden border border-amber-300/50 min-h-[40px]"
            style={{ animation: 'ref-btn-pulse 3s ease-in-out infinite' }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
            <span className="relative z-10">{t.playForReal}</span>
          </button>
        </div>
        {/* Nav bar */}
        <div className="bg-[#0a0018]/95 backdrop-blur-md border-t border-white/[0.06]">
          <div className="max-w-md mx-auto flex">
            {([
              { id: 'game' as MainTab, icon: '🎮', label: t.game, badge: false },
              { id: 'shop' as MainTab, icon: '🛒', label: t.shop, badge: false },
              { id: 'tasks' as MainTab, icon: '📋', label: t.tasks, badge: taskBadge },
              { id: 'profile' as MainTab, icon: '🏆', label: t.profile, badge: false },
            ]).map(item => (
              <button key={item.id} onClick={() => { setTab(item.id); haptic('light'); }}
                className={`flex-1 py-2 flex flex-col items-center gap-0.5 transition-all relative ${tab === item.id ? 'text-purple-300' : 'text-white/25'}`}>
                <span className="text-lg">{item.icon}</span>
                <span className="text-[8px] font-bold">{item.label}</span>
                {item.badge && <div className="absolute top-1.5 right-[30%] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                {tab === item.id && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-purple-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Popups */}
      {showDaily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ touchAction: 'manipulation' }}>
          <div className="relative max-w-xs w-full mx-4 rounded-2xl bg-[#12082a] border border-amber-500/30 p-6 text-center popup-enter">
            <div className="text-4xl mb-2">🎁</div>
            <h3 className="text-lg font-black text-amber-400 mb-1">{t.dailyBonus}</h3>
            <p className="text-sm text-white/50 mb-4">{t.dailyBonusMsg}</p>
            <button onClick={handleClaimDaily} className="w-full py-3 rounded-xl font-black text-base text-amber-900 bg-gradient-to-r from-amber-400 to-yellow-400 active:scale-95 transition-all min-h-[48px]">
              {t.claim} +{DAILY_BONUS} 🪙
            </button>
          </div>
        </div>
      )}

      <ConversionPopup show={showPopup} t={t} onDismiss={() => { setShowPopup(false); setPopDismAt(gsR.current.totalDrops); }} referralUrl={refUrl} />
      <BankruptPopup show={showBankr} t={t} referralUrl={refUrl} onDismiss={() => { setShowBankr(false); setGs(p => ({ ...p, balance: p.balance + 5 })); }} />
      <SettingsPanel show={showSet} onClose={() => setShowSet(false)} t={t} onRtpChange={setRtp} />
    </div>
  );
}