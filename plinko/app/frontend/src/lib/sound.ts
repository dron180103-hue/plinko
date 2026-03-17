// Web Audio API sound effects for Plinko

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getCtx(): AudioContext | null {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  if (enabled) localStorage.setItem('plinko_sound', '1');
  else localStorage.setItem('plinko_sound', '0');
}

export function isSoundEnabled(): boolean {
  const saved = localStorage.getItem('plinko_sound');
  if (saved === '0') { soundEnabled = false; return false; }
  soundEnabled = true;
  return true;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', vol = 0.1) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(vol, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playTap() {
  playTone(800, 0.05, 'sine', 0.06);
}

export function playDrop() {
  playTone(400, 0.15, 'sine', 0.08);
  setTimeout(() => playTone(500, 0.1, 'sine', 0.05), 50);
}

export function playPegHit() {
  playTone(1200 + Math.random() * 600, 0.03, 'triangle', 0.03);
}

export function playSlotLand(multiplier: number) {
  if (multiplier >= 5) {
    // Big win fanfare
    playTone(523, 0.15, 'square', 0.08);
    setTimeout(() => playTone(659, 0.15, 'square', 0.08), 100);
    setTimeout(() => playTone(784, 0.2, 'square', 0.1), 200);
    setTimeout(() => playTone(1047, 0.3, 'square', 0.12), 300);
  } else if (multiplier >= 2) {
    playTone(660, 0.12, 'sine', 0.08);
    setTimeout(() => playTone(880, 0.15, 'sine', 0.08), 80);
  } else if (multiplier >= 1) {
    playTone(550, 0.1, 'sine', 0.06);
  } else {
    playTone(220, 0.15, 'sine', 0.04);
  }
}

export function playBonus() {
  playTone(523, 0.1, 'square', 0.08);
  setTimeout(() => playTone(659, 0.1, 'square', 0.08), 80);
  setTimeout(() => playTone(784, 0.1, 'square', 0.08), 160);
  setTimeout(() => playTone(1047, 0.2, 'square', 0.1), 240);
}