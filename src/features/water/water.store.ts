import { create } from "zustand";
import { load, save } from "@/lib/persist";
import { isoDate } from "@/lib/date";
import type { WaterLog, WaterConfig } from "./water.schema";
import { ensureTodayLog } from "./water.service";
import { waterConfigSeed, waterHistorySeed, waterTodaySeed } from "./water.seed";

type WaterState = {
  config: WaterConfig;
  today: WaterLog;
  monthHistory: WaterLog[];
  setTarget: (ml: number) => void;
  setPresets: (values: number[]) => void;
  addEntry: (ml: number) => void;
  resetToday: () => void;
  commitToday: () => void;
};

const configFallback = () => load("water:config", waterConfigSeed);
const historyFallback = () => load("water:hist", waterHistorySeed);
const todayFallback = () => {
  const saved = load<WaterLog | null>("water:today", null);
  const config = configFallback();
  if (saved) return ensureTodayLog(saved, config.targetML);
  return ensureTodayLog(waterTodaySeed, config.targetML);
};

export const useWater = create<WaterState>((set) => ({
  config: configFallback(),
  today: todayFallback(),
  monthHistory: historyFallback(),

  setTarget: (ml) =>
    set((state) => {
      const config = { ...state.config, targetML: ml };
      const today = { ...state.today, targetML: ml };
      save("water:config", config);
      save("water:today", today);
      return { config, today };
    }),

  setPresets: (values) =>
    set((state) => {
      const config = { ...state.config, presets: values };
      save("water:config", config);
      return { config };
    }),

  addEntry: (ml) =>
    set((state) => {
      const today = ensureTodayLog(state.today, state.config.targetML);
      today.entries = [...today.entries, ml];
      save("water:today", today);
      return { today };
    }),

  resetToday: () =>
    set((state) => {
      const today = { dateISO: isoDate(), targetML: state.config.targetML, entries: [] };
      save("water:today", today);
      return { today };
    }),

  commitToday: () =>
    set((state) => {
      const today = ensureTodayLog(state.today, state.config.targetML);
      const monthHistory = [
        ...state.monthHistory.filter((entry) => entry.dateISO !== today.dateISO),
        today,
      ].sort((a, b) => (a.dateISO > b.dateISO ? -1 : 1));
      save("water:hist", monthHistory);
      save("water:today", today);
      return { monthHistory, today };
    }),
}));