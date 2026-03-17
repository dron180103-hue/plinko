import { createClient } from '@metagptx/web-sdk';

const client = createClient();

export { client };

// ==================== RETRY & ERROR HELPERS ====================

const MAX_RETRIES = 2;
const RETRY_DELAY = 800;
const API_TIMEOUT = 12000; // 12s timeout

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Request timeout')), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await withTimeout(fn(), API_TIMEOUT);
    } catch (err: any) {
      lastError = err;
      // Don't retry on 4xx client errors
      const status = err?.status || err?.response?.status || 0;
      if (status >= 400 && status < 500) throw err;
      // Don't retry on timeout for saves (avoid stacking)
      if (err?.message === 'Request timeout' && i > 0) throw err;
      // Wait before retry with exponential backoff
      if (i < retries) await new Promise(r => setTimeout(r, RETRY_DELAY * (i + 1)));
    }
  }
  throw lastError;
}

export function getErrorDetail(err: any): string {
  return (
    err?.data?.detail ||
    err?.response?.data?.detail ||
    err?.detail ||
    err?.message ||
    'Unknown error'
  );
}

// ==================== CONNECTION STATUS ====================

let _isOnline = true;
let _onStatusChange: ((online: boolean) => void) | null = null;

export function isApiOnline(): boolean {
  return _isOnline;
}

export function onConnectionStatusChange(cb: (online: boolean) => void): () => void {
  _onStatusChange = cb;
  return () => { _onStatusChange = null; };
}

function setOnlineStatus(online: boolean) {
  if (_isOnline !== online) {
    _isOnline = online;
    _onStatusChange?.(online);
  }
}

// ==================== AUTH API ====================

export interface PlayerAuth {
  id: number;
  nickname: string;
  token: string;
  is_admin?: boolean;
}

export async function apiRegister(nickname: string, password: string): Promise<PlayerAuth> {
  try {
    const response = await withRetry(() =>
      client.apiCall.invoke({
        url: '/api/v1/game/register',
        method: 'POST',
        data: { nickname, password },
      })
    );
    setOnlineStatus(true);
    return response.data as PlayerAuth;
  } catch (err) {
    const status = (err as any)?.status || (err as any)?.response?.status || 0;
    if (status === 0 || status >= 500) setOnlineStatus(false);
    throw err;
  }
}

export async function apiLogin(nickname: string, password: string): Promise<PlayerAuth> {
  try {
    const response = await withRetry(() =>
      client.apiCall.invoke({
        url: '/api/v1/game/login',
        method: 'POST',
        data: { nickname, password },
      })
    );
    setOnlineStatus(true);
    return response.data as PlayerAuth;
  } catch (err) {
    const status = (err as any)?.status || (err as any)?.response?.status || 0;
    if (status === 0 || status >= 500) setOnlineStatus(false);
    throw err;
  }
}

// ==================== PROGRESS API ====================

export interface ProgressData {
  player_id: number;
  balance: number;
  level: number;
  xp: number;
  total_drops: number;
  total_won: number;
  total_spent: number;
  biggest_win: number;
  tap_count: number;
  combo_count: number;
  max_combo: number;
  consecutive_losses: number;
  prestige_level: number;
  selected_skin: string;
  selected_theme: string;
  owned_skins: string;
  owned_themes: string;
  active_boosters: string;
  shop_purchases: number;
  achievements: string;
  daily_challenges: string;
  weekly_challenges: string;
  last_daily_bonus: string | null;
  last_hourly_bonus: string | null;
  last_wheel_spin: string | null;
  login_streak?: number;
  last_login_date?: string;
}

export async function apiGetProgress(playerId: number): Promise<ProgressData> {
  try {
    const response = await withRetry(() =>
      client.apiCall.invoke({
        url: `/api/v1/game/progress/${playerId}`,
        method: 'GET',
        data: {},
      })
    );
    setOnlineStatus(true);
    return response.data as ProgressData;
  } catch (err) {
    const status = (err as any)?.status || (err as any)?.response?.status || 0;
    if (status === 0 || status >= 500) setOnlineStatus(false);
    throw err;
  }
}

// Save progress with debounce — never throws
let saveInFlight = false;
let pendingSave: ProgressData | null = null;

export async function apiSaveProgress(data: ProgressData): Promise<boolean> {
  // Always update local backup immediately
  saveLocalProgress(data);

  if (saveInFlight) {
    // Queue latest data for next save
    pendingSave = data;
    return false;
  }
  saveInFlight = true;
  try {
    await withRetry(
      () =>
        client.apiCall.invoke({
          url: '/api/v1/game/progress/save',
          method: 'POST',
          data: data,
        }),
      1 // Only 1 retry for saves
    );
    setOnlineStatus(true);
    return true;
  } catch {
    setOnlineStatus(false);
    return false;
  } finally {
    saveInFlight = false;
    // Process queued save
    if (pendingSave) {
      const queued = pendingSave;
      pendingSave = null;
      // Small delay to avoid rapid-fire
      setTimeout(() => apiSaveProgress(queued), 500);
    }
  }
}

// Beacon save for page unload — uses dedicated beacon endpoint
export function beaconSaveProgress(data: ProgressData): void {
  saveLocalProgress(data);
  try {
    const blob = new Blob([JSON.stringify(data)], { type: 'text/plain' });
    navigator.sendBeacon('/api/v1/game/progress/beacon', blob);
  } catch {
    // Fallback: already saved locally
  }
}

// ==================== LEADERBOARD API ====================

export interface LeaderboardItem {
  nickname: string;
  total_won: number;
  level: number;
  prestige_level: number;
}

export async function apiGetLeaderboard(): Promise<LeaderboardItem[]> {
  try {
    const response = await withRetry(() =>
      client.apiCall.invoke({
        url: '/api/v1/game/leaderboard',
        method: 'GET',
        data: {},
      })
    );
    setOnlineStatus(true);
    return (response.data || []) as LeaderboardItem[];
  } catch {
    setOnlineStatus(false);
    return [];
  }
}

// ==================== HEALTH CHECK ====================

export async function apiHealthCheck(): Promise<boolean> {
  try {
    const response = await withTimeout(
      client.apiCall.invoke({
        url: '/api/v1/game/health',
        method: 'GET',
        data: {},
      }),
      5000
    );
    const ok = response?.data?.status === 'ok';
    setOnlineStatus(ok);
    return ok;
  } catch {
    setOnlineStatus(false);
    return false;
  }
}

// ==================== LOCAL SESSION ====================

const SESSION_KEY = 'plinko_session';

export interface SessionData {
  playerId: number;
  nickname: string;
  token: string;
  isAdmin?: boolean;
}

export function saveSession(data: SessionData): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function getSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Validate structure
    if (!parsed?.playerId || !parsed?.nickname) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(LOCAL_PROGRESS_KEY);
  } catch { /* ignore */ }
}

// ==================== LOCAL PROGRESS BACKUP ====================

const LOCAL_PROGRESS_KEY = 'plinko_progress_backup';

export function saveLocalProgress(data: ProgressData): void {
  try {
    localStorage.setItem(LOCAL_PROGRESS_KEY, JSON.stringify({
      ...data,
      _savedAt: Date.now(),
    }));
  } catch { /* quota exceeded — ignore */ }
}

export function loadLocalProgress(): ProgressData | null {
  try {
    const raw = localStorage.getItem(LOCAL_PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Check if backup is not too old (max 7 days)
    if (parsed._savedAt && Date.now() - parsed._savedAt > 7 * 24 * 60 * 60 * 1000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}