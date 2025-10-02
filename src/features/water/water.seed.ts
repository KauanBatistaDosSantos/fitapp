import { isoDate } from "@/lib/date";
import type { WaterConfig, WaterLog } from "./water.schema";

export const waterConfigSeed: WaterConfig = {
  targetML: 2000,
  presets: [220, 250, 300, 330, 500, 550, 1000],
};

export const waterTodaySeed: WaterLog = {
  dateISO: isoDate(),
  targetML: waterConfigSeed.targetML,
  entries: [330, 330, 500],
};

export const waterHistorySeed: WaterLog[] = [
  { dateISO: "2025-01-01", targetML: 2000, entries: [300, 300, 500, 500, 400] },
  { dateISO: "2025-01-02", targetML: 2000, entries: [500, 500, 500, 300] },
  { dateISO: "2025-01-03", targetML: 2000, entries: [330, 330, 500, 500] },
  { dateISO: "2025-01-04", targetML: 2000, entries: [250, 250, 500, 500, 250] },
  { dateISO: "2025-01-05", targetML: 2000, entries: [500, 500, 500, 500] },
  { dateISO: "2025-01-06", targetML: 2000, entries: [330, 330, 500, 330] },
  { dateISO: "2025-01-07", targetML: 2000, entries: [220, 220, 330, 330, 500, 400] },
];