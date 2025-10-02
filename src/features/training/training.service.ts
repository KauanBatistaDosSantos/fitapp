import { isoDate } from "@/lib/date";
import type { TrainingTemplate, Split, TrainingLog, Exercise, CardioBlock } from "./training.schema";

export const splitOrder: Split[] = ["A", "B", "C", "D", "E"];

export function todaySplit(): Split {
  const day = new Date().getDay();
  return splitOrder[Math.min(day, splitOrder.length - 1)];
}

export function trainingProgress(template: TrainingTemplate, weekLog: TrainingLog[]) {
  let available = 0;
  let done = 0;
  for (const split of splitOrder) {
    const plan = template[split];
    const log = weekLog.find((item) => item.split === split);
    if (!plan) continue;
    if (plan.am.length > 0) {
      available += 1;
      if (log?.amDone) done += 1;
    }
    if (plan.pm.length > 0) {
      available += 1;
      if (log?.pmDone) done += 1;
    }
  }
  return available === 0 ? 0 : done / available;
}

export function sessionProgress(plan: { am: CardioBlock[]; pm: Exercise[] }, log?: TrainingLog) {
  const total = (plan.am.length > 0 ? 1 : 0) + (plan.pm.length > 0 ? 1 : 0);
  const completed = (log?.amDone ? 1 : 0) + (log?.pmDone ? 1 : 0);
  return total === 0 ? 0 : completed / total;
}

export function isToday(log: TrainingLog) {
  return log.dateISO === isoDate();
}