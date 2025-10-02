import { isoDate } from "@/lib/date";
import type { WaterLog } from "./water.schema";

export function totalIntake(log: WaterLog) {
  return log.entries.reduce((acc, value) => acc + value, 0);
}

export function intakeProgress(log: WaterLog) {
  if (!log.targetML) return 0;
  return Math.min(1, totalIntake(log) / log.targetML);
}

export function formatMl(ml: number) {
  return `${(ml / 1000).toFixed(2).replace(".", ",")} L`;
}

export function groupByMonth(history: WaterLog[]) {
  const map = new Map<string, WaterLog[]>();
  history.forEach((log) => {
    const month = log.dateISO.slice(0, 7);
    if (!map.has(month)) map.set(month, []);
    map.get(month)!.push(log);
  });
  return map;
}

export function ensureTodayLog(log: WaterLog, target: number): WaterLog {
  if (log.dateISO === isoDate()) return log;
  return { dateISO: isoDate(), targetML: target, entries: [] };
}

export function streak(history: WaterLog[], target: number) {
  const sorted = [...history].sort((a, b) => (a.dateISO > b.dateISO ? -1 : 1));
  let streakCount = 0;
  for (const log of sorted) {
    if (totalIntake(log) >= target) streakCount += 1;
    else break;
  }
  return streakCount;
}