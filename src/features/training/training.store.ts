import { create } from "zustand";
import { load, save, uid } from "@/lib/persist";
import type { TrainingTemplate, Split, Exercise, CardioKind, TrainingLog } from "./training.schema";
import { trainingCatalogSeed, cardioCatalogSeed, trainingTemplateSeed, buildWeekLog } from "./training.seed";
import { isoDate } from "@/lib/date";

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  muscles?: string[];
  secondaryMuscles?: string[];
  substitutions?: string[];
};
export type CardioCatalogItem = { id: string; kind: CardioKind };

export type TrainingPreferences = {
  displayFormat: "inline" | "stacked";
  mergeParts: boolean;
  activeSplit: Split;
};

type TrainingState = {
  catalog: ExerciseCatalogItem[];
  cardioCatalog: CardioCatalogItem[];
  template: TrainingTemplate;
  weekLog: TrainingLog[];
  preferences: TrainingPreferences;
  addCatalogExercise: (input: {
    name: string;
    muscle: string;
    gifUrl?: string;
    muscles?: string[];
    secondaryMuscles?: string[];
    substitutions?: string[];
  }) => void;
  updateCatalogExercise: (id: string, patch: Partial<ExerciseCatalogItem>) => void;
  removeCatalogExercise: (id: string) => void;
  addCardioKind: (kind: CardioKind) => void;
  addAmBlock: (split: Split, kind: CardioKind, minutes: number) => void;
  addPmExercise: (split: Split, exId: string, sets: number, reps: string, restSec?: number) => void;
  updatePmExercise: (split: Split, id: string, patch: Partial<Exercise>) => void;
  removePmExercise: (split: Split, id: string) => void;
  removeAmBlock: (split: Split, id: string) => void;
  movePmExercise: (split: Split, id: string, direction: "up" | "down") => void;
  toggleCardioBlock: (split: Split, id: string) => void;
  toggleSessionPart: (split: Split, part: "am" | "pm") => void;
  toggleExerciseDone: (split: Split, id: string) => void;
  setExerciseSetProgress: (split: Split, id: string, setsCompleted: number) => void;
  recordExerciseLoad: (split: Split, id: string, loadKg: number) => void;
  setPreferences: (patch: Partial<TrainingPreferences>) => void;
  resetWeek: () => void;
};

const catalogFallback = () => load("tr:catalog", trainingCatalogSeed);
const cardioFallback = () => load("tr:cardioCat", cardioCatalogSeed);
const templateFallback = () => load("tr:template", trainingTemplateSeed);
const weekFallback = () =>
  load("tr:week", buildWeekLog()).map((entry) => ({
    ...entry,
    completedCardio: entry.completedCardio ?? [],
    setProgress: entry.setProgress ?? {},
  }));
const preferencesFallback = () => {
  const fallback: TrainingPreferences = {
    displayFormat: "inline",
    mergeParts: true,
    activeSplit: "A",
  };
  const loaded = load<TrainingPreferences>("tr:prefs", fallback);
  const validSplits: Split[] = ["A", "B", "C", "D", "E"];
  if (!validSplits.includes(loaded.activeSplit)) {
    loaded.activeSplit = fallback.activeSplit;
  }
  return loaded;
};

