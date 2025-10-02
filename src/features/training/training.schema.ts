// features/training/training.schema.ts
import { z } from "zod";

export const Split = z.enum(["A", "B", "C", "D", "E"]);
export type Split = z.infer<typeof Split>;

export const CardioKind = z.string();
export type CardioKind = z.infer<typeof CardioKind>;

export const CardioBlock = z.object({ id: z.string(), kind: CardioKind, minutes: z.number() });
export type CardioBlock = z.infer<typeof CardioBlock>;

export const Exercise = z.object({
  id: z.string(),
  catalogId: z.string().optional(),
  name: z.string(),
  sets: z.number(),
  reps: z.string(), // "4x12" ou "12" ou "8-10"
  restSec: z.number().default(60),
  loadKg: z.number().optional(),
  notes: z.string().optional(),
  gifUrl: z.string().url().optional(),
  muscles: z.array(z.string()).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  substitutions: z.array(z.string()).optional(),
  loadHistory: z
    .array(
      z.object({
        dateISO: z.string(),
        loadKg: z.number(),
      }),
    )
    .optional(),
});
export type Exercise = z.infer<typeof Exercise>;

export const TrainingDayPlan = z.object({
  split: Split,
  am: z.array(CardioBlock),     // Part 1 (cardio)
  pm: z.array(Exercise),        // Part 2 (musculação)
});
export type TrainingDayPlan = z.infer<typeof TrainingDayPlan>;

export const TrainingTemplate = z.record(Split, TrainingDayPlan);
export type TrainingTemplate = z.infer<typeof TrainingTemplate>;

export const TrainingLog = z.object({
  dateISO: z.string(),
  split: Split,
  amDone: z.boolean(),
  pmDone: z.boolean(),
  doneExercises: z.array(z.string()),
  completedCardio: z.array(z.string()).default([]),
  setProgress: z.record(z.string(), z.number()).default({}),
});
export type TrainingLog = z.infer<typeof TrainingLog>;