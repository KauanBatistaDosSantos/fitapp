import { isoDate } from "@/lib/date";
import { useDiet } from "@/features/diet/diet.store";
import { useWater } from "@/features/water/water.store";
import { useTraining } from "@/features/training/training.store";
import { useWeight } from "@/features/weight/weight.store";
import { computeDietProgress } from "@/features/diet/diet.service";
import { intakeProgress } from "@/features/water/water.service";
import { getActiveSplits, trainingProgress } from "@/features/training/training.service";
import { progressToTarget } from "@/features/weight/weight.service";

export function useHomeProgress() {
  const dietDay = useDiet((state) => state.days[isoDate()] ?? state.days[state.selectedDateISO]);
  const { today: waterToday } = useWater();
  const { template, weekLog, preferences } = useTraining();
  const { config, entries } = useWeight();

  return {
    dietProgress: dietDay ? computeDietProgress(dietDay).itemProgress : 0,
    waterProgress: intakeProgress(waterToday),
    trainingProgress: trainingProgress(template, weekLog, getActiveSplits(preferences.trainingDays)),
    weightProgress: progressToTarget(entries, config.targetKg),
  };
}