export const useTraining = create<TrainingState>((set) => ({
  catalog: catalogFallback(),
  cardioCatalog: cardioFallback(),
  template: templateFallback(),
  weekLog: weekFallback(),
  preferences: preferencesFallback(),

  addCatalogExercise: ({ name, muscle, gifUrl, muscles, secondaryMuscles, substitutions }) =>
    set((state) => {
      const entry: ExerciseCatalogItem = {
        id: uid(),
        name,
        muscle,
        gifUrl,
        muscles: (muscles && muscles.length > 0 ? muscles : [muscle]).filter(Boolean),
        secondaryMuscles: secondaryMuscles?.filter(Boolean),
        substitutions: substitutions?.filter(Boolean),
      };
      const catalog = [...state.catalog, entry];
      save("tr:catalog", catalog);
      return { catalog };
    }),

  updateCatalogExercise: (id, patch) =>
    set((state) => {
      let updatedCatalogItem: ExerciseCatalogItem | undefined;
      const catalog = state.catalog.map((item) => {
        if (item.id !== id) return item;
        const musclesInput = (
          patch.muscles ?? (patch.muscle ? [patch.muscle] : item.muscles) ?? []
        ).filter((muscle): muscle is string => typeof muscle === "string" && muscle.trim().length > 0);
        const muscle = patch.muscle ?? musclesInput[0] ?? item.muscle;
        const secondaryMuscles = patch.secondaryMuscles
          ? patch.secondaryMuscles.filter((muscle): muscle is string => typeof muscle === "string" && muscle.trim().length > 0)
          : item.secondaryMuscles;
        const substitutions = patch.substitutions
          ? patch.substitutions.filter((sub): sub is string => typeof sub === "string" && sub.trim().length > 0)
          : item.substitutions;
        const updatedItem: ExerciseCatalogItem = {
          ...item,
          ...patch,
          muscle,
          muscles: musclesInput.length > 0 ? musclesInput : undefined,
          secondaryMuscles,
          substitutions,
        };
        updatedCatalogItem = updatedItem;
        return updatedItem;
      });
      const template = structuredClone(state.template);
      if (updatedCatalogItem) {
        for (const split of Object.keys(template) as Split[]) {
          template[split].pm = template[split].pm.map((exercise) => {
            if (exercise.catalogId !== id) return exercise;
            const catalogMuscles = updatedCatalogItem?.muscles;
            const resolvedMuscles =
              catalogMuscles && catalogMuscles.length > 0
                ? catalogMuscles
                : updatedCatalogItem?.muscle
                ? [updatedCatalogItem.muscle]
                : exercise.muscles;
            return {
              ...exercise,
              name: patch.name ?? exercise.name,
              muscles: resolvedMuscles,
              secondaryMuscles: updatedCatalogItem?.secondaryMuscles ?? exercise.secondaryMuscles,
              gifUrl: patch.gifUrl ?? exercise.gifUrl,
              substitutions: updatedCatalogItem?.substitutions ?? exercise.substitutions,
            };
          });
        }
      }
      save("tr:catalog", catalog);
      save("tr:template", template);
      return { catalog, template };
    }),

  removeCatalogExercise: (id) =>
    set((state) => {
      const catalog = state.catalog.filter((item) => item.id !== id);
      const template = structuredClone(state.template);
      for (const split of Object.keys(template) as Split[]) {
        template[split].pm = template[split].pm.filter((exercise) => exercise.catalogId !== id);
      }
      const validIds = new Set<string>();
      for (const split of Object.keys(template) as Split[]) {
        template[split].pm.forEach((exercise) => validIds.add(exercise.id));
      }
      const weekLog = state.weekLog.map((log) => {
        const filteredDone = log.doneExercises.filter((exerciseId) => validIds.has(exerciseId));
        const filteredProgress = Object.fromEntries(
          Object.entries(log.setProgress).filter(([exerciseId]) => validIds.has(exerciseId)),
        );
        const pmDone = template[log.split].pm.length > 0 && filteredDone.length === template[log.split].pm.length;
        return { ...log, doneExercises: filteredDone, setProgress: filteredProgress, pmDone };
      });
      save("tr:catalog", catalog);
      save("tr:template", template);
      save("tr:week", weekLog);
      return { catalog, template, weekLog };
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
      const catalogItem = state.catalog.find((c) => c.id === exId);
      const exName = catalogItem?.name ?? "Exercício";
      const template = structuredClone(state.template);
      template[split].pm.push({
        id: uid(),
        name: exName,
        sets,
        reps,
        restSec,
        catalogId: catalogItem?.id,
        muscles: catalogItem?.muscles ?? [catalogItem?.muscle ?? ""].filter(Boolean),
        gifUrl: catalogItem?.gifUrl,
        substitutions: catalogItem?.substitutions,
      });
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

  movePmExercise: (split, id, direction) =>
    set((state) => {
      const template = structuredClone(state.template);
      const list = template[split].pm;
      const index = list.findIndex((item) => item.id === id);
      if (index === -1) return {};
      const nextIndex = direction === "up" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= list.length) return {};
      [list[index], list[nextIndex]] = [list[nextIndex], list[index]];
      save("tr:template", template);
      return { template };
    }),

  toggleCardioBlock: (split, id) =>
    set((state) => {
      const weekLog = state.weekLog.map((log) => {
        if (log.split !== split) return log;
        const completed = log.completedCardio.includes(id)
          ? log.completedCardio.filter((item) => item !== id)
          : [...log.completedCardio, id];
        const amDone = state.template[split].am.length > 0 && completed.length === state.template[split].am.length;
        return { ...log, completedCardio: completed, amDone };
      });
      save("tr:week", weekLog);
      return { weekLog };
    }),

  toggleSessionPart: (split, part) =>
    set((state) => {
      const weekLog = state.weekLog.map((log) =>
        log.split === split
          ? {
              ...log,
              [part === "am" ? "amDone" : "pmDone"]: !log[part === "am" ? "amDone" : "pmDone"],
              completedCardio:
                part === "am" && !log.amDone
                  ? state.template[split].am.map((block) => block.id)
                  : part === "am"
                  ? []
                  : log.completedCardio,
              doneExercises:
                part === "pm" && !log.pmDone
                  ? state.template[split].pm.map((exercise) => exercise.id)
                  : part === "pm"
                  ? []
                  : log.doneExercises,
              setProgress:
                part === "pm"
                  ? !log.pmDone
                    ? buildSetsMap(state.template[split].pm)
                    : {}
                  : log.setProgress,
            }
          : log,
      );
      save("tr:week", weekLog);
      return { weekLog };
    }),

  toggleExerciseDone: (split, id) =>
    set((state) => {
      const weekLog = state.weekLog.map((log) => {
        if (log.split !== split) return log;
        const isDone = log.doneExercises.includes(id);
        const doneExercises = isDone
          ? log.doneExercises.filter((item) => item !== id)
          : [...log.doneExercises, id];
        const setProgress = { ...log.setProgress };
        if (!isDone) {
          const exercise = state.template[split].pm.find((item) => item.id === id);
          if (exercise) {
            setProgress[id] = exercise.sets;
          }
        } else {
          delete setProgress[id];
        }
        const totalExercises = state.template[split].pm.length;
        const pmDone = totalExercises > 0 && doneExercises.length === totalExercises;
        return { ...log, doneExercises, setProgress, pmDone };
      });
      save("tr:week", weekLog);
      return { weekLog };
    }),

  setExerciseSetProgress: (split, id, setsCompleted) =>
    set((state) => {
      const weekLog = state.weekLog.map((log) => {
        if (log.split !== split) return log;
        const required = state.template[split].pm.find((ex) => ex.id === id)?.sets ?? Number.POSITIVE_INFINITY;
        const setProgress = { ...log.setProgress };
        if (setsCompleted <= 0) {
          delete setProgress[id];
        } else {
          setProgress[id] = setsCompleted;
        }
        const isDone = log.doneExercises.includes(id);
        const completed = setsCompleted >= required;
        const doneExercises = completed
          ? isDone
            ? log.doneExercises
            : [...log.doneExercises, id]
          : isDone
          ? log.doneExercises.filter((item) => item !== id)
          : log.doneExercises;
        const totalExercises = state.template[split].pm.length;
        const pmDone = totalExercises > 0 && doneExercises.length === totalExercises;
        return { ...log, setProgress, doneExercises, pmDone };
      });
      save("tr:week", weekLog);
      return { weekLog };
    }),

  recordExerciseLoad: (split, id, loadKg) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].pm = template[split].pm.map((exercise) =>
        exercise.id === id
          ? {
              ...exercise,
              loadKg,
              loadHistory: [...(exercise.loadHistory ?? []), { dateISO: isoDate(), loadKg }],
            }
          : exercise,
      );
      save("tr:template", template);
      return { template };
    }),

  setPreferences: (patch) =>
    set((state) => {
      const preferences = { ...state.preferences, ...patch };
      save("tr:prefs", preferences);
      return { preferences };
    }),

  resetWeek: () =>
    set(() => {
      const weekLog = buildWeekLog();
      save("tr:week", weekLog);
      return { weekLog };
    }),
}));

function buildSetsMap(exercises: Exercise[]) {
  return exercises.reduce<Record<string, number>>((acc, exercise) => {
    acc[exercise.id] = exercise.sets;
    return acc;
  }, {});
}