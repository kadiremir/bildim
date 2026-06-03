import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

type SoundType = 'swipe' | 'correct' | 'wrong' | 'tap' | 'points';
type Tone = {
  frequency: number;
  duration: number;
  gain: number;
  delay?: number;
  startFreq?: number;
  wave?: OscillatorType;
};

const NATIVE_PATTERNS: Record<SoundType, Tone[]> = {
  swipe: [{ frequency: 300, startFreq: 500, duration: 0.12, gain: 0.08 }],
  tap: [{ frequency: 600, duration: 0.06, gain: 0.06 }],
  correct: [
    { frequency: 523, duration: 0.15, gain: 0.12 },
    { frequency: 659, duration: 0.15, gain: 0.12, delay: 100 },
    { frequency: 784, duration: 0.15, gain: 0.12, delay: 200 },
    { frequency: 1047, duration: 0.4, gain: 0.08, delay: 300 },
    { frequency: 1319, duration: 0.4, gain: 0.08, delay: 300 },
  ],
  wrong: [{ frequency: 200, startFreq: 350, duration: 0.22, gain: 0.08, wave: 'sawtooth' }],
  points: [
    { frequency: 880, duration: 0.1, gain: 0.06 },
    { frequency: 1100, duration: 0.1, gain: 0.06, delay: 80 },
    { frequency: 1320, duration: 0.2, gain: 0.08, delay: 160 },
  ],
};

let audioModeReady = false;
const activePlayers = new Set<AudioPlayer>();

function encodeBase64(bytes: Uint8Array): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triplet = (a << 16) | (b << 8) | c;

    result += chars[(triplet >> 18) & 63];
    result += chars[(triplet >> 12) & 63];
    result += i + 1 < bytes.length ? chars[(triplet >> 6) & 63] : '=';
    result += i + 2 < bytes.length ? chars[triplet & 63] : '=';
  }

  return result;
}

function writeAscii(bytes: Uint8Array, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) bytes[offset + i] = text.charCodeAt(i);
}

function writeUint16(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
}

function writeUint32(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff;
  bytes[offset + 1] = (value >> 8) & 0xff;
  bytes[offset + 2] = (value >> 16) & 0xff;
  bytes[offset + 3] = (value >> 24) & 0xff;
}

function makeToneUri(tone: Tone): string {
  const sampleRate = 22050;
  const sampleCount = Math.max(1, Math.floor(sampleRate * tone.duration));
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const dataSize = sampleCount * 2;

  writeAscii(bytes, 0, 'RIFF');
  writeUint32(bytes, 4, 36 + dataSize);
  writeAscii(bytes, 8, 'WAVE');
  writeAscii(bytes, 12, 'fmt ');
  writeUint32(bytes, 16, 16);
  writeUint16(bytes, 20, 1);
  writeUint16(bytes, 22, 1);
  writeUint32(bytes, 24, sampleRate);
  writeUint32(bytes, 28, sampleRate * 2);
  writeUint16(bytes, 32, 2);
  writeUint16(bytes, 34, 16);
  writeAscii(bytes, 36, 'data');
  writeUint32(bytes, 40, dataSize);

  for (let i = 0; i < sampleCount; i++) {
    const progress = i / sampleCount;
    const frequency = tone.startFreq
      ? tone.startFreq + (tone.frequency - tone.startFreq) * progress
      : tone.frequency;
    const envelope = Math.max(0, 1 - progress);
    const raw = tone.wave === 'sawtooth'
      ? 2 * ((frequency * i / sampleRate) % 1) - 1
      : Math.sin(2 * Math.PI * frequency * (i / sampleRate));
    const sample = Math.max(-1, Math.min(1, raw * tone.gain * envelope));
    const value = Math.round(sample * 32767);
    writeUint16(bytes, 44 + i * 2, value < 0 ? value + 65536 : value);
  }

  return `data:audio/wav;base64,${encodeBase64(bytes)}`;
}

async function ensureNativeAudioMode() {
  if (audioModeReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'mixWithOthers',
  });
  audioModeReady = true;
}

async function playNativeTone(tone: Tone) {
  if (tone.delay) {
    await new Promise((resolve) => setTimeout(resolve, tone.delay));
  }

  await ensureNativeAudioMode();
  const player = createAudioPlayer(
    { uri: makeToneUri(tone) },
    { keepAudioSessionActive: true },
  );
  activePlayers.add(player);
  player.play();

  setTimeout(() => {
    activePlayers.delete(player);
    player.remove();
  }, tone.duration * 1000 + 1200);
}

// Reuse a single AudioContext — browsers cap concurrent instances at ~6–8
let _audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (_audioCtx && _audioCtx.state !== 'closed') return _audioCtx;
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  _audioCtx = new Ctx();
  return _audioCtx;
}

function playTone(
  frequency: number,
  type: OscillatorType,
  duration: number,
  gain: number,
  startFreq?: number,
) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  const t = ctx.currentTime;
  if (startFreq !== undefined) {
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(frequency, t + duration * 0.8);
  } else {
    osc.frequency.setValueAtTime(frequency, t);
  }
  gainNode.gain.setValueAtTime(gain, t);
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

function playChord(notes: number[], duration: number, gain: number) {
  notes.forEach((f) => playTone(f, 'sine', duration, gain));
}

export function playSound(type: SoundType) {
  try {
    if (Platform.OS !== 'web') {
      NATIVE_PATTERNS[type].forEach((tone) => {
        playNativeTone(tone).catch(() => {});
      });
      return;
    }

    switch (type) {
      case 'swipe':
        playTone(300, 'sine', 0.12, 0.08, 500);
        break;
      case 'tap':
        playTone(600, 'sine', 0.06, 0.06);
        break;
      case 'correct':
        setTimeout(() => playTone(523, 'sine', 0.15, 0.12), 0);
        setTimeout(() => playTone(659, 'sine', 0.15, 0.12), 100);
        setTimeout(() => playTone(784, 'sine', 0.15, 0.12), 200);
        setTimeout(() => playChord([1047, 1319], 0.4, 0.1), 300);
        break;
      case 'wrong':
        playTone(200, 'sawtooth', 0.22, 0.08, 350);
        break;
      case 'points':
        setTimeout(() => playTone(880, 'sine', 0.1, 0.06), 0);
        setTimeout(() => playTone(1100, 'sine', 0.1, 0.06), 80);
        setTimeout(() => playTone(1320, 'sine', 0.2, 0.08), 160);
        break;
    }
  } catch (_) {
    // Ignore environments that block programmatic audio.
  }
}
