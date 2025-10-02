// features/training/training.store.ts
import { create } from "zustand";
import { load, save, uid } from "@/lib/persist";
import { TrainingTemplate, Split, Exercise, CardioBlock, CardioKind } from "./training.schema";

type ExerciseCatalogItem = { id: string; name: string; muscle: string };
type CardioCatalogItem = { id: string; kind: CardioKind };

type TrainingState = {
  catalog: ExerciseCatalogItem[];
  cardioCatalog: CardioCatalogItem[];
  template: TrainingTemplate;
  addCatalogExercise: (name: string, muscle: string) => void;
  addCardioKind: (kind: CardioKind) => void;
  addAmBlock: (split: Split, kind: CardioKind, minutes: number) => void;
  addPmExercise: (split: Split, exId: string, sets: number, reps: string, restSec?: number) => void;
  updatePmExercise: (split: Split, id: string, patch: Partial<Exercise>) => void;
  removePmExercise: (split: Split, id: string) => void;
  saveTemplate: () => void;
};

export const useTraining = create<TrainingState>((set, get) => ({
  catalog: load("tr:catalog", []),
  cardioCatalog: load("tr:cardioCat", [{ id: uid(), kind: "Zumba" }]),
  template: load("tr:template", {
    A:{split:"A",am:[],pm:[]},B:{split:"B",am:[],pm:[]},
    C:{split:"C",am:[],pm:[]},D:{split:"D",am:[],pm:[]},E:{split:"E",am:[],pm:[]}
  }),

  addCatalogExercise: (name, muscle) => set(s => {
    const catalog = [...s.catalog, { id: uid(), name, muscle }];
    save("tr:catalog", catalog); return { catalog };
  }),
  addCardioKind: (kind) => set(s => {
    const cardioCatalog = [...s.cardioCatalog, { id: uid(), kind }];
    save("tr:cardioCat", cardioCatalog); return { cardioCatalog };
  }),

  addAmBlock: (split, kind, minutes) => set(s => {
    const t = structuredClone(s.template); t[split].am.push({ id: uid(), kind, minutes });
    save("tr:template", t); return { template: t };
  }),
  addPmExercise: (split, exId, sets, reps, restSec=60) => set(s => {
    const exName = s.catalog.find(c => c.id===exId)?.name ?? "Exercício";
    const t = structuredClone(s.template);
    t[split].pm.push({ id: uid(), name: exName, sets, reps, restSec });
    save("tr:template", t); return { template: t };
  }),
  updatePmExercise: (split, id, patch) => set(s => {
    const t = structuredClone(s.template);
    t[split].pm = t[split].pm.map(e => e.id===id ? {...e, ...patch}: e);
    save("tr:template", t); return { template: t };
  }),
  removePmExercise: (split, id) => set(s => {
    const t = structuredClone(s.template);
    t[split].pm = t[split].pm.filter(e => e.id!==id);
    save("tr:template", t); return { template: t };
  }),
  saveTemplate: () => save("tr:template", get().template)
}));
