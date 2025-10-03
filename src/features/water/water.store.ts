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
  updateTodayEntry: (index: number, ml: number) => void;
  removeTodayEntry: (index: number) => void;
  updateHistoryEntry: (dateISO: string, total: number) => void;
  removeHistoryEntry: (dateISO: string) => void;
};

const useSeedData = import.meta.env.DEV;

const defaultConfig: WaterConfig = { targetML: 0, presets: [] };
const emptyHistory: WaterLog[] = [];
const createEmptyToday = (targetML: number): WaterLog => ({ dateISO: isoDate(), targetML, entries: [] });

const configFallback = () => load("water:config", useSeedData ? waterConfigSeed : defaultConfig);
const historyFallback = () => load("water:hist", useSeedData ? waterHistorySeed : emptyHistory);
const todayFallback = () => {
  const saved = load<WaterLog | null>("water:today", null);
  const config = configFallback();
  if (saved) return ensureTodayLog(saved, config.targetML);
  const baseToday = useSeedData
    ? { ...waterTodaySeed, entries: [...waterTodaySeed.entries] }
    : createEmptyToday(config.targetML);
  return ensureTodayLog(baseToday, config.targetML);};

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

  updateTodayEntry: (index, ml) =>
    set((state) => {
      const today = ensureTodayLog(state.today, state.config.targetML);
      if (!Number.isFinite(ml) || ml <= 0) return { today };
      today.entries = today.entries.map((entry, idx) => (idx === index ? ml : entry));
      save("water:today", today);
      return { today };
    }),

  removeTodayEntry: (index) =>
    set((state) => {
      const today = ensureTodayLog(state.today, state.config.targetML);
      today.entries = today.entries.filter((_, idx) => idx !== index);
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

  updateHistoryEntry: (dateISO, total) =>
    set((state) => {
      if (!Number.isFinite(total) || total <= 0) return {};
      const monthHistory = state.monthHistory.map((log) =>
        log.dateISO === dateISO ? { ...log, entries: [total] } : log,
      );
      save("water:hist", monthHistory);
      return { monthHistory };
    }),

  removeHistoryEntry: (dateISO) =>
    set((state) => {
      const monthHistory = state.monthHistory.filter((log) => log.dateISO !== dateISO);
      save("water:hist", monthHistory);
      return { monthHistory };
    }),
}));