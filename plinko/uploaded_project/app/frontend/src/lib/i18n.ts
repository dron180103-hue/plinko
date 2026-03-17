export type Language = 'ru' | 'ua' | 'en';

const t = {
  ru: {
    dropBall: '🎱 БРОСИТЬ', balance: 'Баланс', demoCoins: 'демо монет', bet: 'Ставка',
    totalDrops: 'Бросков', lastWin: 'Последний', biggestWin: 'Макс', totalWon: 'Выиграно',
    notEnoughCoins: 'Недостаточно монет!', bigWin: 'БОЛЬШОЙ ВЫИГРЫШ!',
    tapToEarn: 'НАЖМИ', tapHint: '+0.5 🪙', tapFatigue: 'Усталость...',
    autoDrop: 'Авто', playForReal: '🔥 ИГРАТЬ НА РЕАЛЬНЫЕ',
    riskLow: 'Низкий', riskMed: 'Средний', riskHigh: 'Высокий',
    sound: 'Звук', on: 'ВКЛ', off: 'ВЫКЛ', close: 'Закрыть',
    // Tabs
    game: 'Игра', shop: 'Магазин', tasks: 'Задания', profile: 'Профиль',
    // Shop
    shopTitle: '🛒 Магазин', skins: 'Скины', themes: 'Темы', boosters: 'Бустеры', specials: 'Особые',
    buy: 'Купить', owned: 'Есть', equipped: 'Выбран', equip: 'Выбрать', locked: 'Закрыт',
    maxBoosters: 'Макс 3 бустера!', purchased: 'Куплено!', activated: 'Активировано!',
    free: 'Бесплатно', premium: 'Премиум', lvRequired: 'Нужен Ур.',
    // Boosters
    luckyCharm: 'Талисман', doubleXp: 'Двойной XP', coinMagnet: 'Магнит', shield: 'Щит', multiDiscount: 'Скидка',
    active: 'Активно', usesLeft: 'осталось',
    // Specials
    megaSpin: 'Мега Спин', mysteryBox: 'Тайный Ящик', vipPass: 'VIP Пропуск',
    mysteryResult: 'Вы получили:', guaranteed: 'Гарантировано 3x-10x!',
    // Tasks
    dailyChallenges: '📋 Ежедневные', weeklyChallenges: '📅 Недельные',
    dropBalls: 'Бросить {n} шаров', winMultiplier: 'Выиграть {n}x+', reachCombo: 'Комбо {n}',
    spendCoins: 'Потратить {n} монет', weeklyDrops: '{n} бросков за неделю',
    shopBuys: '{n} покупок', reachLevel: 'Достичь уровня {n}',
    claimReward: 'Забрать', completed: 'Выполнено',
    // Profile
    level: 'Уровень', xp: 'Опыт', prestige: 'Престиж', prestigeBtn: '⭐ ПРЕСТИЖ',
    prestigeConfirm: 'Сбросить уровень? Вы сохраните скины!', prestigeBonus: '+5% к монетам',
    achievements: 'Достижения', stats: 'Статистика',
    totalSpent: 'Потрачено', combo: 'Комбо', maxComboLabel: 'Макс комбо',
    firstDrop: 'Первый бросок', highRoller: 'Хай-роллер', luckyStar: 'Звезда удачи',
    dedicated: 'Преданный', whale: 'Кит', shopaholic: 'Шопоголик', collector: 'Коллекционер', prestigeAch: 'Престиж',
    // Popups
    popupTitle: '🎰 Максимальная удача!',
    popupBody: 'Готовы играть по-настоящему? Получите 250 бесплатных вращений!',
    popupCta: '🔥 ИГРАТЬ ПО-НАСТОЯЩЕМУ', popupDismiss: 'Позже',
    bankruptTitle: '💸 Монеты закончились!',
    bankruptBody: 'Получите 500 БЕСПЛАТНЫХ монет!',
    bankruptCta: '🔥 ПОЛУЧИТЬ 500 МОНЕТ',
    dailyBonus: '🎁 Ежедневный бонус!', dailyBonusMsg: '+75 монет!', claim: 'Забрать',
    hourlyBonus: '🎰 Бесплатный спин!', hourlyBonusMsg: 'Бесплатный бросок × 10!',
    fortuneWheel: '🎡 Колесо удачи', spin: 'Крутить!', cooldown: 'Ожидание',
    comboBonus: 'Бонус комбо!', nearMiss: 'Почти!', hotStreak: '🔥 Горячая серия!',
    shieldSaved: '🛡️ Щит спас вас!',
    // Multi-ball
    balls: 'шаров', totalCost: 'Итого', dropMulti: 'БРОСИТЬ {n}',
    multiResult: 'Результат', spent: 'Потрачено', won: 'Выиграно', profit: 'Профит',
    halfBet: '½', doubleBet: 'x2', maxBet: 'MAX',
    // Settings
    settingsTitle: '⚙️ Админ панель', referralLink: 'Реферальная ссылка',
    save: 'Сохранить', saved: 'Сохранено!', rtp: 'RTP',
    adminId: 'Admin TG ID', adminPin: 'Admin PIN', enterPin: 'Введите PIN',
    // Leaderboard
    leaderboard: 'Топ игроков', you: 'Вы',
  },
  ua: {
    dropBall: '🎱 КИНУТИ', balance: 'Баланс', demoCoins: 'демо монет', bet: 'Ставка',
    totalDrops: 'Кидків', lastWin: 'Останній', biggestWin: 'Макс', totalWon: 'Виграно',
    notEnoughCoins: 'Недостатньо монет!', bigWin: 'ВЕЛИКИЙ ВИГРАШ!',
    tapToEarn: 'НАТИСНИ', tapHint: '+0.5 🪙', tapFatigue: 'Втома...',
    autoDrop: 'Авто', playForReal: '🔥 ГРАТИ НА РЕАЛЬНІ',
    riskLow: 'Низький', riskMed: 'Середній', riskHigh: 'Високий',
    sound: 'Звук', on: 'УВІМ', off: 'ВИМК', close: 'Закрити',
    game: 'Гра', shop: 'Магазин', tasks: 'Завдання', profile: 'Профіль',
    shopTitle: '🛒 Магазин', skins: 'Скіни', themes: 'Теми', boosters: 'Бустери', specials: 'Особливі',
    buy: 'Купити', owned: 'Є', equipped: 'Обрано', equip: 'Обрати', locked: 'Закрито',
    maxBoosters: 'Макс 3 бустери!', purchased: 'Куплено!', activated: 'Активовано!',
    free: 'Безкоштовно', premium: 'Преміум', lvRequired: 'Потрібен Рів.',
    luckyCharm: 'Талісман', doubleXp: 'Подвійний XP', coinMagnet: 'Магніт', shield: 'Щит', multiDiscount: 'Знижка',
    active: 'Активно', usesLeft: 'залишилось',
    megaSpin: 'Мега Спін', mysteryBox: 'Таємна Скриня', vipPass: 'VIP Пропуск',
    mysteryResult: 'Ви отримали:', guaranteed: 'Гарантовано 3x-10x!',
    dailyChallenges: '📋 Щоденні', weeklyChallenges: '📅 Тижневі',
    dropBalls: 'Кинути {n} кульок', winMultiplier: 'Виграти {n}x+', reachCombo: 'Комбо {n}',
    spendCoins: 'Витратити {n} монет', weeklyDrops: '{n} кидків за тиждень',
    shopBuys: '{n} покупок', reachLevel: 'Досягти рівня {n}',
    claimReward: 'Забрати', completed: 'Виконано',
    level: 'Рівень', xp: 'Досвід', prestige: 'Престиж', prestigeBtn: '⭐ ПРЕСТИЖ',
    prestigeConfirm: 'Скинути рівень? Ви збережете скіни!', prestigeBonus: '+5% до монет',
    achievements: 'Досягнення', stats: 'Статистика',
    totalSpent: 'Витрачено', combo: 'Комбо', maxComboLabel: 'Макс комбо',
    firstDrop: 'Перший кидок', highRoller: 'Хай-ролер', luckyStar: 'Зірка удачі',
    dedicated: 'Відданий', whale: 'Кит', shopaholic: 'Шопоголік', collector: 'Колекціонер', prestigeAch: 'Престиж',
    popupTitle: '🎰 Максимальна удача!',
    popupBody: 'Готові грати по-справжньому? Отримайте 250 безкоштовних обертань!',
    popupCta: '🔥 ГРАТИ ПО-СПРАВЖНЬОМУ', popupDismiss: 'Пізніше',
    bankruptTitle: '💸 Монети закінчились!',
    bankruptBody: 'Отримайте 500 БЕЗКОШТОВНИХ монет!',
    bankruptCta: '🔥 ОТРИМАТИ 500 МОНЕТ',
    dailyBonus: '🎁 Щоденний бонус!', dailyBonusMsg: '+75 монет!', claim: 'Забрати',
    hourlyBonus: '🎰 Безкоштовний спін!', hourlyBonusMsg: 'Безкоштовний кидок × 10!',
    fortuneWheel: '🎡 Колесо удачі', spin: 'Крутити!', cooldown: 'Очікування',
    comboBonus: 'Бонус комбо!', nearMiss: 'Майже!', hotStreak: '🔥 Гаряча серія!',
    shieldSaved: '🛡️ Щит врятував вас!',
    balls: 'кульок', totalCost: 'Разом', dropMulti: 'КИНУТИ {n}',
    multiResult: 'Результат', spent: 'Витрачено', won: 'Виграно', profit: 'Профіт',
    halfBet: '½', doubleBet: 'x2', maxBet: 'MAX',
    settingsTitle: '⚙️ Адмін панель', referralLink: 'Реферальне посилання',
    save: 'Зберегти', saved: 'Збережено!', rtp: 'RTP',
    adminId: 'Admin TG ID', adminPin: 'Admin PIN', enterPin: 'Введіть PIN',
    leaderboard: 'Топ гравців', you: 'Ви',
  },
  en: {
    dropBall: '🎱 DROP', balance: 'Balance', demoCoins: 'demo coins', bet: 'Bet',
    totalDrops: 'Drops', lastWin: 'Last win', biggestWin: 'Best', totalWon: 'Won',
    notEnoughCoins: 'Not enough coins!', bigWin: 'BIG WIN!',
    tapToEarn: 'TAP', tapHint: '+0.5 🪙', tapFatigue: 'Fatigue...',
    autoDrop: 'Auto', playForReal: '🔥 PLAY FOR REAL',
    riskLow: 'Low', riskMed: 'Medium', riskHigh: 'High',
    sound: 'Sound', on: 'ON', off: 'OFF', close: 'Close',
    game: 'Game', shop: 'Shop', tasks: 'Tasks', profile: 'Profile',
    shopTitle: '🛒 Shop', skins: 'Skins', themes: 'Themes', boosters: 'Boosters', specials: 'Specials',
    buy: 'Buy', owned: 'Owned', equipped: 'Equipped', equip: 'Equip', locked: 'Locked',
    maxBoosters: 'Max 3 boosters!', purchased: 'Purchased!', activated: 'Activated!',
    free: 'Free', premium: 'Premium', lvRequired: 'Lv. Required',
    luckyCharm: 'Lucky Charm', doubleXp: 'Double XP', coinMagnet: 'Coin Magnet', shield: 'Shield', multiDiscount: 'Discount',
    active: 'Active', usesLeft: 'left',
    megaSpin: 'Mega Spin', mysteryBox: 'Mystery Box', vipPass: 'VIP Pass',
    mysteryResult: 'You got:', guaranteed: 'Guaranteed 3x-10x!',
    dailyChallenges: '📋 Daily', weeklyChallenges: '📅 Weekly',
    dropBalls: 'Drop {n} balls', winMultiplier: 'Win {n}x+', reachCombo: 'Combo {n}',
    spendCoins: 'Spend {n} coins', weeklyDrops: '{n} drops this week',
    shopBuys: '{n} purchases', reachLevel: 'Reach level {n}',
    claimReward: 'Claim', completed: 'Completed',
    level: 'Level', xp: 'XP', prestige: 'Prestige', prestigeBtn: '⭐ PRESTIGE',
    prestigeConfirm: 'Reset level? You keep all skins!', prestigeBonus: '+5% coins',
    achievements: 'Achievements', stats: 'Statistics',
    totalSpent: 'Spent', combo: 'Combo', maxComboLabel: 'Max combo',
    firstDrop: 'First Drop', highRoller: 'High Roller', luckyStar: 'Lucky Star',
    dedicated: 'Dedicated', whale: 'Whale', shopaholic: 'Shopaholic', collector: 'Collector', prestigeAch: 'Prestige',
    popupTitle: '🎰 Maximum Luck!',
    popupBody: 'Ready to play for real? Claim your 250 Free Spins!',
    popupCta: '🔥 PLAY FOR REAL', popupDismiss: 'Later',
    bankruptTitle: '💸 Out of coins!',
    bankruptBody: 'Get 500 FREE coins!',
    bankruptCta: '🔥 GET 500 COINS',
    dailyBonus: '🎁 Daily Bonus!', dailyBonusMsg: '+75 coins!', claim: 'Claim',
    hourlyBonus: '🎰 Free Spin!', hourlyBonusMsg: 'Free drop × 10!',
    fortuneWheel: '🎡 Fortune Wheel', spin: 'Spin!', cooldown: 'Cooldown',
    comboBonus: 'Combo Bonus!', nearMiss: 'So close!', hotStreak: '🔥 Hot Streak!',
    shieldSaved: '🛡️ Shield saved you!',
    balls: 'balls', totalCost: 'Total', dropMulti: 'DROP {n}',
    multiResult: 'Result', spent: 'Spent', won: 'Won', profit: 'Profit',
    halfBet: '½', doubleBet: 'x2', maxBet: 'MAX',
    settingsTitle: '⚙️ Admin Panel', referralLink: 'Referral Link',
    save: 'Save', saved: 'Saved!', rtp: 'RTP',
    adminId: 'Admin TG ID', adminPin: 'Admin PIN', enterPin: 'Enter PIN',
    leaderboard: 'Leaderboard', you: 'You',
  },
};

