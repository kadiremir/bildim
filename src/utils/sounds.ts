// Programmatic tones via Web Audio API (works on Expo web; graceful no-op on native)
type SoundType = 'swipe' | 'correct' | 'wrong' | 'tap' | 'points';

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  return new Ctx();
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
    switch (type) {
      case 'swipe':
        playTone(300, 'sine', 0.12, 0.08, 500);
        break;
      case 'tap':
        playTone(600, 'sine', 0.06, 0.06);
        break;
      case 'correct':
        // Ascending arpeggio
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
    // silently ignore if AudioContext unavailable
  }
}
