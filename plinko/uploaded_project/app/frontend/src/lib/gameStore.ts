// ============================================================
// Game Store: All state, shop, boosters, progression, prestige
// ============================================================

const SAVE_KEY = 'plinko_store_v2';

// ==================== TYPES ====================

export type BoardThemeId = 'default' | 'ocean' | 'neon_city' | 'forest' | 'volcano' | 'space';

export interface BallSkin {
  id: string;
  name: string;
  emoji: string;
  color: string;
  glow: string;
  trail: string;
  unlockLevel: number; // 0 = shop only
  price: number; // 0 = free/level unlock
  category: 'free' | 'premium';
}

export interface BoardTheme {
  id: BoardThemeId;
  name: string;
  emoji: string;
  price: number;
  bgColor: string;
  pegColor: string;
  pegGlow: string;
  ambientColor: string;
}

export interface Booster {
  id: string;
  name: string;
  emoji: string;
  description: string;
  price: number;
  durationMs: number; // 0 = instant/count-based
  uses: number; // 0 = time-based
}

export interface ActiveBooster {
  id: string;
  expiresAt: number; // timestamp
  usesLeft: number; // for count-based
}

export interface DailyChallenge {
  id: string;
  type: 'drops' | 'multiplier' | 'combo' | 'spend';
  target: number;
  reward: number;
  progress: number;
  claimed: boolean;
}

export interface WeeklyMission {
  id: string;
  type: 'drops' | 'shopBuy' | 'level';
  target: number;
  reward: number;
  progress: number;
  claimed: boolean;
}

export interface Achievement {
  id: string;
  emoji: string;
  target: number;
  progress: number;
  unlocked: boolean;
}

export interface GameState {
  balance: number;
  totalDrops: number;
  totalWon: number;
  totalSpent: number;
  biggestWin: number;
  tapCount: number;
  // Progression
  level: number;
  xp: number;
  prestigeLevel: number;
  // Skins & themes
  selectedSkin: string;
  ownedSkins: string[];
  selectedTheme: BoardThemeId;
  ownedThemes: BoardThemeId[];
  // Boosters
  activeBoosters: ActiveBooster[];
  // Challenges
  dailyChallenges: DailyChallenge[];
  dailyChallengeDate: string;
  weeklyChallenges: WeeklyMission[];
  weeklyResetDate: string;
  // Achievements
  achievements: Achievement[];
  // Combo
  comboCount: number;
  comboLastTime: number;
  maxCombo: number;
  consecutiveLosses: number;
  // Fortune wheel
  lastWheelSpin: number;
  // Hourly bonus
  lastHourlyBonus: number;
  // Daily bonus
  lastDailyBonus: number;
  // Shop stats
  shopPurchases: number;
}

// ==================== DATA ====================

