// features/weight/weight.schema.ts
import { z } from "zod";
export const WeightEntry = z.object({ dateISO: z.string(), kg: z.number() });
export type WeightEntry = z.infer<typeof WeightEntry>;

export const WeightConfig = z.object({
  heightM: z.number(), targetKg: z.number(),
  startKg: z.number().optional()
});
export type WeightConfig = z.infer<typeof WeightConfig>;
