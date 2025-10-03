import { create } from "zustand";
import { load, save } from "@/lib/persist";
import type { WeightConfig, WeightEntry } from "./weight.schema";
import { weightConfigSeed, weightEntriesSeed } from "./weight.seed";
import { isoDate } from "@/lib/date";

type WeightState = {
  config: WeightConfig;
  entries: WeightEntry[];
  updateConfig: (patch: Partial<WeightConfig>) => void;
  addEntry: (kg: number, dateISO?: string) => void;
  updateEntry: (dateISO: string, kg: number) => void;
  removeEntry: (dateISO: string) => void;
};

const useSeedData = import.meta.env.DEV;

const defaultConfig: WeightConfig = { heightM: 0, targetKg: 0 };
const defaultEntries: WeightEntry[] = [];

const configFallback = () => load("weight:config", useSeedData ? weightConfigSeed : defaultConfig);
const entriesFallback = () => load("weight:entries", useSeedData ? weightEntriesSeed : defaultEntries);

export const useWeight = create<WeightState>((set) => ({
  config: configFallback(),
  entries: entriesFallback(),

  updateConfig: (patch) =>
    set((state) => {
      const config = { ...state.config, ...patch };
      save("weight:config", config);
      return { config };
    }),

  addEntry: (kg, dateISO = isoDate()) =>
    set((state) => {
      const entries = [...state.entries.filter((entry) => entry.dateISO !== dateISO), { dateISO, kg }].sort((a, b) =>
        a.dateISO > b.dateISO ? 1 : -1,
      );
      save("weight:entries", entries);
      return { entries };
    }),

  updateEntry: (dateISO, kg) =>
    set((state) => {
      const entries = state.entries.map((entry) => (entry.dateISO === dateISO ? { ...entry, kg } : entry));
      save("weight:entries", entries);
      return { entries };
    }),

  removeEntry: (dateISO) =>
    set((state) => {
      const entries = state.entries.filter((entry) => entry.dateISO !== dateISO);
      save("weight:entries", entries);
      return { entries };
    }),
}));