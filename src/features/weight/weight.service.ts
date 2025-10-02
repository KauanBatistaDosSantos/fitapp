import type { WeightConfig, WeightEntry } from "./weight.schema";

export function bmi(weightKg: number, heightM: number) {
  if (!heightM) return 0;
  return weightKg / (heightM * heightM);
}

export function bmiStatus(value: number) {
  if (value < 18.5) return { label: "Abaixo do peso", color: "#f97316" };
  if (value < 25) return { label: "Peso ideal", color: "#22c55e" };
  if (value < 30) return { label: "Sobrepeso", color: "#facc15" };
  return { label: "Obesidade", color: "#ef4444" };
}

export function sortEntries(entries: WeightEntry[]) {
  return [...entries].sort((a, b) => (a.dateISO > b.dateISO ? 1 : -1));
}

export function progressToTarget(entries: WeightEntry[], target: number) {
  if (entries.length === 0) return 0;
  const sorted = sortEntries(entries);
  const start = sorted[0].kg;
  const current = sorted[sorted.length - 1].kg;
  const totalDelta = Math.abs(start - target);
  const currentDelta = Math.abs(current - target);
  if (totalDelta === 0) return 1;
  return Math.min(1, (totalDelta - currentDelta) / totalDelta);
}

export function weightStats(entries: WeightEntry[], config: WeightConfig) {
  const sorted = sortEntries(entries);
  const current = sorted.at(-1);
  const start = sorted[0];
  const bmiValue = current ? bmi(current.kg, config.heightM) : 0;
  const status = bmiStatus(bmiValue);
  const diffs = sorted.slice(1).map((entry, index) => entry.kg - sorted[index].kg);
  const variation = diffs.length > 0 ? diffs.reduce((acc, value) => acc + value, 0) / diffs.length : 0;
  const minKg = sorted.length > 0 ? Math.min(...sorted.map((entry) => entry.kg)) : 0;
  return {
    currentKg: current?.kg ?? 0,
    startKg: start?.kg ?? 0,
    bmi: bmiValue,
    status,
    variation,
    change: current && start ? current.kg - start.kg : 0,
    minKg,
  };
}

export function toChartData(entries: WeightEntry[]) {
  return sortEntries(entries).map((entry) => ({
    date: new Date(entry.dateISO).toLocaleDateString("pt-BR", { month: "short", day: "2-digit" }),
    kg: entry.kg,
  }));
}