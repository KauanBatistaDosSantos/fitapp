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
  const cardioTotal = plan.am.length;
  const cardioDone = Math.min(cardioTotal, log?.completedCardio.length ?? 0);
  const pmTotalSets = plan.pm.reduce((acc, ex) => acc + ex.sets, 0);
  const pmDoneSets = plan.pm.reduce((acc, ex) => {
    if (!log) return acc;
    const completedSets = log.setProgress[ex.id] ?? (log.doneExercises.includes(ex.id) ? ex.sets : 0);
    return acc + Math.min(ex.sets, completedSets);
  }, 0);
  const totalUnits = cardioTotal + pmTotalSets;
  const completedUnits = cardioDone + pmDoneSets;
  if (totalUnits === 0) return 0;
  return completedUnits / totalUnits;
}

export function isToday(log: TrainingLog) {
  return log.dateISO === isoDate();
}