export const FREE_SKINS: BallSkin[] = [
  { id: 'gold', name: 'Gold', emoji: '🟡', color: '#FFD700', glow: 'rgba(255,215,0,0.6)', trail: 'rgba(255,200,50,0.4)', unlockLevel: 1, price: 0, category: 'free' },
  { id: 'silver', name: 'Silver', emoji: '⚪', color: '#C0C0C0', glow: 'rgba(192,192,192,0.5)', trail: 'rgba(192,192,192,0.3)', unlockLevel: 5, price: 0, category: 'free' },
  { id: 'ruby', name: 'Ruby', emoji: '🔴', color: '#E11D48', glow: 'rgba(225,29,72,0.6)', trail: 'rgba(225,29,72,0.4)', unlockLevel: 10, price: 0, category: 'free' },
  { id: 'emerald', name: 'Emerald', emoji: '🟢', color: '#10B981', glow: 'rgba(16,185,129,0.6)', trail: 'rgba(16,185,129,0.4)', unlockLevel: 15, price: 0, category: 'free' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', color: '#60A5FA', glow: 'rgba(96,165,250,0.7)', trail: 'rgba(96,165,250,0.5)', unlockLevel: 20, price: 0, category: 'free' },
  { id: 'fire', name: 'Fire', emoji: '🔥', color: '#F97316', glow: 'rgba(249,115,22,0.7)', trail: 'rgba(249,115,22,0.5)', unlockLevel: 30, price: 0, category: 'free' },
  { id: 'neon', name: 'Neon', emoji: '⚡', color: '#A855F7', glow: 'rgba(168,85,247,0.8)', trail: 'rgba(168,85,247,0.5)', unlockLevel: 40, price: 0, category: 'free' },
  { id: 'legend', name: 'Legendary', emoji: '👑', color: '#FBBF24', glow: 'rgba(251,191,36,0.9)', trail: 'rgba(251,191,36,0.6)', unlockLevel: 50, price: 0, category: 'free' },
];

export const PREMIUM_SKINS: BallSkin[] = [
  { id: 'plasma', name: 'Plasma', emoji: '🌀', color: '#3B82F6', glow: 'rgba(59,130,246,0.8)', trail: 'rgba(59,130,246,0.5)', unlockLevel: 0, price: 500, category: 'premium' },
  { id: 'lava', name: 'Lava', emoji: '🌋', color: '#EF4444', glow: 'rgba(239,68,68,0.8)', trail: 'rgba(239,68,68,0.5)', unlockLevel: 0, price: 750, category: 'premium' },
  { id: 'ice', name: 'Ice', emoji: '❄️', color: '#67E8F9', glow: 'rgba(103,232,249,0.7)', trail: 'rgba(103,232,249,0.5)', unlockLevel: 0, price: 750, category: 'premium' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🌌', color: '#8B5CF6', glow: 'rgba(139,92,246,0.9)', trail: 'rgba(139,92,246,0.6)', unlockLevel: 0, price: 1000, category: 'premium' },
  { id: 'skull', name: 'Skull', emoji: '💀', color: '#6B7280', glow: 'rgba(107,114,128,0.7)', trail: 'rgba(107,114,128,0.5)', unlockLevel: 0, price: 1500, category: 'premium' },
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', color: '#EC4899', glow: 'rgba(236,72,153,0.8)', trail: 'rgba(236,72,153,0.5)', unlockLevel: 0, price: 2000, category: 'premium' },
  { id: 'ghost', name: 'Ghost', emoji: '👻', color: '#E5E7EB', glow: 'rgba(229,231,235,0.4)', trail: 'rgba(229,231,235,0.2)', unlockLevel: 0, price: 2500, category: 'premium' },
  { id: 'crown', name: 'Crown', emoji: '👸', color: '#FCD34D', glow: 'rgba(252,211,77,0.9)', trail: 'rgba(252,211,77,0.6)', unlockLevel: 0, price: 5000, category: 'premium' },
];

export const ALL_SKINS = [...FREE_SKINS, ...PREMIUM_SKINS];

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'default', name: 'Default', emoji: '🟣', price: 0, bgColor: '#06000f', pegColor: 'rgba(139,92,246,0.3)', pegGlow: 'rgba(139,92,246,0.6)', ambientColor: 'rgba(139,92,246,0.03)' },
  { id: 'ocean', name: 'Ocean', emoji: '🌊', price: 1000, bgColor: '#000a1a', pegColor: 'rgba(56,189,248,0.3)', pegGlow: 'rgba(56,189,248,0.6)', ambientColor: 'rgba(56,189,248,0.04)' },
  { id: 'neon_city', name: 'Neon City', emoji: '🏙️', price: 1500, bgColor: '#0a000f', pegColor: 'rgba(236,72,153,0.3)', pegGlow: 'rgba(236,72,153,0.6)', ambientColor: 'rgba(236,72,153,0.04)' },
  { id: 'forest', name: 'Forest', emoji: '🌲', price: 1500, bgColor: '#001a0a', pegColor: 'rgba(34,197,94,0.3)', pegGlow: 'rgba(34,197,94,0.6)', ambientColor: 'rgba(34,197,94,0.04)' },
  { id: 'volcano', name: 'Volcano', emoji: '🌋', price: 2000, bgColor: '#1a0500', pegColor: 'rgba(239,68,68,0.3)', pegGlow: 'rgba(239,68,68,0.6)', ambientColor: 'rgba(239,68,68,0.05)' },
  { id: 'space', name: 'Space', emoji: '🚀', price: 3000, bgColor: '#020010', pegColor: 'rgba(167,139,250,0.3)', pegGlow: 'rgba(167,139,250,0.6)', ambientColor: 'rgba(167,139,250,0.04)' },
];

