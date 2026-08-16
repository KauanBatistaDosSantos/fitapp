export type TrainingRestSound = "series" | "exercise";

type AudioContextConstructor = new () => AudioContext;

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

function scheduleTone(context: AudioContext, frequency: number, startsAt: number, duration: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, startsAt);
  gain.gain.setValueAtTime(0.0001, startsAt);
  gain.gain.exponentialRampToValueAtTime(0.2, startsAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startsAt);
  oscillator.stop(startsAt + duration + 0.02);
}

function scheduleSound(context: AudioContext, sound: TrainingRestSound) {
  const startsAt = context.currentTime + 0.02;
  if (sound === "series") {
    scheduleTone(context, 880, startsAt, 0.16);
    scheduleTone(context, 880, startsAt + 0.22, 0.18);
    return;
  }

  scheduleTone(context, 523.25, startsAt, 0.18);
  scheduleTone(context, 659.25, startsAt + 0.16, 0.18);
  scheduleTone(context, 783.99, startsAt + 0.32, 0.28);
}

export function primeTrainingAudio() {
  const context = getAudioContext();
  if (!context || context.state !== "suspended") return;
  void context.resume().catch(() => undefined);
}

export function playTrainingRestSound(sound: TrainingRestSound) {
  const context = getAudioContext();
  if (!context) return;

  const play = () => scheduleSound(context, sound);
  if (context.state === "running") {
    play();
    return;
  }

  void context.resume().then(play).catch(() => undefined);
}
