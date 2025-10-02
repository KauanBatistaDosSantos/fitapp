import { useDiet } from "@/features/diet/diet.store";
import { useWater } from "@/features/water/water.store";
import { useTraining } from "@/features/training/training.store";
import { useWeight } from "@/features/weight/weight.store";
import { computeDietProgress } from "@/features/diet/diet.service";
import { intakeProgress } from "@/features/water/water.service";
import { trainingProgress } from "@/features/training/training.service";
import { progressToTarget } from "@/features/weight/weight.service";

export function useHomeProgress() {
  const { today } = useDiet();
  const { today: waterToday } = useWater();
  const { template, weekLog } = useTraining();
  const { config, entries } = useWeight();

  return {
    dietProgress: computeDietProgress(today).itemProgress,
    waterProgress: intakeProgress(waterToday),
    trainingProgress: trainingProgress(template, weekLog),
    weightProgress: progressToTarget(entries, config.targetKg),
  };
}