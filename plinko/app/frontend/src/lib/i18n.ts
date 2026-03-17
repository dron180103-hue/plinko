export type Language = 'ru' | 'ua' | 'en';

const t = {
  ru: {
    dropBall: '🎱 БРОСИТЬ', balance: 'Баланс', demoCoins: 'монеты', bet: 'Ставка',
    totalDrops: 'Бросков', lastWin: 'Последний', biggestWin: 'Макс', totalWon: 'Выиграно',
    notEnoughCoins: 'Недостаточно средств!', bigWin: 'БОЛЬШОЙ ВЫИГРЫШ!',
    tapToEarn: 'НАЖМИ', tapHint: '+0.5 🪙', tapFatigue: 'Усталость...',
    autoDrop: 'Авто', playForReal: '🔥 ИГРАТЬ НА РЕАЛЬНЫЕ',
    riskLow: 'Низкий', riskMed: 'Средний', riskHigh: 'Высокий',
    sound: 'Звук', on: 'ВКЛ', off: 'ВЫКЛ', close: 'Закрыть',
    game: 'Игра', shop: 'Магазин', tasks: 'Задания', profile: 'Профиль',
    shopTitle: '🛒 Магазин', skins: 'Скины', themes: 'Темы', boosters: 'Бустеры', specials: 'Особые',
    buy: 'Купить', owned: 'Есть', equipped: 'Выбран', equip: 'Выбрать', locked: 'Закрыт',
    maxBoosters: 'Макс 3 бустера!', purchased: 'Куплено!', activated: 'Активировано!',
    free: 'Бесплатно', premium: 'Премиум', lvRequired: 'Нужен Ур.',
    luckyCharm: 'Талисман', doubleXp: 'Двойной XP', coinMagnet: 'Магнит', shield: 'Щит', multiDiscount: 'Скидка',
    active: 'Активно', usesLeft: 'осталось',
    megaSpin: 'Мега Спин', mysteryBox: 'Тайный Ящик', vipPass: 'VIP Пропуск',
    mysteryResult: 'Вы получили:', guaranteed: 'Гарантировано 3x-10x!',
    dailyChallenges: '📋 Ежедневные', weeklyChallenges: '📅 Недельные',
    dropBalls: 'Бросить {n} шаров', winMultiplier: 'Выиграть {n}x+', reachCombo: 'Комбо {n}',
    spendCoins: 'Потратить {n} 🪙', weeklyDrops: '{n} бросков за неделю',
    shopBuys: '{n} покупок', reachLevel: 'Достичь уровня {n}',
    claimReward: 'Забрать', completed: 'Выполнено',
    level: 'Уровень', xp: 'Опыт', prestige: 'Престиж', prestigeBtn: '⭐ ПРЕСТИЖ',
    prestigeConfirm: 'Сбросить уровень? Вы сохраните скины!', prestigeBonus: '+5% к выигрышу',
    achievements: 'Достижения', stats: 'Статистика',
    totalSpent: 'Потрачено', combo: 'Комбо', maxComboLabel: 'Макс комбо',
    firstDrop: 'Первый бросок', highRoller: 'Хай-роллер', luckyStar: 'Звезда удачи',
    dedicated: 'Преданный', whale: 'Кит', shopaholic: 'Шопоголик', collector: 'Коллекционер', prestigeAch: 'Престиж',
    popupTitle: '🎰 Максимальная удача!',
    popupBody: 'Готовы играть по-настоящему? Получите 250 бесплатных вращений!',
    popupCta: '🔥 ИГРАТЬ ПО-НАСТОЯЩЕМУ', popupDismiss: 'Позже',
    bankruptTitle: '💸 Средства закончились!',
    bankruptBody: 'Получите 500 БЕСПЛАТНЫХ 🪙!',
    bankruptCta: '🔥 ПОЛУЧИТЬ 500 🪙',
    dailyBonus: '🎁 Ежедневный бонус!', dailyBonusMsg: '+75 🪙!', claim: 'Забрать',
    hourlyBonus: '🎰 Бесплатный спин!', hourlyBonusMsg: 'Бесплатный бросок × 10!',
    fortuneWheel: '🎡 Колесо удачи', spin: 'Крутить!', cooldown: 'Ожидание',
    comboBonus: 'Бонус комбо!', nearMiss: 'Почти!', hotStreak: '🔥 Горячая серия!',
    shieldSaved: '🛡️ Щит спас вас!',
    balls: 'шаров', totalCost: 'Итого', dropMulti: 'БРОСИТЬ {n}',
    multiResult: 'Результат', spent: 'Потрачено', won: 'Выиграно', profit: 'Профит',
    halfBet: '½', doubleBet: 'x2', maxBet: 'MAX',
    settingsTitle: '⚙️ Админ панель', referralLink: 'Реферальная ссылка',
    save: 'Сохранить', saved: 'Сохранено!', rtp: 'RTP',
    adminId: 'Admin TG ID', adminPin: 'Admin PIN', enterPin: 'Введите PIN',
    adminLogin: 'Логин', adminPassword: 'Пароль', loginBtn: 'Войти', wrongCredentials: 'Неверный логин или пароль',
    loggedInAs: 'Вы вошли как', logout: 'Выйти',
    leaderboard: 'Топ игроков', you: 'Вы',
    welcome: 'Добро пожаловать!', welcomeMsg: 'Войдите или зарегистрируйтесь',
    nickname: 'Ваш никнейм', startPlaying: 'Начать игру',
    nicknameRequired: 'Введите никнейм!',
    resetBalance: 'Сбросить баланс', resetConfirm: 'Вы уверены? Весь прогресс будет потерян!',
    resetDone: 'Баланс сброшен!', yes: 'Да', no: 'Нет',
    dailyOfferTitle: '💎 СПЕЦИАЛЬНОЕ ПРЕДЛОЖЕНИЕ!',
    dailyOfferSubtitle: 'Только сегодня!',
    dailyOfferBody: 'Получите 10,000 🪙 + VIP статус на 24 часа!',
    dailyOfferPrice: 'Спец. предложение',
    dailyOfferOldPrice: '',
    dailyOfferCta: '🔥 ПОЛУЧИТЬ БОНУС',
    dailyOfferTimer: 'Предложение заканчивается через',
    dailyOfferClose: 'Не сейчас',
    installApp: 'Установить приложение',
    installAppMsg: 'Добавьте на главный экран для быстрого доступа!',
    installBtn: 'Установить',
    dismissBtn: 'Позже',
    loginStreak: 'Серия входов',
    day: 'день',
    // Auth
    authLogin: 'Войти',
    authRegister: 'Зарегистрироваться',
    authPassword: 'Пароль',
    authConfirmPassword: 'Подтвердите пароль',
    authHaveAccount: 'Уже есть аккаунт?',
    authNoAccount: 'Нет аккаунта?',
    authMinNickname: 'Никнейм минимум 3 символа',
    authMinPassword: 'Пароль минимум 4 символа',
    authPasswordMismatch: 'Пароли не совпадают',
    authUserExists: 'Пользователь уже существует',
    authWrongPassword: 'Неверный пароль',
    authUserNotFound: 'Пользователь не найден',
    authSuccess: 'Успешно!',
    currency: '🪙',
  },
  ua: {
    dropBall: '🎱 КИНУТИ', balance: 'Баланс', demoCoins: 'монети', bet: 'Ставка',
    totalDrops: 'Кидків', lastWin: 'Останній', biggestWin: 'Макс', totalWon: 'Виграно',
    notEnoughCoins: 'Недостатньо коштів!', bigWin: 'ВЕЛИКИЙ ВИГРАШ!',
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
    spendCoins: 'Витратити {n} 🪙', weeklyDrops: '{n} кидків за тиждень',
    shopBuys: '{n} покупок', reachLevel: 'Досягти рівня {n}',
    claimReward: 'Забрати', completed: 'Виконано',
    level: 'Рівень', xp: 'Досвід', prestige: 'Престиж', prestigeBtn: '⭐ ПРЕСТИЖ',
    prestigeConfirm: 'Скинути рівень? Ви збережете скіни!', prestigeBonus: '+5% до виграшу',
    achievements: 'Досягнення', stats: 'Статистика',
    totalSpent: 'Витрачено', combo: 'Комбо', maxComboLabel: 'Макс комбо',
    firstDrop: 'Перший кидок', highRoller: 'Хай-ролер', luckyStar: 'Зірка удачі',
    dedicated: 'Відданий', whale: 'Кит', shopaholic: 'Шопоголік', collector: 'Колекціонер', prestigeAch: 'Престиж',
    popupTitle: '🎰 Максимальна удача!',
    popupBody: 'Готові грати по-справжньому? Отримайте 250 безкоштовних обертань!',
    popupCta: '🔥 ГРАТИ ПО-СПРАВЖНЬОМУ', popupDismiss: 'Пізніше',
    bankruptTitle: '💸 Кошти закінчились!',
    bankruptBody: 'Отримайте 500 БЕЗКОШТОВНИХ 🪙!',
    bankruptCta: '🔥 ОТРИМАТИ 500 🪙',
    dailyBonus: '🎁 Щоденний бонус!', dailyBonusMsg: '+75 🪙!', claim: 'Забрати',
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
    adminLogin: 'Логін', adminPassword: 'Пароль', loginBtn: 'Увійти', wrongCredentials: 'Невірний логін або пароль',
    loggedInAs: 'Ви увійшли як', logout: 'Вийти',
    leaderboard: 'Топ гравців', you: 'Ви',
    welcome: 'Ласкаво просимо!', welcomeMsg: 'Увійдіть або зареєструйтесь',
    nickname: 'Ваш нікнейм', startPlaying: 'Почати гру',
    nicknameRequired: 'Введіть нікнейм!',
    resetBalance: 'Скинути баланс', resetConfirm: 'Ви впевнені? Весь прогрес буде втрачено!',
    resetDone: 'Баланс скинуто!', yes: 'Так', no: 'Ні',
    dailyOfferTitle: '💎 СПЕЦІАЛЬНА ПРОПОЗИЦІЯ!',
    dailyOfferSubtitle: 'Тільки сьогодні!',
    dailyOfferBody: 'Отримайте 10,000 🪙 + VIP статус на 24 години!',
    dailyOfferPrice: 'Спец. пропозиція',
    dailyOfferOldPrice: '',
    dailyOfferCta: '🔥 ОТРИМАТИ БОНУС',
    dailyOfferTimer: 'Пропозиція закінчується через',
    dailyOfferClose: 'Не зараз',
    installApp: 'Встановити додаток',
    installAppMsg: 'Додайте на головний екран для швидкого доступу!',
    installBtn: 'Встановити',
    dismissBtn: 'Пізніше',
    loginStreak: 'Серія входів',
    day: 'день',
    // Auth
    authLogin: 'Увійти',
    authRegister: 'Зареєструватися',
    authPassword: 'Пароль',
    authConfirmPassword: 'Підтвердіть пароль',
    authHaveAccount: 'Вже є акаунт?',
    authNoAccount: 'Немає акаунту?',
    authMinNickname: 'Нікнейм мінімум 3 символи',
    authMinPassword: 'Пароль мінімум 4 символи',
    authPasswordMismatch: 'Паролі не співпадають',
    authUserExists: 'Користувач вже існує',
    authWrongPassword: 'Невірний пароль',
    authUserNotFound: 'Користувача не знайдено',
    authSuccess: 'Успішно!',
    currency: '🪙',
  },
  en: {
    dropBall: '🎱 DROP', balance: 'Balance', demoCoins: 'coins', bet: 'Bet',
    totalDrops: 'Drops', lastWin: 'Last win', biggestWin: 'Best', totalWon: 'Won',
    notEnoughCoins: 'Not enough funds!', bigWin: 'BIG WIN!',
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
    spendCoins: 'Spend {n} 🪙', weeklyDrops: '{n} drops this week',
    shopBuys: '{n} purchases', reachLevel: 'Reach level {n}',
    claimReward: 'Claim', completed: 'Completed',
    level: 'Level', xp: 'XP', prestige: 'Prestige', prestigeBtn: '⭐ PRESTIGE',
    prestigeConfirm: 'Reset level? You keep all skins!', prestigeBonus: '+5% earnings',
    achievements: 'Achievements', stats: 'Statistics',
    totalSpent: 'Spent', combo: 'Combo', maxComboLabel: 'Max combo',
    firstDrop: 'First Drop', highRoller: 'High Roller', luckyStar: 'Lucky Star',
    dedicated: 'Dedicated', whale: 'Whale', shopaholic: 'Shopaholic', collector: 'Collector', prestigeAch: 'Prestige',
    popupTitle: '🎰 Maximum Luck!',
    popupBody: 'Ready to play for real? Claim your 250 Free Spins!',
    popupCta: '🔥 PLAY FOR REAL', popupDismiss: 'Later',
    bankruptTitle: '💸 Out of funds!',
    bankruptBody: 'Get 500 FREE 🪙!',
    bankruptCta: '🔥 GET 500 🪙',
    dailyBonus: '🎁 Daily Bonus!', dailyBonusMsg: '+75 🪙!', claim: 'Claim',
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
    adminLogin: 'Login', adminPassword: 'Password', loginBtn: 'Log In', wrongCredentials: 'Wrong login or password',
    loggedInAs: 'Logged in as', logout: 'Log Out',
    leaderboard: 'Leaderboard', you: 'You',
    welcome: 'Welcome!', welcomeMsg: 'Sign in or register to play',
    nickname: 'Your nickname', startPlaying: 'Start Playing',
    nicknameRequired: 'Enter a nickname!',
    resetBalance: 'Reset Balance', resetConfirm: 'Are you sure? All progress will be lost!',
    resetDone: 'Balance reset!', yes: 'Yes', no: 'No',
    dailyOfferTitle: '💎 SPECIAL OFFER!',
    dailyOfferSubtitle: 'Today only!',
    dailyOfferBody: 'Get 10,000 🪙 + VIP status for 24 hours!',
    dailyOfferPrice: 'Special offer',
    dailyOfferOldPrice: '',
    dailyOfferCta: '🔥 GET BONUS',
    dailyOfferTimer: 'Offer expires in',
    dailyOfferClose: 'Not now',
    installApp: 'Install App',
    installAppMsg: 'Add to home screen for quick access!',
    installBtn: 'Install',
    dismissBtn: 'Later',
    loginStreak: 'Login streak',
    day: 'day',
    // Auth
    authLogin: 'Sign In',
    authRegister: 'Register',
    authPassword: 'Password',
    authConfirmPassword: 'Confirm password',
    authHaveAccount: 'Already have an account?',
    authNoAccount: 'No account?',
    authMinNickname: 'Nickname min 3 characters',
    authMinPassword: 'Password min 4 characters',
    authPasswordMismatch: 'Passwords do not match',
    authUserExists: 'User already exists',
    authWrongPassword: 'Wrong password',
    authUserNotFound: 'User not found',
    authSuccess: 'Success!',
    currency: '🪙',
  },
};

