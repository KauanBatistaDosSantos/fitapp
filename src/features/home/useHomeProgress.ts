// src/features/home/useHomeProgress.ts
export function useHomeProgress() {
  // Você pode ligar isso às stores depois. Por ora, só para renderizar a Home:
  return {
    dietProgress: 0,
    waterProgress: 0,
    trainingProgress: 0,
    weightProgress: 0,
  };
}
