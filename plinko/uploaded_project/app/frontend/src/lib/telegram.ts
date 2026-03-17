// Telegram WebApp integration

interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  openLink: (url: string) => void;
  MainButton: {
    show: () => void;
    hide: () => void;
    setText: (text: string) => void;
    onClick: (fn: () => void) => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  initDataUnsafe?: {
    user?: TelegramUser;
  };
  platform: string;
  colorScheme: string;
  headerColor: string;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function isTelegram(): boolean {
  return !!window.Telegram?.WebApp;
}

export function initTelegram(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
  } catch {
    // ignore
  }
}

export function getTelegramUserId(): number | null {
  try {
    const tg = window.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id;
    return uid ?? null;
  } catch {
    return null;
  }
}

export function getTelegramUserName(): string {
  try {
    const tg = window.Telegram?.WebApp;
    const user = tg?.initDataUnsafe?.user;
    if (user) {
      return user.username || user.first_name || `ID:${user.id}`;
    }
  } catch {
    // ignore
  }
  return '';
}

export function openLink(url: string): void {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try {
      tg.openLink(url);
      return;
    } catch {
      // fallback
    }
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function haptic(type: 'light' | 'medium' | 'heavy' = 'light'): void {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred(type);
      return;
    }
    if (navigator.vibrate) {
      navigator.vibrate(type === 'heavy' ? 30 : type === 'medium' ? 15 : 5);
    }
  } catch {
    // ignore
  }
}

export function hapticSuccess(): void {
  try {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred('success');
      return;
    }
    if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
  } catch {
    // ignore
  }
}