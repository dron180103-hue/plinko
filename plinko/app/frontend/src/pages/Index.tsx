import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import PlinkoCanvas from '@/components/PlinkoCanvas';
import GameTab, { type HistoryEntry } from '@/components/GameTab';
import Shop from '@/components/Shop';
import ConversionPopup from '@/components/ConversionPopup';
import BankruptPopup from '@/components/BankruptPopup';
import LanguageSelector from '@/components/LanguageSelector';
import SettingsPanel from '@/components/SettingsPanel';
import DailyOffer, { shouldShowDailyOffer, markDailyOfferSeen } from '@/components/DailyOffer';
import {
  type Language, getTranslations, getSavedLanguage, saveLanguage,
  getReferralUrl, getRtp, getAdminTgId, isAdminLoggedIn, isPlayerAdmin,
} from '@/lib/i18n';
import { type PlinkoBoard, type RiskLevel, createBoard, dropBall, updateBoard, getSlotMultiplier } from '@/lib/plinkoEngine';
import { initTelegram, openLink, haptic, hapticSuccess, isTelegram, getTelegramUserId } from '@/lib/telegram';
import { playTap, playDrop, playPegHit, playSlotLand, playBonus, isSoundEnabled, setSoundEnabled } from '@/lib/sound';
import {
  type GameState, type BoardThemeId, createDefaultState, getSkinById, getThemeById,
  processDropResult, hasBooster, activateBooster, BOOSTERS, getPrestigeBonus,
  canPrestige, doPrestige, canClaimDaily, canSpinWheel, spinWheel,
  getXpForNextLevel, saveState, FORTUNE_WHEEL_PRIZES,
  checkAndUpdateStreak, getStreakReward, MAX_DOUBLE_OR_NOTHING,
} from '@/lib/gameStore';
import DoubleOrNothing from '@/components/DoubleOrNothing';
import {
  apiRegister, apiLogin, apiGetProgress, apiSaveProgress, apiGetLeaderboard,
  type ProgressData, type LeaderboardItem, type SessionData,
  saveSession, getSession, clearSession, getErrorDetail,
  saveLocalProgress, loadLocalProgress, beaconSaveProgress,
  isApiOnline, onConnectionStatusChange,
} from '@/lib/api';

type MainTab = 'game' | 'shop' | 'tasks' | 'profile';
type AuthMode = 'login' | 'register';

const AUTO_DROP_MS = 2000;
const TAP_CD = 500;
const TAP_FAT_THRESH = 50;
const TAP_FAT_DUR = 30000;
const DAILY_BONUS = 75;
const HOURLY_COIN_BONUS_MIN = 25;
const HOURLY_COIN_BONUS_MAX = 50;
const LUCKY_INTERVAL = 25;
const CONVERSION_POPUP_DATE_KEY = 'plinko_conversion_popup_date';
const SAVE_INTERVAL = 10000;

interface Particle { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; }

// Convert GameState to ProgressData for saving
function stateToProgress(playerId: number, gs: GameState): ProgressData {
  return {
    player_id: playerId,
    balance: gs.balance,
    level: gs.level,
    xp: gs.xp,
    total_drops: gs.totalDrops,
    total_won: gs.totalWon,
    total_spent: gs.totalSpent,
    biggest_win: gs.biggestWin,
    tap_count: gs.tapCount,
    combo_count: gs.comboCount,
    max_combo: gs.maxCombo,
    consecutive_losses: gs.consecutiveLosses,
    prestige_level: gs.prestigeLevel,
    selected_skin: gs.selectedSkin,
    selected_theme: gs.selectedTheme,
    owned_skins: JSON.stringify(gs.ownedSkins),
    owned_themes: JSON.stringify(gs.ownedThemes),
    active_boosters: JSON.stringify(gs.activeBoosters),
    shop_purchases: gs.shopPurchases,
    achievements: JSON.stringify(gs.achievements),
    daily_challenges: JSON.stringify(gs.dailyChallenges),
    weekly_challenges: JSON.stringify(gs.weeklyChallenges),
    last_daily_bonus: gs.lastDailyBonus ? new Date(gs.lastDailyBonus).toISOString() : null,
    last_hourly_bonus: gs.lastHourlyBonus ? new Date(gs.lastHourlyBonus).toISOString() : null,
    last_wheel_spin: gs.lastWheelSpin ? new Date(gs.lastWheelSpin).toISOString() : null,
    login_streak: gs.loginStreak ?? 0,
    last_login_date: gs.lastLoginDate ?? '',
  };
}

// Convert ProgressData to GameState
function progressToState(p: ProgressData, base: GameState): GameState {
  const tryParse = (s: string, def: any) => { try { return JSON.parse(s); } catch { return def; } };
  const toTs = (s: string | null) => { if (!s) return 0; try { return new Date(s).getTime(); } catch { return 0; } };
  return {
    ...base,
    balance: p.balance ?? 1000,
    level: p.level ?? 1,
    xp: p.xp ?? 0,
    totalDrops: p.total_drops ?? 0,
    totalWon: p.total_won ?? 0,
    totalSpent: p.total_spent ?? 0,
    biggestWin: p.biggest_win ?? 0,
    tapCount: p.tap_count ?? 0,
    comboCount: p.combo_count ?? 0,
    maxCombo: p.max_combo ?? 0,
    consecutiveLosses: p.consecutive_losses ?? 0,
    prestigeLevel: p.prestige_level ?? 0,
    selectedSkin: p.selected_skin || 'gold',
    selectedTheme: (p.selected_theme || 'default') as BoardThemeId,
    ownedSkins: tryParse(p.owned_skins, ['gold']),
    ownedThemes: tryParse(p.owned_themes, ['default']),
    activeBoosters: tryParse(p.active_boosters, []),
    shopPurchases: p.shop_purchases ?? 0,
    achievements: tryParse(p.achievements, base.achievements),
    dailyChallenges: tryParse(p.daily_challenges, base.dailyChallenges),
    weeklyChallenges: tryParse(p.weekly_challenges, base.weeklyChallenges),
    lastDailyBonus: toTs(p.last_daily_bonus),
    lastHourlyBonus: toTs(p.last_hourly_bonus),
    lastWheelSpin: toTs(p.last_wheel_spin),
    loginStreak: (p as any).login_streak ?? 0,
    lastLoginDate: (p as any).last_login_date ?? '',
    doubleOrNothingUsed: 0, // reset per session
  };
}