export const BOOSTERS: Booster[] = [
  { id: 'lucky_charm', name: 'Lucky Charm', emoji: '🍀', description: '+10% chance 2x+', price: 200, durationMs: 1800000, uses: 0 },
  { id: 'double_xp', name: 'Double XP', emoji: '⚡', description: '2x XP', price: 150, durationMs: 1800000, uses: 0 },
  { id: 'coin_magnet', name: 'Coin Magnet', emoji: '🧲', description: '+20% wins', price: 300, durationMs: 1800000, uses: 0 },
  { id: 'shield', name: 'Shield', emoji: '🛡️', description: '0.1x→1x', price: 250, durationMs: 0, uses: 5 },
  { id: 'multi_discount', name: 'Multi Discount', emoji: '💸', description: '-20% multi-drop', price: 400, durationMs: 600000, uses: 0 },
];

export const SPECIAL_ITEMS = [
  { id: 'mega_spin', name: 'Mega Spin', emoji: '🎰', description: 'Guaranteed 3x-10x', price: 1000 },
  { id: 'mystery_box', name: 'Mystery Box', emoji: '📦', description: 'Random reward', price: 500 },
  { id: 'vip_pass', name: 'VIP Pass', emoji: '💎', description: '24h all boosters', price: 5000 },
];

export const FORTUNE_WHEEL_PRIZES = [10, 25, 50, 25, 100, 10, 50, 500];
export const FORTUNE_WHEEL_COOLDOWN = 14400000; // 4 hours
export const HOURLY_BONUS_COOLDOWN = 3600000; // 1 hour

// ==================== HELPERS ====================

function todayStr(): string { return new Date().toISOString().slice(0, 10); }

function weekStr(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().slice(0, 10);
}

function xpForLevel(level: number): number {
  return Math.floor(50 * level * (1 + level * 0.15));
}

export function getXpForNextLevel(level: number): number { return xpForLevel(level); }

function generateDailyChallenges(): DailyChallenge[] {
  return [
    { id: 'drops', type: 'drops', target: 15, reward: 50, progress: 0, claimed: false },
    { id: 'mult', type: 'multiplier', target: 3, reward: 75, progress: 0, claimed: false },
    { id: 'combo', type: 'combo', target: 8, reward: 100, progress: 0, claimed: false },
    { id: 'spend', type: 'spend', target: 200, reward: 50, progress: 0, claimed: false },
  ];
}

function generateWeeklyMissions(): WeeklyMission[] {
  return [
    { id: 'w_drops', type: 'drops', target: 100, reward: 500, progress: 0, claimed: false },
    { id: 'w_shop', type: 'shopBuy', target: 3, reward: 300, progress: 0, claimed: false },
    { id: 'w_level', type: 'level', target: 10, reward: 1000, progress: 0, claimed: false },
  ];
}

function defaultAchievements(): Achievement[] {
  return [
    { id: 'firstDrop', emoji: '🎱', target: 1, progress: 0, unlocked: false },
    { id: 'highRoller', emoji: '💰', target: 1, progress: 0, unlocked: false },
    { id: 'luckyStar', emoji: '⭐', target: 1, progress: 0, unlocked: false },
    { id: 'dedicated', emoji: '🏆', target: 100, progress: 0, unlocked: false },
    { id: 'whale', emoji: '🐋', target: 1000, progress: 0, unlocked: false },
    { id: 'shopaholic', emoji: '🛒', target: 5, progress: 0, unlocked: false },
    { id: 'collector', emoji: '🎨', target: 5, progress: 0, unlocked: false },
    { id: 'prestige', emoji: '⭐', target: 1, progress: 0, unlocked: false },
  ];
}