export type Translations = typeof t.en;

export function getTranslations(lang: Language): Translations {
  return t[lang];
}

export function getSavedLanguage(): Language {
  const saved = localStorage.getItem('plinko_lang');
  if (saved === 'ru' || saved === 'ua' || saved === 'en') return saved;
  return 'ua';
}

export function saveLanguage(lang: Language): void {
  localStorage.setItem('plinko_lang', lang);
}

const REFERRAL_KEY = 'plinko_referral_url';
export function getReferralUrl(): string { return localStorage.getItem(REFERRAL_KEY) || 'https://go.affiliate-beton.com/click?pid=1494&offer_id=80'; }
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

// User nickname
const NICKNAME_KEY = 'plinko_nickname';
export function getNickname(): string | null { return localStorage.getItem(NICKNAME_KEY); }
export function setNickname(name: string): void { localStorage.setItem(NICKNAME_KEY, name); }

// Auth functions moved to api.ts (database-backed)

// Leaderboard (daily refresh)
const LEADERBOARD_KEY = 'plinko_leaderboard';
const LEADERBOARD_DATE_KEY = 'plinko_leaderboard_date';

export interface LeaderboardEntry {
  name: string;
  score: number;
  isPlayer: boolean;
}

function todayDateStr(): string { return new Date().toISOString().slice(0, 10); }

