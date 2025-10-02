import { isoDate } from "@/lib/date";
import type { WeightConfig, WeightEntry } from "./weight.schema";

export const weightConfigSeed: WeightConfig = {
  heightM: 1.72,
  targetKg: 68,
  startKg: 74,
};

export const weightEntriesSeed: WeightEntry[] = [
  { dateISO: "2024-11-01", kg: 74 },
  { dateISO: "2024-12-01", kg: 72.5 },
  { dateISO: "2025-01-05", kg: 71.8 },
  { dateISO: "2025-02-02", kg: 70.6 },
  { dateISO: "2025-03-09", kg: 69.4 },
  { dateISO: "2025-04-06", kg: 68.8 },
  { dateISO: isoDate(), kg: 68.2 },
];