export type Translations = typeof t.en;

export function getTranslations(lang: Language): Translations {
  return t[lang];
}

export function getSavedLanguage(): Language {
  const saved = localStorage.getItem('plinko_lang');
  if (saved === 'ru' || saved === 'ua' || saved === 'en') return saved;
  return 'ru';
}

export function saveLanguage(lang: Language): void {
  localStorage.setItem('plinko_lang', lang);
}

const REFERRAL_KEY = 'plinko_referral_url';
export function getReferralUrl(): string { return localStorage.getItem(REFERRAL_KEY) || 'https://example.com'; }
export function saveReferralUrl(url: string): void { localStorage.setItem(REFERRAL_KEY, url); }

const RTP_KEY = 'plinko_rtp';
export function getRtp(): number { const s = localStorage.getItem(RTP_KEY); if (s) { const v = parseInt(s, 10); if (v >= 50 && v <= 95) return v; } return 75; }
export function saveRtp(rtp: number): void { localStorage.setItem(RTP_KEY, String(Math.max(50, Math.min(95, rtp)))); }

const ADMIN_TG_ID_KEY = 'plinko_admin_tg_id';
const ADMIN_PIN_KEY = 'plinko_admin_pin';
export function getAdminTgId(): number | null { const s = localStorage.getItem(ADMIN_TG_ID_KEY); return s ? parseInt(s, 10) : null; }
export function setAdminTgId(id: number): void { localStorage.setItem(ADMIN_TG_ID_KEY, String(id)); }
export function getAdminPin(): string | null { return localStorage.getItem(ADMIN_PIN_KEY); }
export function setAdminPin(pin: string): void { localStorage.setItem(ADMIN_PIN_KEY, pin); }