function generateFakeLeaderboard(): LeaderboardEntry[] {
  const fakes = ['CryptoKing', 'LuckyAce', 'GoldRush', 'DiamondH', 'NeonBet', 'StarPlay', 'MoonWin', 'FireDice', 'BetMaster', 'CoinFlip'];
  return fakes.map((name, i) => ({
    name,
    score: Math.floor(5000 - i * 350 + Math.random() * 300),
    isPlayer: false,
  }));
}

export function getLeaderboard(playerName: string, playerScore: number): LeaderboardEntry[] {
  const savedDate = localStorage.getItem(LEADERBOARD_DATE_KEY);
  const today = todayDateStr();
  let entries: LeaderboardEntry[];

  if (savedDate === today) {
    try {
      entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
      if (!entries.length) entries = generateFakeLeaderboard();
    } catch { entries = generateFakeLeaderboard(); }
  } else {
    entries = generateFakeLeaderboard();
    localStorage.setItem(LEADERBOARD_DATE_KEY, today);
  }

  entries = entries.filter(e => !e.isPlayer);
  entries.push({ name: playerName || 'Player', score: Math.floor(playerScore), isPlayer: true });
  entries.sort((a, b) => b.score - a.score);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  return entries;
}

// Admin login/password auth
const ADMIN_SESSION_KEY = 'plinko_admin_session';
const ADMIN_CREDENTIALS = { login: 'admin', password: 't78diz11l9' };
// The admin nickname that has access to the admin panel
const ADMIN_NICKNAME = 'admin';

export function getAdminNickname(): string {
  return ADMIN_NICKNAME;
}

export function checkAdminCredentials(login: string, password: string): boolean {
  return login === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password;
}

export function isAdminLoggedIn(): boolean {
  return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminSession(loggedIn: boolean): void {
  if (loggedIn) {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

export function isPlayerAdmin(nickname: string): boolean {
  return nickname.toLowerCase() === ADMIN_NICKNAME.toLowerCase();
}