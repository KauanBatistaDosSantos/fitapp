import { isoDate } from "@/lib/date";
import type { TrainingTemplate, Split, TrainingLog, Exercise, CardioBlock } from "./training.schema";

export const splitOrder: Split[] = ["A", "B", "C", "D", "E", "F", "G"];

export function getActiveSplits(trainingDays: number): Split[] {
  const count = Math.min(7, Math.max(2, Math.round(trainingDays)));
  return splitOrder.slice(0, count);
}

export function todaySplit(trainingDays = 5): Split {
  const activeSplits = getActiveSplits(trainingDays);
  const dayFromMonday = (new Date().getDay() + 6) % 7;
  return activeSplits[Math.min(dayFromMonday, activeSplits.length - 1)];
}

export function trainingProgress(
  template: TrainingTemplate,
  weekLog: TrainingLog[],
  activeSplits: Split[] = splitOrder,
) {
  let available = 0;
  let done = 0;
  for (const split of activeSplits) {
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

export function isTrainingDayConfigured(plan: TrainingTemplate[Split]) {
  return plan.am.length > 0 || plan.pm.length > 0;
}

export function isTrainingDayCompleted(
  plan: TrainingTemplate[Split],
  log?: TrainingLog,
) {
  if (!log || !isTrainingDayConfigured(plan)) return false;
  const cardioCompleted =
    plan.am.length === 0 ||
    log.amDone ||
    plan.am.every((block) => log.completedCardio.includes(block.id));
  const strengthCompleted =
    plan.pm.length === 0 ||
    log.pmDone ||
    plan.pm.every((exercise) => log.doneExercises.includes(exercise.id));
  return cardioCompleted && strengthCompleted;
}

export function hasTrainingDayStarted(log?: TrainingLog) {
  if (!log) return false;
  return (
    log.amDone ||
    log.pmDone ||
    log.completedCardio.length > 0 ||
    log.doneExercises.length > 0 ||
    Object.values(log.setProgress).some((sets) => sets > 0)
  );
}

export function nextTrainingSplit(
  template: TrainingTemplate,
  weekLog: TrainingLog[],
  activeSplits: Split[],
  currentSplit: Split,
) {
  const currentIndex = Math.max(0, activeSplits.indexOf(currentSplit));
  const current = activeSplits[currentIndex];
  const currentPlan = template[current];
  const currentLog = weekLog.find((log) => log.split === current);

  if (isTrainingDayConfigured(currentPlan) && !isTrainingDayCompleted(currentPlan, currentLog)) {
    return current;
  }

  for (let offset = 1; offset <= activeSplits.length; offset += 1) {
    const candidate = activeSplits[(currentIndex + offset) % activeSplits.length];
    const plan = template[candidate];
    const log = weekLog.find((entry) => entry.split === candidate);
    if (isTrainingDayConfigured(plan) && !isTrainingDayCompleted(plan, log)) {
      return candidate;
    }
  }

  return isTrainingDayConfigured(currentPlan)
    ? current
    : activeSplits.find((split) => isTrainingDayConfigured(template[split])) ?? activeSplits[0];
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
