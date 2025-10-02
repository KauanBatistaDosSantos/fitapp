// features/water/water.store.ts
import { create } from "zustand";
import { load, save } from "@/lib/persist";
import { WaterLog } from "./water.schema";

type WaterState = {
  today: WaterLog;
  setTarget: (ml: number) => void;
  addEntry: (ml: number) => void;
  resetToday: () => void;
  monthHistory: WaterLog[]; // lista de logs do mês
  commitToday: () => void;  // salva hoje no histórico
};

const defaultToday: WaterLog = {
  dateISO: new Date().toISOString().slice(0,10),
  targetML: 2000,
  entries: []
};

export const useWater = create<WaterState>((set, get) => ({
  today: load<WaterLog>("water:today", defaultToday),
  monthHistory: load<WaterLog[]>("water:hist", []),

  setTarget: (ml) => set(s => {
    const today = { ...s.today, targetML: ml };
    save("water:today", today); return { today };
  }),

  addEntry: (ml) => set(s => {
    const today = { ...s.today, entries: [...s.today.entries, ml] };
    save("water:today", today); return { today };
  }),

  resetToday: () => set(() => { save("water:today", defaultToday); return { today: defaultToday }; }),

  commitToday: () => set(s => {
    const hist = [...s.monthHistory.filter(h => h.dateISO !== s.today.dateISO), s.today];
    save("water:hist", hist);
    return { monthHistory: hist };
  })
}));