// ==================== STATE MANAGEMENT ====================

export function createDefaultState(): GameState {
  return {
    balance: 100,
    totalDrops: 0,
    totalWon: 0,
    totalSpent: 0,
    biggestWin: 0,
    tapCount: 0,
    level: 1,
    xp: 0,
    prestigeLevel: 0,
    selectedSkin: 'gold',
    ownedSkins: ['gold'],
    selectedTheme: 'default',
    ownedThemes: ['default'],
    activeBoosters: [],
    dailyChallenges: generateDailyChallenges(),
    dailyChallengeDate: todayStr(),
    weeklyChallenges: generateWeeklyMissions(),
    weeklyResetDate: weekStr(),
    achievements: defaultAchievements(),
    comboCount: 0,
    comboLastTime: Date.now(),
    maxCombo: 0,
    consecutiveLosses: 0,
    lastWheelSpin: 0,
    lastHourlyBonus: 0,
    lastDailyBonus: 0,
    shopPurchases: 0,
  };
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as GameState;
      // Reset daily challenges if new day
      if (data.dailyChallengeDate !== todayStr()) {
        data.dailyChallenges = generateDailyChallenges();
        data.dailyChallengeDate = todayStr();
      }
      // Reset weekly if new week
      if (data.weeklyResetDate !== weekStr()) {
        data.weeklyChallenges = generateWeeklyMissions();
        data.weeklyResetDate = weekStr();
      }
      // Ensure arrays
      if (!data.achievements || data.achievements.length < 8) data.achievements = defaultAchievements();
      if (!data.ownedSkins) data.ownedSkins = ['gold'];
      if (!data.ownedThemes) data.ownedThemes = ['default'];
      if (!data.activeBoosters) data.activeBoosters = [];
      if (!data.weeklyChallenges) { data.weeklyChallenges = generateWeeklyMissions(); data.weeklyResetDate = weekStr(); }
      // Clean expired boosters
      data.activeBoosters = data.activeBoosters.filter(b => {
        if (b.expiresAt > 0 && Date.now() > b.expiresAt) return false;
        if (b.usesLeft !== undefined && b.usesLeft <= 0) return false;
        return true;
      });
      return data;
    }
  } catch { /* ignore */ }
  return createDefaultState();
}

export function saveState(state: GameState): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch { /* */ }
}

// ==================== BOOSTER HELPERS ====================

export function hasBooster(state: GameState, id: string): boolean {
  return state.activeBoosters.some(b => {
    if (b.id !== id) return false;
    if (b.expiresAt > 0 && Date.now() > b.expiresAt) return false;
    if (b.usesLeft !== undefined && b.usesLeft <= 0) return false;
    return true;
  });
}

export function consumeBoosterCharge(state: GameState, id: string): void {
  const b = state.activeBoosters.find(x => x.id === id);
  if (b && b.usesLeft > 0) b.usesLeft--;
}

export function activateBooster(state: GameState, boosterId: string): boolean {
  const def = BOOSTERS.find(b => b.id === boosterId);
  if (!def) return false;
  if (state.activeBoosters.filter(b => (b.expiresAt === 0 || Date.now() < b.expiresAt) && (b.usesLeft === undefined || b.usesLeft > 0)).length >= 3) return false;
  // Remove existing of same type
  state.activeBoosters = state.activeBoosters.filter(b => b.id !== boosterId);
  state.activeBoosters.push({
    id: boosterId,
    expiresAt: def.durationMs > 0 ? Date.now() + def.durationMs : 0,
    usesLeft: def.uses,
  });
  return true;
}

// ==================== SKIN HELPERS ====================

export function getSkinById(id: string): BallSkin {
  return ALL_SKINS.find(s => s.id === id) || FREE_SKINS[0];
}