// ==================== CONNECTION STATUS INDICATOR ====================
function ConnectionIndicator({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none">
      <div className="max-w-md mx-auto">
        <div className="mx-2 mt-1 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 backdrop-blur-md text-center">
          <span className="text-[10px] font-bold text-red-300 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            Offline — дані зберігаються локально
          </span>
        </div>
      </div>
    </div>
  );
}

export default function PlinkoGame() {
  const [lang, setLang] = useState<Language>(getSavedLanguage);
  const [gs, setGs] = useState<GameState>(createDefaultState);
  const [lastMult, setLastMult] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);
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
  const [showDailyOffer, setShowDailyOffer] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [apiOnline, setApiOnline] = useState(true);
  const [showDon, setShowDon] = useState(false);
  const [donWin, setDonWin] = useState(0);
  const [pendingDonMult, setPendingDonMult] = useState(0);

  // Auth state
  const [session, setSession] = useState<SessionData | null>(getSession);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authNickname, setAuthNickname] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);

  const boardR = useRef<PlinkoBoard | null>(null);
  const gsR = useRef(gs);
  const tickR = useRef<number>(0);
  const autoDR = useRef(false);
  const autoBetR = useRef(10);
  const autoCntR = useRef(1);
  const hIdR = useRef(0);

  const lastTapR = useRef(0);
  const tapCntR = useRef(0);
  const fatTR = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rtpR = useRef(rtp);
  const sndR = useRef(sndOn);
  const pegHR = useRef(0);
  const deferredPromptRef = useRef<Event | null>(null);
  const saveTimerR = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionR = useRef(session);
  const leaderboardTimerR = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = useMemo(() => getTranslations(lang), [lang]);
  const C = t.currency;

  useEffect(() => { gsR.current = gs; }, [gs]);
  useEffect(() => { autoDR.current = autoD; }, [autoD]);

  useEffect(() => { rtpR.current = rtp; }, [rtp]);
  useEffect(() => { sndR.current = sndOn; }, [sndOn]);
  useEffect(() => { sessionR.current = session; }, [session]);
  useEffect(() => { initTelegram(); }, []);

  // Connection status listener
  useEffect(() => {
    const unsub = onConnectionStatusChange(setApiOnline);
    return unsub;
  }, []);

  // Also save to localStorage as backup whenever gs changes
  useEffect(() => {
    saveState(gs);
  }, [gs]);

  // Load progress from DB when session exists
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoadingProgress(true);

    apiGetProgress(session.playerId)
      .then(progress => {
        if (cancelled) return;
        const base = createDefaultState();
        const loaded = progressToState(progress, base);
        setGs(loaded);
        saveLocalProgress(progress);
        if (canClaimDaily(loaded)) setShowDaily(true);
      })
      .catch(() => {
        if (cancelled) return;
        // Fallback: try local backup
        const local = loadLocalProgress();
        if (local && local.player_id === session.playerId) {
          const base = createDefaultState();
          setGs(progressToState(local, base));
          toast.warning('⚠️ Offline — використовуємо кешовані дані', { duration: 3000 });
        } else {
          setGs(createDefaultState());
        }
      })
      .finally(() => { if (!cancelled) setLoadingProgress(false); });

    return () => { cancelled = true; };
  }, [session?.playerId]); // eslint-disable-line

  // Auto-save progress to DB every SAVE_INTERVAL ms
  useEffect(() => {
    if (!session) return;
    saveTimerR.current = setInterval(() => {
      const s = sessionR.current;
      if (!s) return;
      const data = stateToProgress(s.playerId, gsR.current);
      apiSaveProgress(data); // Fire-and-forget with built-in retry + local backup
    }, SAVE_INTERVAL);
    return () => { if (saveTimerR.current) clearInterval(saveTimerR.current); };
  }, [session?.playerId]); // eslint-disable-line

  // Save on page unload using beacon
  useEffect(() => {
    const handleUnload = () => {
      const s = sessionR.current;
      if (!s) return;
      const data = stateToProgress(s.playerId, gsR.current);
      beaconSaveProgress(data);
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // Load leaderboard
  useEffect(() => {
    if (!session) return;
    apiGetLeaderboard().then(setLeaderboard).catch(() => {});
    leaderboardTimerR.current = setInterval(() => {
      apiGetLeaderboard().then(setLeaderboard).catch(() => {});
    }, 30000);
    return () => { if (leaderboardTimerR.current) clearInterval(leaderboardTimerR.current); };
  }, [session?.playerId]); // eslint-disable-line

  // Daily offer
  useEffect(() => {
    if (!session || !shouldShowDailyOffer()) return;
    const timer = setTimeout(() => setShowDailyOffer(true), 2000);
    return () => clearTimeout(timer);
  }, [session]);

  // Check daily bonus on tab focus / visibility change
  useEffect(() => {
    if (!session) return;
    const checkDaily = () => {
      if (document.visibilityState === 'visible' && canClaimDaily(gsR.current) && !showDaily) {
        setShowDaily(true);
      }
    };
    document.addEventListener('visibilitychange', checkDaily);
    // Also check periodically (every 60s) in case user keeps tab open across midnight
    const iv = setInterval(() => {
      if (canClaimDaily(gsR.current) && !showDaily) {
        setShowDaily(true);
      }
    }, 60000);
    return () => {
      document.removeEventListener('visibilitychange', checkDaily);
      clearInterval(iv);
    };
  }, [session, showDaily]);

  // PWA install
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      const dismissed = localStorage.getItem('plinko_pwa_dismissed');
      if (!dismissed) setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    const isIos = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isIos && !isStandalone) {
      const dismissed = localStorage.getItem('plinko_pwa_dismissed');
      if (!dismissed) {
        iosTimer = setTimeout(() => setShowInstallBanner(true), 5000);
      }
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  // Confetti
  const hasParticles = particles.length > 0;
  useEffect(() => {
    if (!hasParticles) return;
    const iv = setInterval(() => {
      setParticles(prev => {
        const next = prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.15, life: p.life - 0.02 })).filter(p => p.life > 0);
        if (next.length === 0) clearInterval(iv);
        return next;
      });
    }, 16);
    return () => clearInterval(iv);
  }, [hasParticles]);

  const spawnConfetti = useCallback(() => {
    const colors = ['#f59e0b', '#a855f7', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
    const np: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      np.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 100,
        y: window.innerHeight * 0.4,
        vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 10 - 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5, life: 1,
      });
    }
    setParticles(prev => [...prev, ...np]);
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
          // Enhanced achievement notifications
          for (const achId of res.achievementUnlocked) {
            const ach = nx.achievements.find(a => a.id === achId);
            if (ach) {
              setTimeout(() => {
                toast.success(`🏆 ${ach.emoji} Achievement Unlocked!\n${achId}`, { duration: 4000 });
                hapticSuccess();
              }, 500);
            }
          }
          if (res.comboBonus > 0) { nx.balance += res.comboBonus; toast(`🔥 ${t.comboBonus} +${res.comboBonus}${C}`, { duration: 1500 }); }
          if (res.shieldUsed) toast(t.shieldSaved, { duration: 1500 });
          return nx;
        });
        setLastMult(mult);
        const eid = ++hIdR.current;
        setHist(p => [...p, { id: eid, bet, multiplier: mult, win: bet * mult }].slice(-20));
        if (sndR.current) playSlotLand(mult);
        if (mult >= 5) { setBigWin(true); hapticSuccess(); spawnConfetti(); setTimeout(() => setBigWin(false), 2000); toast.success(`🎉 ${mult}x → +${Math.floor(bet * mult)} ${C}`, { duration: 3000 }); }
        else if (mult >= 3) { haptic('medium'); toast(`✨ ${mult}x`, { duration: 1500 }); }
        // Double or Nothing trigger for wins >= 2x (max 3 per session)
        if (mult >= 2 && gsR.current.doubleOrNothingUsed < MAX_DOUBLE_OR_NOTHING) {
          const winAmt = Math.floor(bet * mult);
          setDonWin(winAmt);
          setPendingDonMult(mult);
          setTimeout(() => setShowDon(true), 800);
        }
      }
      setBoard({ ...cb });
      tickR.current = requestAnimationFrame(tick);
    };
    tickR.current = requestAnimationFrame(tick);
    return () => { if (tickR.current) cancelAnimationFrame(tickR.current); };
  }, [t, C, spawnConfetti]);

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
    // Show conversion popup max once per day
    if (nd >= 15) {
      const today = new Date().toISOString().slice(0, 10);
      const lastShown = localStorage.getItem(CONVERSION_POPUP_DATE_KEY);
      if (lastShown !== today) {
        setShowPopup(true);
        localStorage.setItem(CONVERSION_POPUP_DATE_KEY, today);
      }
    }
    if (nd > 0 && nd % LUCKY_INTERVAL === 0) { const b = Math.floor(10 + Math.random() * 90); setGs(p => ({ ...p, balance: p.balance + b })); if (sndR.current) playBonus(); hapticSuccess(); toast.success(`🍀 +${b} ${C}!`, { duration: 2000 }); }
  }, [C]);

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
    if (Date.now() - gsR.current.lastHourlyBonus < 3600000) return;
    // Give guaranteed coin bonus + free ball
    const coinBonus = HOURLY_COIN_BONUS_MIN + Math.floor(Math.random() * (HOURLY_COIN_BONUS_MAX - HOURLY_COIN_BONUS_MIN + 1));
    setGs(p => ({
      ...p,
      lastHourlyBonus: Date.now(),
      balance: p.balance + coinBonus,
      totalWon: p.totalWon + coinBonus,
    }));
    const skin = getSkinById(gsR.current.selectedSkin);
    dropBall(boardR.current, 0, 95, skin.color, skin.glow, skin.trail, skin.id, false);
    if (sndR.current) playBonus(); hapticSuccess();
    spawnConfetti();
    toast.success(`🎰 +${coinBonus} ${C} + 🎱!`, { duration: 3000 });
  }, [C, spawnConfetti]);

  const handleWheel = useCallback(() => {
    setShowWhl(true); setWhlSpin(true); setWhlPrize(null);
    setTimeout(() => {
      setGs(p => {
        const prize = spinWheel(p);
        setWhlPrize(prize); setWhlSpin(false);
        if (sndR.current) playBonus(); hapticSuccess();
        spawnConfetti();
        toast.success(`🎡 ${t.fortuneWheel}: +${prize} ${C}!`, { duration: 3500 });
        return { ...p, balance: p.balance + prize, totalWon: p.totalWon + prize };
      });
    }, 2500);
    // Keep wheel visible longer so user sees the prize
    setTimeout(() => setShowWhl(false), 7000);
  }, [C, t, spawnConfetti]);

  const handleClaimDaily = useCallback(() => {
    setGs(p => {
      const nx = { ...p, lastDailyBonus: Date.now() };
      const streakResult = checkAndUpdateStreak(nx);
      const totalReward = DAILY_BONUS + streakResult.reward;
      nx.balance += totalReward;
      if (streakResult.reward > 0) {
        toast.success(`🔥 ${t.loginStreak} x${streakResult.newStreak}! +${streakResult.reward} ${C}`, { duration: 3000 });
      }
      return nx;
    });
    setShowDaily(false);
    if (sndR.current) playBonus(); hapticSuccess();
    toast.success(`+${DAILY_BONUS} ${C}!`, { duration: 2000 });
  }, [C, t]);

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

  const handleDonResult = useCallback((won: boolean, amount: number) => {
    setShowDon(false);
    setGs(p => ({
      ...p,
      doubleOrNothingUsed: p.doubleOrNothingUsed + 1,
      balance: won ? p.balance + amount : p.balance,
      totalWon: won ? p.totalWon + amount : p.totalWon,
    }));
    if (won) {
      if (sndR.current) playBonus();
      hapticSuccess();
      spawnConfetti();
      toast.success(`🎲 Double! +${amount} ${C}!`, { duration: 3000 });
    } else {
      toast(`🎲 No luck this time!`, { duration: 2000 });
    }
  }, [C, spawnConfetti]);

  const handleDonDismiss = useCallback(() => {
    setShowDon(false);
  }, []);

  const handleClaimCh = useCallback((id: string, type: 'daily' | 'weekly') => {
    setGs(p => {
      const nx = { ...p };
      if (type === 'daily') {
        nx.dailyChallenges = p.dailyChallenges.map(ch => {
          if (ch.id === id && ch.progress >= ch.target && !ch.claimed) {
            nx.balance += ch.reward; if (sndR.current) playBonus(); hapticSuccess();
            toast.success(`+${ch.reward} ${C}!`, { duration: 1500 });
            return { ...ch, claimed: true };
          }
          return ch;
        });
      } else {
        nx.weeklyChallenges = p.weeklyChallenges.map(wm => {
          if (wm.id === id && wm.progress >= wm.target && !wm.claimed) {
            nx.balance += wm.reward; if (sndR.current) playBonus(); hapticSuccess();
            toast.success(`+${wm.reward} ${C}!`, { duration: 1500 });
            return { ...wm, claimed: true };
          }
          return wm;
        });
      }
      return nx;
    });
  }, [C]);

  const handlePrestige = useCallback(() => {
    setGs(p => {
      if (!canPrestige(p)) return p;
      const nx = { ...p }; doPrestige(nx);
      if (sndR.current) playBonus(); hapticSuccess();
      toast.success(`⭐ ${t.prestige} ${nx.prestigeLevel}!`, { duration: 3000 });
      return nx;
    });
  }, [t]);

  const handleResetBalance = useCallback(() => {
    const fresh = createDefaultState();
    setGs(fresh);
    if (sessionR.current) {
      apiSaveProgress(stateToProgress(sessionR.current.playerId, fresh));
    }
  }, []);

  const handleInstallPWA = useCallback(async () => {
    const prompt = deferredPromptRef.current as any;
    if (prompt?.prompt) { prompt.prompt(); await prompt.userChoice; }
    setShowInstallBanner(false);
  }, []);

  const dismissInstallBanner = useCallback(() => {
    setShowInstallBanner(false);
    localStorage.setItem('plinko_pwa_dismissed', 'true');
  }, []);

  // Auth handlers
  const handleAuth = useCallback(async () => {
    setAuthError('');
    const nick = authNickname.trim();
    if (nick.length < 3) { setAuthError(t.authMinNickname); return; }
    if (nick.length > 20) { setAuthError(t.authMinNickname); return; }
    if (authPassword.length < 4) { setAuthError(t.authMinPassword); return; }
    if (authMode === 'register' && authPassword !== authConfirm) { setAuthError(t.authPasswordMismatch); return; }

    setAuthLoading(true);
    try {
      let result;
      if (authMode === 'register') {
        result = await apiRegister(nick, authPassword);
      } else {
        result = await apiLogin(nick, authPassword);
      }
      const sessionData: SessionData = {
        playerId: result.id,
        nickname: result.nickname,
        token: result.token,
        isAdmin: result.is_admin,
      };
      saveSession(sessionData);
      setSession(sessionData);
      toast.success(t.authSuccess);
    } catch (err: any) {
      const detail = getErrorDetail(err);
      if (detail.includes('already exists')) setAuthError(t.authUserExists);
      else if (detail.includes('not found')) setAuthError(t.authUserNotFound);
      else if (detail.includes('Wrong password')) setAuthError(t.authWrongPassword);
      else if (detail.includes('timeout') || detail.includes('Timeout')) setAuthError('Сервер не відповідає. Спробуйте пізніше.');
      else setAuthError(detail);
    } finally {
      setAuthLoading(false);
    }
  }, [authMode, authNickname, authPassword, authConfirm, t]);

  const handleLogout = useCallback(() => {
    // Save progress before logout
    if (sessionR.current) {
      const data = stateToProgress(sessionR.current.playerId, gsR.current);
      saveLocalProgress(data);
      apiSaveProgress(data);
    }
    clearSession();
    setSession(null);
    setAuthNickname('');
    setAuthPassword('');
    setAuthConfirm('');
    setGs(createDefaultState());
    setLeaderboard([]);
  }, []);

  const isAdmin = useMemo(() => {
    if (!session) return false;
    if (session.isAdmin) return true;
    if (isPlayerAdmin(session.nickname)) return true;
    if (isAdminLoggedIn()) {
      const aid = getAdminTgId();
      const tid = getTelegramUserId();
      if (tid && aid && tid === aid) return true;
    }
    return false;
  }, [session]);

  const tgP = isTelegram() ? 'pt-2' : 'pt-0';
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

  // ==================== AUTH SCREEN ====================
  if (!session) {
    return (
      <div className="h-dvh bg-[#06000f] text-white flex items-center justify-center px-4" style={{ touchAction: 'manipulation' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0018] via-[#06000f] to-[#030006]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15)_0%,transparent_60%)]" />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute w-64 h-64 rounded-full bg-purple-600/5 blur-3xl" style={{ left: '10%', top: '20%', animation: 'orb-float 8s ease-in-out infinite' }} />
          <div className="absolute w-48 h-48 rounded-full bg-amber-500/5 blur-3xl" style={{ right: '10%', bottom: '30%', animation: 'orb-float 10s ease-in-out infinite reverse' }} />
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rounded-full"
              style={{
                width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
                background: i % 2 === 0 ? 'rgba(139,92,246,0.3)' : 'rgba(245,158,11,0.3)',
                left: `${5 + (i * 5) % 90}%`, top: `${5 + (i * 7) % 90}%`,
                animation: `float-particle ${3 + (i % 4) * 1.5}s ease-in-out infinite`,
                animationDelay: `${(i * 0.3) % 4}s`,
              }} />
          ))}
        </div>

        {/* Decorative side panels for PC */}
        <div className="hidden lg:flex absolute left-0 top-0 bottom-0 w-1/4 items-center justify-center">
          <div className="text-center opacity-15">
            <div className="text-8xl mb-4 animate-bounce" style={{ animationDuration: '3s' }}>🎱</div>
            <div className="text-4xl font-black bg-gradient-to-b from-purple-400 to-amber-400 bg-clip-text text-transparent">PLINKO</div>
            <div className="text-sm text-amber-400/50 mt-2">WIN BIG</div>
          </div>
        </div>
        <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-1/4 items-center justify-center">
          <div className="text-center opacity-15">
            <div className="text-6xl mb-2">💰</div>
            <div className="text-2xl font-bold text-amber-400/30">DEMO</div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm w-full mx-auto auth-card-enter">
          <div className="rounded-3xl border border-purple-500/20 bg-[#12082a]/90 backdrop-blur-xl p-6 lg:p-8 text-center shadow-[0_0_80px_rgba(139,92,246,0.15),0_0_160px_rgba(139,92,246,0.05)]">
            {/* Logo */}
            <div className="relative inline-block mb-3">
              <div className="text-5xl animate-bounce" style={{ animationDuration: '2s' }}>🎱</div>
              <div className="absolute -inset-4 bg-purple-500/10 rounded-full blur-xl" />
            </div>
            <h1 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-purple-400 via-amber-400 to-purple-400 bg-clip-text text-transparent mb-1 bg-[length:200%_auto]" style={{ animation: 'gradient-shift 3s linear infinite' }}>PLINKO</h1>
            <p className="text-sm text-white/40 mb-5">{t.welcomeMsg}</p>

            {/* Auth mode tabs */}
            <div className="flex mb-4 bg-white/[0.03] rounded-xl p-1 border border-white/[0.06]">
              <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthConfirm(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${authMode === 'login' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'text-white/30 hover:text-white/50'}`}>
                {t.authLogin}
              </button>
              <button onClick={() => { setAuthMode('register'); setAuthError(''); }}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${authMode === 'register' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'text-white/30 hover:text-white/50'}`}>
                {t.authRegister}
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">👤</div>
                <input type="text" value={authNickname} onChange={e => setAuthNickname(e.target.value.replace(/\s/g, '').slice(0, 20))}
                  placeholder={t.nickname} maxLength={20}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all duration-200" />
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔒</div>
                <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)}
                  placeholder={t.authPassword}
                  onKeyDown={e => { if (e.key === 'Enter' && authMode === 'login') handleAuth(); }}
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all duration-200" />
              </div>
              {authMode === 'register' && (
                <div className="relative auth-field-enter">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 text-sm">🔒</div>
                  <input type="password" value={authConfirm} onChange={e => setAuthConfirm(e.target.value)}
                    placeholder={t.authConfirmPassword}
                    onKeyDown={e => { if (e.key === 'Enter') handleAuth(); }}
                    className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.07] transition-all duration-200" />
                </div>
              )}

              {authError && (
                <div className="text-red-400 text-xs font-bold bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 auth-error-enter flex items-center gap-2">
                  <span className="text-base">⚠️</span>
                  <span>{authError}</span>
                </div>
              )}

              <button onClick={handleAuth} disabled={authLoading || authNickname.trim().length < 3 || authPassword.length < 4}
                className="w-full py-3.5 rounded-2xl font-black text-base text-amber-900 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 active:scale-95 transition-all min-h-[48px] shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-40 disabled:active:scale-100 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
                <span className="relative z-10">
                  {authLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-amber-900/30 border-t-amber-900 rounded-full animate-spin" />
                      <span>{authMode === 'login' ? t.authLogin : t.authRegister}...</span>
                    </span>
                  ) : (
                    <span>{authMode === 'login' ? t.authLogin : t.authRegister} 🚀</span>
                  )}
                </span>
              </button>
            </div>

            <div className="mt-4">
              <LanguageSelector currentLang={lang} onChangeLang={(l: Language) => { setLang(l); saveLanguage(l); }} />
            </div>
          </div>
        </div>

        <style>{`
          @keyframes float-particle {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
            50% { transform: translateY(-30px) scale(1.5); opacity: 0.6; }
          }
          @keyframes orb-float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -20px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }
          @keyframes gradient-shift {
            0% { background-position: 0% center; }
            100% { background-position: 200% center; }
          }
          @keyframes auth-card-in {
            0% { transform: scale(0.9) translateY(20px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          @keyframes auth-field-in {
            0% { transform: translateY(-8px); opacity: 0; max-height: 0; }
            100% { transform: translateY(0); opacity: 1; max-height: 60px; }
          }
          @keyframes auth-error-in {
            0% { transform: translateX(-5px); opacity: 0; }
            50% { transform: translateX(3px); }
            100% { transform: translateX(0); opacity: 1; }
          }
          .auth-card-enter { animation: auth-card-in 0.5s ease-out; }
          .auth-field-enter { animation: auth-field-in 0.3s ease-out; }
          .auth-error-enter { animation: auth-error-in 0.3s ease-out; }
          @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        `}</style>
      </div>
    );
  }

  // ==================== LOADING SCREEN ====================
  if (loadingProgress) {
    return (
      <div className="h-dvh bg-[#06000f] text-white flex items-center justify-center" style={{ touchAction: 'manipulation' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0018] via-[#06000f] to-[#030006]" />
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-4 animate-bounce">🎱</div>
          <div className="w-48 h-1.5 rounded-full bg-white/[0.06] overflow-hidden mx-auto mb-3">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400" style={{ animation: 'loading-bar 1.5s ease-in-out infinite', width: '60%' }} />
          </div>
          <div className="text-sm font-bold text-purple-300/60 animate-pulse">{t.welcome}</div>
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { width: 10%; margin-left: 0; }
            50% { width: 60%; margin-left: 20%; }
            100% { width: 10%; margin-left: 90%; }
          }
        `}</style>
      </div>
    );
  }

  // ==================== MAIN GAME ====================
  return (
    <div className={`h-dvh bg-[#06000f] text-white relative overflow-hidden flex flex-col ${tgP}`} style={{ touchAction: 'manipulation' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0018] via-[#06000f] to-[#030006]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.04)_0%,transparent_60%)]" />

      {/* Connection status indicator */}
      <ConnectionIndicator online={apiOnline} />

      {/* Decorative side panels for PC */}
      <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[calc(50%-240px)] bg-gradient-to-r from-[#06000f] via-[#08001a] to-transparent z-20 pointer-events-none">
        <div className="flex items-center justify-center h-full">
          <div className="text-center opacity-10">
            <div className="text-7xl mb-4">🎱</div>
            <div className="text-3xl font-black text-purple-400">PLINKO</div>
          </div>
        </div>
      </div>
      <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-[calc(50%-240px)] bg-gradient-to-l from-[#06000f] via-[#08001a] to-transparent z-20 pointer-events-none">
        <div className="flex items-center justify-center h-full">
          <div className="text-center opacity-10">
            <div className="text-6xl mb-4">💰</div>
            <div className="text-2xl font-bold text-amber-400">WIN BIG</div>
          </div>
        </div>
      </div>

      {bigWin && <div className="absolute inset-0 z-30 pointer-events-none"><div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-amber-500/10 animate-pulse" style={{ animationDuration: '0.3s' }} /></div>}

      {hasParticles && (
        <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
          {particles.map((p, i) => (
            <div key={i} className="absolute rounded-sm" style={{
              left: p.x, top: p.y, width: p.size, height: p.size,
              backgroundColor: p.color, opacity: p.life,
              transform: `rotate(${p.vx * 20}deg)`,
            }} />
          ))}
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 max-w-md mx-auto w-full px-2 flex flex-col flex-1 min-h-0 lg:border-x lg:border-white/[0.03] lg:bg-[#06000f]/50">
        {/* Header */}
        <header className="flex items-center justify-between flex-shrink-0 py-0.5 lg:py-1">
          <div className="flex items-center gap-1">
            <h1 className="text-sm lg:text-base font-black bg-gradient-to-r from-purple-400 via-amber-400 to-purple-400 bg-clip-text text-transparent leading-tight">🎱 PLINKO</h1>
            {isAdmin && <button onClick={() => setShowSet(true)} className="w-5 h-5 lg:w-6 lg:h-6 rounded-md bg-white/[0.03] border border-white/[0.05] text-white/15 hover:text-white/40 flex items-center justify-center text-[8px] lg:text-[10px]">⚙</button>}
          </div>
          <div className="flex items-center gap-1">
            {!apiOnline && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse mr-0.5" title="Offline" />}
            <span className="text-[8px] lg:text-[10px] text-purple-300/40 font-bold truncate max-w-[60px] lg:max-w-[100px]">{session.nickname}</span>
            <button onClick={handleLogout} className="text-[7px] lg:text-[9px] text-red-400/40 hover:text-red-400 transition-colors" title={t.logout}>🚪</button>
            <LanguageSelector currentLang={lang} onChangeLang={(l: Language) => { setLang(l); saveLanguage(l); }} />
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-shrink-0 mb-1">
          <PlinkoCanvas board={board} theme={getThemeById(gs.selectedTheme)} />
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-[100px] lg:pb-[110px]">
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
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 space-y-1.5">
                <div className="text-[10px] lg:text-xs font-bold text-white/30">{t.dailyChallenges}</div>
                {gs.dailyChallenges.map(ch => {
                  const done = ch.progress >= ch.target;
                  return (
                    <div key={ch.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${done && !ch.claimed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] lg:text-xs font-bold text-white/50">{chLabel(ch)}</div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-500" style={{ width: `${Math.min(100, (ch.progress / ch.target) * 100)}%` }} />
                        </div>
                        <div className="text-[8px] text-white/20 mt-0.5">{ch.progress}/{ch.target}</div>
                      </div>
                      {done && !ch.claimed ? <button onClick={() => handleClaimCh(ch.id, 'daily')} className="px-2.5 py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 active:scale-95 min-h-[32px] transition-transform">+{ch.reward}{C}</button>
                        : ch.claimed ? <span className="text-[9px] text-emerald-400/50">✓</span>
                        : <span className="text-[9px] text-white/15">{ch.reward}{C}</span>}
                    </div>
                  );
                })}
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5 space-y-1.5">
                <div className="text-[10px] lg:text-xs font-bold text-white/30">{t.weeklyChallenges}</div>
                {gs.weeklyChallenges.map(wm => {
                  const done = wm.progress >= wm.target;
                  return (
                    <div key={wm.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${done && !wm.claimed ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/[0.02] border-white/[0.04]'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] lg:text-xs font-bold text-white/50">{wkLabel(wm)}</div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500" style={{ width: `${Math.min(100, (wm.progress / wm.target) * 100)}%` }} />
                        </div>
                        <div className="text-[8px] text-white/20 mt-0.5">{wm.progress}/{wm.target}</div>
                      </div>
                      {done && !wm.claimed ? <button onClick={() => handleClaimCh(wm.id, 'weekly')} className="px-2.5 py-1.5 rounded-lg text-[9px] lg:text-[11px] font-bold bg-amber-500/30 border border-amber-400/40 text-amber-300 active:scale-95 min-h-[32px] transition-transform">+{wm.reward}{C}</button>
                        : wm.claimed ? <span className="text-[9px] text-amber-400/50">✓</span>
                        : <span className="text-[9px] text-white/15">{wm.reward}{C}</span>}
                    </div>
                  );
                })}
              </div>
              {/* Leaderboard */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
                <div className="text-[10px] lg:text-xs font-bold text-white/30 mb-1.5">🏆 {t.leaderboard}</div>
                <div className="space-y-0.5">
                  {leaderboard.length === 0 ? (
                    <div className="text-center text-[10px] text-white/20 py-2">—</div>
                  ) : (
                    leaderboard.map((e, i) => (
                      <div key={`${e.nickname}-${i}`} className={`flex items-center justify-between text-[10px] lg:text-xs px-2 py-1 rounded-lg transition-colors ${e.nickname === session.nickname ? 'bg-amber-500/10 border border-amber-500/20' : ''}`}>
                        <span className="text-white/25 w-5 font-bold">{i + 1}.</span>
                        <span className={`flex-1 ${e.nickname === session.nickname ? 'text-amber-400 font-bold' : 'text-white/35'}`}>
                          {e.prestige_level > 0 && <span className="text-amber-400/60">{'⭐'.repeat(Math.min(e.prestige_level, 3))} </span>}
                          {e.nickname}
                        </span>
                        <span className="text-white/20 text-[8px] mr-2">Lv.{e.level}</span>
                        <span className="text-white/25 tabular-nums font-bold">{Math.floor(e.total_won).toLocaleString()}{C}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          {tab === 'profile' && (
            <div className="space-y-2">
              <div className="rounded-xl bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-400/15 p-3 text-center">
                {gs.prestigeLevel > 0 && <div className="text-amber-400 text-sm mb-0.5">{'⭐'.repeat(Math.min(gs.prestigeLevel, 10))}</div>}
                <div className="text-2xl lg:text-3xl font-black text-purple-300">{t.level} {gs.level}</div>
                <div className="text-xs text-white/30 mb-1">{session.nickname}</div>
                <div className="mx-auto max-w-[200px] mt-1">
                  <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500" style={{ width: `${xpP}%` }} />
                  </div>
                  <div className="text-[8px] text-white/20 mt-0.5">{gs.xp}/{xpN} {t.xp}</div>
                </div>
                {gs.prestigeLevel > 0 && <div className="text-[9px] text-amber-400/50 mt-1">{t.prestigeBonus} (x{gs.prestigeLevel})</div>}
                {gs.loginStreak > 0 && (
                  <div className="mt-1.5 flex items-center justify-center gap-1">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold text-orange-400">{t.loginStreak}: {gs.loginStreak} {gs.loginStreak === 1 ? t.day : t.day + 's'}</span>
                  </div>
                )}
                {canPrestige(gs) && (
                  <button onClick={handlePrestige} className="mt-2 px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-500 to-orange-500 border border-amber-400/40 text-white active:scale-95 transition-all min-h-[44px]">
                    {t.prestigeBtn}
                  </button>
                )}
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
                <div className="text-[10px] lg:text-xs font-bold text-white/30 mb-1">📊 {t.stats}</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    [t.totalDrops, gs.totalDrops], [t.totalWon, Math.floor(gs.totalWon)],
                    [t.totalSpent, Math.floor(gs.totalSpent)], [t.biggestWin, Math.floor(gs.biggestWin)],
                    [t.maxComboLabel, gs.maxCombo], [t.prestige, gs.prestigeLevel],
                  ].map(([label, val], i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <div className="text-[8px] lg:text-[10px] text-white/20">{label}</div>
                      <div className="text-[11px] lg:text-sm font-bold text-white/50 tabular-nums">{typeof val === 'number' ? val.toLocaleString() : val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-2.5">
                <div className="text-[10px] lg:text-xs font-bold text-white/30 mb-1">🏆 {t.achievements}</div>
                <div className="flex flex-wrap gap-1">
                  {gs.achievements.map(ach => (
                    <div key={ach.id} className={`px-2 py-1 rounded-lg text-[9px] border transition-all ${ach.unlocked ? 'bg-amber-500/15 border-amber-500/25 text-amber-400' : 'bg-white/[0.02] border-white/[0.04] text-white/15'}`}>
                      {ach.emoji} {achL[ach.id] || ach.id}
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleLogout} className="w-full py-2 rounded-xl text-xs font-bold text-red-400/50 bg-red-500/5 border border-red-500/10 hover:text-red-400 hover:bg-red-500/10 transition-all">
                🚪 {t.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="max-w-md mx-auto">
          <div className="px-2 mb-0.5">
            <button onClick={() => openLink(refUrl)}
              className="w-full py-2 lg:py-2.5 rounded-2xl font-black text-sm lg:text-base text-amber-900 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 active:scale-[0.97] transition-all relative overflow-hidden border border-amber-300/50"
              style={{ animation: 'ref-btn-pulse 3s ease-in-out infinite' }}>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" style={{ animation: 'shimmer 2.5s ease-in-out infinite' }} />
              <span className="relative z-10">{t.playForReal}</span>
            </button>
          </div>
          <div className="bg-[#0a0018]/95 backdrop-blur-md border-t border-white/[0.06]">
            <div className="flex">
              {([
                { id: 'game' as MainTab, icon: '🎮', label: t.game, badge: false },
                { id: 'shop' as MainTab, icon: '🛒', label: t.shop, badge: false },
                { id: 'tasks' as MainTab, icon: '📋', label: t.tasks, badge: taskBadge },
                { id: 'profile' as MainTab, icon: '🏆', label: t.profile, badge: false },
              ]).map(item => (
                <button key={item.id} onClick={() => { setTab(item.id); haptic('light'); }}
                  className={`flex-1 py-2 lg:py-2.5 flex flex-col items-center gap-0.5 transition-all relative ${tab === item.id ? 'text-purple-300' : 'text-white/25'}`}>
                  <span className="text-base lg:text-lg">{item.icon}</span>
                  <span className="text-[7px] lg:text-[9px] font-bold">{item.label}</span>
                  {item.badge && <div className="absolute top-1 right-[30%] w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
                  {tab === item.id && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 rounded-full bg-purple-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 p-2 animate-slide-down">
          <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-r from-purple-900/95 to-indigo-900/95 backdrop-blur-md border border-purple-500/30 p-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(139,92,246,0.3)]">
            <div className="text-2xl">📱</div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white">{t.installApp}</div>
              <div className="text-[9px] text-white/50">{t.installAppMsg}</div>
            </div>
            <button onClick={handleInstallPWA} className="px-3 py-1.5 rounded-xl text-[10px] font-bold bg-amber-500 text-amber-900 active:scale-95 transition-all flex-shrink-0">{t.installBtn}</button>
            <button onClick={dismissInstallBanner} className="text-white/30 text-xs flex-shrink-0">✕</button>
          </div>
        </div>
      )}

      {/* Popups */}
      {showDaily && (() => {
        const nextStreak = gs.lastLoginDate === new Date().toISOString().slice(0, 10) ? gs.loginStreak : (gs.lastLoginDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10) ? gs.loginStreak + 1 : 1);
        const streakReward = getStreakReward(nextStreak);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" style={{ touchAction: 'manipulation' }}>
            <div className="relative max-w-xs w-full mx-4 rounded-2xl bg-[#12082a] border border-amber-500/30 p-6 text-center popup-enter">
              <div className="text-4xl mb-2">🎁</div>
              <h3 className="text-lg font-black text-amber-400 mb-1">{t.dailyBonus}</h3>
              <p className="text-sm text-white/50 mb-2">{t.dailyBonusMsg}</p>
              {/* Streak display */}
              <div className="mb-3 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/20">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-black text-orange-400">{t.loginStreak}: {t.day} {nextStreak}</span>
                </div>
                <div className="flex justify-center gap-1">
                  {[1,2,3,4,5,6,7].map(d => (
                    <div key={d} className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold border transition-all ${d <= nextStreak ? 'bg-orange-500/30 border-orange-400/50 text-orange-300' : 'bg-white/[0.03] border-white/[0.06] text-white/15'}`}>
                      {d <= nextStreak ? '🔥' : d}
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-orange-400/60 mt-1">+{streakReward} {C} streak bonus{nextStreak >= 7 ? ' + 📦' : ''}</div>
              </div>
              <button onClick={handleClaimDaily} className="w-full py-3 rounded-xl font-black text-base text-amber-900 bg-gradient-to-r from-amber-400 to-yellow-400 active:scale-95 transition-all min-h-[48px]">
                {t.claim} +{DAILY_BONUS + streakReward} {C}
              </button>
            </div>
          </div>
        );
      })()}

      <DailyOffer show={showDailyOffer} t={t} referralUrl={refUrl} onClose={() => { setShowDailyOffer(false); markDailyOfferSeen(); }} />
      <ConversionPopup show={showPopup} t={t} onDismiss={() => { setShowPopup(false); }} referralUrl={refUrl} />
      <BankruptPopup show={showBankr} t={t} referralUrl={refUrl} onDismiss={() => { setShowBankr(false); setGs(p => ({ ...p, balance: p.balance + 5 })); }} />
      <DoubleOrNothing show={showDon} lastWin={donWin} currency={C} t={t} onResult={handleDonResult} onDismiss={handleDonDismiss} />
      <SettingsPanel show={showSet} onClose={() => setShowSet(false)} t={t} onRtpChange={setRtp} onResetBalance={handleResetBalance} />

      <style>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes ref-btn-pulse { 0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.3); } 50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.6); } }
        @keyframes slide-down { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .animate-slide-down { animation: slide-down 0.3s ease-out; }
        .popup-enter { animation: scale-in 0.3s ease-out; }
        @keyframes scale-in { 0% { transform: scale(0.8); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}