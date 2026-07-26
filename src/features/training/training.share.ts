import { z } from "zod";
import type { ExerciseCatalogItem, TrainingPreferences } from "./training.store";
import type { TrainingTemplate } from "./training.schema";
import { getActiveSplits } from "./training.service";

const SharedExerciseSchema = z.object({
  name: z.string().trim().min(1).max(160),
  sets: z.number().int().min(1).max(30),
  reps: z.string().trim().min(1).max(80),
  restSec: z.number().int().min(0).max(3600),
  notes: z.string().max(1000).optional(),
  gifUrl: z.string().max(2000).optional(),
  muscles: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  secondaryMuscles: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  substitutions: z.array(z.string().trim().min(1).max(160)).max(30).optional(),
});

const SharedWorkoutSchema = z.object({
  label: z.string().trim().max(100),
  cardio: z
    .array(
      z.object({
        kind: z.string().trim().min(1).max(100),
        minutes: z.number().int().min(1).max(1440),
      }),
    )
    .max(30),
  exercises: z.array(SharedExerciseSchema).max(100),
});

export const SharedTrainingPlanSchema = z.object({
  kind: z.literal("fitapp-training-plan"),
  version: z.literal(1),
  title: z.string().trim().min(1).max(100),
  exportedAt: z.string(),
  workouts: z.array(SharedWorkoutSchema).min(2).max(7),
});

export type SharedTrainingPlan = z.infer<typeof SharedTrainingPlanSchema>;

export function createSharedTrainingPlan(
  title: string,
  template: TrainingTemplate,
  preferences: TrainingPreferences,
  catalog: ExerciseCatalogItem[],
): SharedTrainingPlan {
  const catalogById = new Map(catalog.map((item) => [item.id, item]));

  return {
    kind: "fitapp-training-plan",
    version: 1,
    title: title.trim() || "Meu treino",
    exportedAt: new Date().toISOString(),
    workouts: getActiveSplits(preferences.trainingDays).map((split) => ({
      label: preferences.splitLabels[split]?.trim() || `Treino ${split}`,
      cardio: template[split].am.map(({ kind, minutes }) => ({ kind, minutes })),
      exercises: template[split].pm.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        restSec: exercise.restSec,
        notes: exercise.notes,
        gifUrl: exercise.gifUrl,
        muscles: exercise.muscles,
        secondaryMuscles: exercise.secondaryMuscles,
        substitutions: exercise.substitutions
          ?.map((id) => catalogById.get(id)?.name)
          .filter((name): name is string => Boolean(name)),
      })),
    })),
  };
}

export function parseSharedTrainingPlan(value: unknown): SharedTrainingPlan {
  return SharedTrainingPlanSchema.parse(value);
}

export function sharedPlanFilename(title: string) {
  const safeTitle = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  return `${safeTitle || "meu-treino"}.fitapp.json`;
}