export function canUseSkin(state: GameState, skinId: string): boolean {
  if (state.ownedSkins.includes(skinId)) return true;
  const skin = FREE_SKINS.find(s => s.id === skinId);
  if (skin && skin.unlockLevel > 0 && state.level >= skin.unlockLevel) return true;
  return false;
}

export function getThemeById(id: BoardThemeId): BoardTheme {
  return BOARD_THEMES.find(t => t.id === id) || BOARD_THEMES[0];
}

// ==================== PROGRESSION ====================

export interface DropResult {
  xpGained: number;
  leveledUp: boolean;
  newLevel: number;
  challengeCompleted: string[];
  achievementUnlocked: string[];
  comboBonus: number;
  isHotStreak: boolean;
  shieldUsed: boolean;
}

export function processDropResult(
  state: GameState,
  multiplier: number,
  bet: number,
): DropResult {
  const result: DropResult = {
    xpGained: 10,
    leveledUp: false,
    newLevel: state.level,
    challengeCompleted: [],
    achievementUnlocked: [],
    comboBonus: 0,
    isHotStreak: false,
    shieldUsed: false,
  };

  // XP (double XP booster)
  const xpMult = hasBooster(state, 'double_xp') ? 2 : 1;
  const maxLevel = 50 + state.prestigeLevel * 10;
  state.xp += 10 * xpMult;
  result.xpGained = 10 * xpMult;
  const needed = getXpForNextLevel(state.level);
  if (state.xp >= needed && state.level < maxLevel) {
    state.xp -= needed;
    state.level++;
    result.leveledUp = true;
    result.newLevel = state.level;
    // Auto-unlock free skins
    for (const skin of FREE_SKINS) {
      if (skin.unlockLevel > 0 && state.level >= skin.unlockLevel && !state.ownedSkins.includes(skin.id)) {
        state.ownedSkins.push(skin.id);
      }
    }
  }

  // Combo
  const now = Date.now();
  if (now - state.comboLastTime < 300000) {
    state.comboCount++;
  } else {
    state.comboCount = 1;
  }
  state.comboLastTime = now;
  state.maxCombo = Math.max(state.maxCombo, state.comboCount);

  // Combo bonuses
  if (state.comboCount > 0 && state.comboCount % 25 === 0) result.comboBonus = 100;
  else if (state.comboCount > 0 && state.comboCount % 10 === 0) result.comboBonus = 20;
  else if (state.comboCount > 0 && state.comboCount % 5 === 0) result.comboBonus = 5;

  // Hot streak
  if (multiplier < 1) state.consecutiveLosses++;
  else state.consecutiveLosses = 0;
  result.isHotStreak = state.consecutiveLosses >= 5;

  // Shield booster
  if (multiplier <= 0.1 && hasBooster(state, 'shield')) {
    consumeBoosterCharge(state, 'shield');
    result.shieldUsed = true;
  }

  // Daily challenges
  for (const ch of state.dailyChallenges) {
    if (ch.claimed) continue;
    if (ch.type === 'drops') {
      ch.progress = Math.min(ch.progress + 1, ch.target);
      if (ch.progress >= ch.target) result.challengeCompleted.push(ch.id);
    } else if (ch.type === 'multiplier' && multiplier >= ch.target) {
      ch.progress = ch.target;
      result.challengeCompleted.push(ch.id);
    } else if (ch.type === 'combo') {
      ch.progress = Math.min(state.comboCount, ch.target);
      if (ch.progress >= ch.target) result.challengeCompleted.push(ch.id);
    } else if (ch.type === 'spend') {
      ch.progress = Math.min(ch.progress + bet, ch.target);
      if (ch.progress >= ch.target) result.challengeCompleted.push(ch.id);
    }
  }

  // Weekly missions
  for (const wm of state.weeklyChallenges) {
    if (wm.claimed) continue;
    if (wm.type === 'drops') {
      wm.progress = Math.min(wm.progress + 1, wm.target);
    } else if (wm.type === 'level') {
      wm.progress = state.level;
    }
  }

  // Achievements
  for (const ach of state.achievements) {
    if (ach.unlocked) continue;
    if (ach.id === 'firstDrop') { ach.progress = 1; ach.unlocked = true; result.achievementUnlocked.push(ach.id); }
    else if (ach.id === 'highRoller' && bet >= 100) { ach.progress = 1; ach.unlocked = true; result.achievementUnlocked.push(ach.id); }
    else if (ach.id === 'luckyStar' && multiplier >= 10) { ach.progress = 1; ach.unlocked = true; result.achievementUnlocked.push(ach.id); }
    else if (ach.id === 'dedicated') { ach.progress = state.totalDrops; if (ach.progress >= ach.target) { ach.unlocked = true; result.achievementUnlocked.push(ach.id); } }
    else if (ach.id === 'whale') { ach.progress = Math.floor(state.balance); if (ach.progress >= ach.target) { ach.unlocked = true; result.achievementUnlocked.push(ach.id); } }
    else if (ach.id === 'shopaholic') { ach.progress = state.shopPurchases; if (ach.progress >= ach.target) { ach.unlocked = true; result.achievementUnlocked.push(ach.id); } }
    else if (ach.id === 'collector') { ach.progress = state.ownedSkins.length; if (ach.progress >= ach.target) { ach.unlocked = true; result.achievementUnlocked.push(ach.id); } }
    else if (ach.id === 'prestige') { if (state.prestigeLevel >= 1) { ach.progress = 1; ach.unlocked = true; result.achievementUnlocked.push(ach.id); } }
  }

  return result;
}

