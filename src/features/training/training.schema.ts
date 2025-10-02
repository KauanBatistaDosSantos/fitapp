// features/training/training.schema.ts
import { z } from "zod";
export const Split = z.enum(["A","B","C","D","E"]);
export type Split = z.infer<typeof Split>;

export const CardioKind = z.string();
export type CardioKind = z.infer<typeof CardioKind>;

export const CardioBlock = z.object({ id: z.string(), kind: CardioKind, minutes: z.number() });
export type CardioBlock = z.infer<typeof CardioBlock>;

export const Exercise = z.object({
  id: z.string(),
  name: z.string(),
  sets: z.number(),
  reps: z.string(),        // "4x12" ou "12" ou "8-10"
  restSec: z.number().default(60),
  loadKg: z.number().optional(),
  notes: z.string().optional(),
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