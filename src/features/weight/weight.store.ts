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

const configFallback = () => load("weight:config", weightConfigSeed);
const entriesFallback = () => load("weight:entries", weightEntriesSeed);

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