// ==================== PRESTIGE ====================

export function canPrestige(state: GameState): boolean {
  return state.level >= 50 && state.prestigeLevel < 10;
}

export function doPrestige(state: GameState): void {
  state.prestigeLevel++;
  state.level = 1;
  state.xp = 0;
  // Keep skins, themes, achievements
  // Bonus: +5% per prestige
}

export function getPrestigeBonus(state: GameState): number {
  return 1 + state.prestigeLevel * 0.05;
}

// ==================== FORTUNE WHEEL ====================

export function canSpinWheel(state: GameState): boolean {
  return Date.now() - state.lastWheelSpin >= FORTUNE_WHEEL_COOLDOWN;
}

export function spinWheel(state: GameState): number {
  state.lastWheelSpin = Date.now();
  const idx = Math.floor(Math.random() * FORTUNE_WHEEL_PRIZES.length);
  return FORTUNE_WHEEL_PRIZES[idx];
}

export function getWheelCooldownRemaining(state: GameState): number {
  return Math.max(0, FORTUNE_WHEEL_COOLDOWN - (Date.now() - state.lastWheelSpin));
}

// ==================== HOURLY BONUS ====================

export function canClaimHourly(state: GameState): boolean {
  return Date.now() - state.lastHourlyBonus >= HOURLY_BONUS_COOLDOWN;
}

export function getHourlyCooldownRemaining(state: GameState): number {
  return Math.max(0, HOURLY_BONUS_COOLDOWN - (Date.now() - state.lastHourlyBonus));
}

// ==================== DAILY BONUS ====================

export function canClaimDaily(state: GameState): boolean {
  return Date.now() - state.lastDailyBonus >= 86400000;
}

// ==================== MYSTERY BOX ====================

export function openMysteryBox(): { type: 'coins' | 'booster'; value: number; label: string } {
  const r = Math.random();
  if (r < 0.5) {
    const coins = [50, 100, 150, 200, 300, 500][Math.floor(Math.random() * 6)];
    return { type: 'coins', value: coins, label: `${coins} 🪙` };
  } else {
    const boosterIdx = Math.floor(Math.random() * BOOSTERS.length);
    return { type: 'booster', value: boosterIdx, label: `${BOOSTERS[boosterIdx].emoji} ${BOOSTERS[boosterIdx].name}` };
  }
}