// features/water/water.schema.ts
import { z } from "zod";
export const WaterLog = z.object({ dateISO: z.string(), targetML: z.number(), entries: z.array(z.number()) });
export type WaterLog = z.infer<typeof WaterLog>;

export const WaterConfig = z.object({
  targetML: z.number().default(2000),
  presets: z.array(z.number()).default([220,250,300,330,500,1000,2000])
});
export type WaterConfig = z.infer<typeof WaterConfig>;
