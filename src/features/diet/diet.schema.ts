// features/diet/diet.schema.ts
import { z } from "zod";

export const MealName = z.enum(["breakfast","snack1","lunch","snack2","dinner"]);
export type MealName = z.infer<typeof MealName>;

export const Dish = z.object({
  id: z.string(), name: z.string(),
  unit: z.string().default("porção"), kcal: z.number().optional(),
  notes: z.string().optional()
});
export type Dish = z.infer<typeof Dish>;

export const MealTemplateItem = z.object({
  id: z.string(), dishId: z.string(), qty: z.number().default(1)
});
export type MealTemplateItem = z.infer<typeof MealTemplateItem>;

export const DayPlan = z.object({
  meals: z.record(MealName, z.array(MealTemplateItem))
});
export type DayPlan = z.infer<typeof DayPlan>;

export const WeeklyDietTemplate = z.record(
  z.enum(["sun","mon","tue","wed","thu","fri","sat"]),
  DayPlan
);
export type WeeklyDietTemplate = z.infer<typeof WeeklyDietTemplate>;

export const DailyDietProgress = z.object({
  dateISO: z.string(),
  meals: z.record(MealName, z.array(z.object({
    id: z.string(), dishId: z.string(), qty: z.number(), checked: z.boolean()
  })))
});
export type DailyDietProgress = z.infer<typeof DailyDietProgress>;
