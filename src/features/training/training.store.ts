import { create } from "zustand";
import { load, save, uid } from "@/lib/persist";
import type { TrainingTemplate, Split, Exercise, CardioKind, TrainingLog } from "./training.schema";
import { trainingCatalogSeed, cardioCatalogSeed, trainingTemplateSeed, buildWeekLog } from "./training.seed";

export type ExerciseCatalogItem = { id: string; name: string; muscle: string };
export type CardioCatalogItem = { id: string; kind: CardioKind };

type TrainingState = {
  catalog: ExerciseCatalogItem[];
  cardioCatalog: CardioCatalogItem[];
  template: TrainingTemplate;
  weekLog: TrainingLog[];
  addCatalogExercise: (name: string, muscle: string) => void;
  addCardioKind: (kind: CardioKind) => void;
  addAmBlock: (split: Split, kind: CardioKind, minutes: number) => void;
  addPmExercise: (split: Split, exId: string, sets: number, reps: string, restSec?: number) => void;
  updatePmExercise: (split: Split, id: string, patch: Partial<Exercise>) => void;
  removePmExercise: (split: Split, id: string) => void;
  removeAmBlock: (split: Split, id: string) => void;
  toggleSessionPart: (split: Split, part: "am" | "pm") => void;
  toggleExerciseDone: (split: Split, id: string) => void;
  resetWeek: () => void;
};

const catalogFallback = () => load("tr:catalog", trainingCatalogSeed);
const cardioFallback = () => load("tr:cardioCat", cardioCatalogSeed);
const templateFallback = () => load("tr:template", trainingTemplateSeed);
const weekFallback = () => load("tr:week", buildWeekLog());

export const useTraining = create<TrainingState>((set) => ({
  catalog: catalogFallback(),
  cardioCatalog: cardioFallback(),
  template: templateFallback(),
  weekLog: weekFallback(),

  addCatalogExercise: (name, muscle) =>
    set((state) => {
      const catalog = [...state.catalog, { id: uid(), name, muscle }];
      save("tr:catalog", catalog);
      return { catalog };
    }),

  addCardioKind: (kind) =>
    set((state) => {
      const cardioCatalog = [...state.cardioCatalog, { id: uid(), kind }];
      save("tr:cardioCat", cardioCatalog);
      return { cardioCatalog };
    }),

  addAmBlock: (split, kind, minutes) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].am.push({ id: uid(), kind, minutes });
      save("tr:template", template);
      return { template };
    }),

  addPmExercise: (split, exId, sets, reps, restSec = 60) =>
    set((state) => {
      const exName = state.catalog.find((c) => c.id === exId)?.name ?? "Exercício";
      const template = structuredClone(state.template);
      template[split].pm.push({ id: uid(), name: exName, sets, reps, restSec });
      save("tr:template", template);
      return { template };
    }),

  removeAmBlock: (split, id) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].am = template[split].am.filter((block) => block.id !== id);
      save("tr:template", template);
      return { template };
    }),

  updatePmExercise: (split, id, patch) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].pm = template[split].pm.map((exercise) =>
        exercise.id === id ? { ...exercise, ...patch } : exercise,
      );
      save("tr:template", template);
      return { template };
    }),

  removePmExercise: (split, id) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].pm = template[split].pm.filter((exercise) => exercise.id !== id);
      save("tr:template", template);
      return { template };
    }),

  toggleSessionPart: (split, part) =>
    set((state) => {
      const weekLog = state.weekLog.map((log) =>
        log.split === split ? { ...log, [part === "am" ? "amDone" : "pmDone"]: !log[part === "am" ? "amDone" : "pmDone"] } : log,
      );
      save("tr:week", weekLog);
      return { weekLog };
    }),

  toggleExerciseDone: (split, id) =>
    set((state) => {
      const weekLog = state.weekLog.map((log) => {
        if (log.split !== split) return log;
        const doneExercises = log.doneExercises.includes(id)
          ? log.doneExercises.filter((item) => item !== id)
          : [...log.doneExercises, id];
        return { ...log, doneExercises };
      });
      save("tr:week", weekLog);
      return { weekLog };
    }),

  resetWeek: () =>
    set(() => {
      const weekLog = buildWeekLog();
      save("tr:week", weekLog);
      return { weekLog };
    }),
}));