import { create } from "zustand";
import { load, save, uid } from "@/lib/persist";
import type { TrainingTemplate, Split, Exercise, CardioKind, TrainingLog, EquipmentType, CardioPlacement, CardioBlock } from "./training.schema";
import {
  trainingCatalogSeed,
  cardioCatalogSeed,
  trainingTemplateSeed,
  buildWeekLog,
  isCurrentWeekLog,
} from "./training.seed";
import { getActiveSplits, splitOrder } from "./training.service";
import { inferMuscleGroup, repairImportedExercise } from "./training.import";
import { isoDate } from "@/lib/date";
import type { SharedTrainingPlan } from "./training.share";
import { normalizeMediaUrls } from "./training.media";

export type ExerciseCatalogItem = {
  id: string;
  name: string;
  muscle: string;
  gifUrl?: string;
  mediaUrls?: string[];
  muscles?: string[];
  secondaryMuscles?: string[];
  substitutions?: string[];
  defaultSets?: number;
  defaultReps?: string;
};
export type CardioCatalogItem = { id: string; kind: CardioKind };

export type TrainingPreferences = {
  displayFormat: "inline" | "stacked";
  mergeParts: boolean;
  seriesRestSound: boolean;
  exerciseRestSound: boolean;
  activeSplit: Split;
  splitLabels: Record<Split, string>;
  trainingDays: number;
};

export const defaultSplitLabels: Record<Split, string> = {
  A: "Peitoral",
  B: "Dorsal",
  C: "Pernas",
  D: "Ombros",
  E: "Bíceps & Tríceps",
  F: "",
  G: "",
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
    mediaUrls?: string[];
    muscles?: string[];
    secondaryMuscles?: string[];
    substitutions?: string[];
    defaultSets?: number;
    defaultReps?: string;
  }) => void;
  updateCatalogExercise: (id: string, patch: Partial<ExerciseCatalogItem>) => void;
  removeCatalogExercise: (id: string) => void;
  addCardioKind: (kind: CardioKind) => void;
  addAmBlock: (
    split: Split,
    kind: CardioKind,
    minutes: number,
    placement?: CardioPlacement,
    afterExerciseId?: string,
  ) => void;
  addPmExercise: (split: Split, exId: string, sets: number, reps: string, restSec?: number) => void;
  updateAmBlock: (split: Split, id: string, patch: Partial<Omit<CardioBlock, "id">>) => void;
  updatePmExercise: (split: Split, id: string, patch: Partial<Exercise>) => void;
  removePmExercise: (split: Split, id: string) => void;
  removeAmBlock: (split: Split, id: string) => void;
  movePmExercise: (split: Split, id: string, direction: "up" | "down") => void;
  moveExerciseToSplit: (from: Split, to: Split, id: string) => void;
  toggleCardioBlock: (split: Split, id: string) => void;
  toggleSessionPart: (split: Split, part: "am" | "pm") => void;
  toggleExerciseDone: (split: Split, id: string) => void;
  setExerciseSetProgress: (split: Split, id: string, setsCompleted: number) => void;
  substituteExerciseForWorkout: (split: Split, id: string, catalogId: string | null) => void;
  recordExerciseLoad: (
    split: Split,
    id: string,
    loadKg: number,
    completedSets?: number,
    equipment?: EquipmentType,
  ) => void;
  reorderTrainingSplit: (from: Split, to: Split) => void;
  setPreferences: (patch: Partial<TrainingPreferences>) => void;
  ensureCurrentWeek: () => void;
  resetWeek: () => void;
  importSharedPlan: (plan: SharedTrainingPlan) => void;
};

const useSeedData = import.meta.env.DEV;

const emptyTemplate: TrainingTemplate = {
  A: { split: "A", am: [], pm: [] },
  B: { split: "B", am: [], pm: [] },
  C: { split: "C", am: [], pm: [] },
  D: { split: "D", am: [], pm: [] },
  E: { split: "E", am: [], pm: [] },
  F: { split: "F", am: [], pm: [] },
  G: { split: "G", am: [], pm: [] },
};

const defaultPreferences: TrainingPreferences = {
  displayFormat: "inline",
  mergeParts: true,
  seriesRestSound: false,
  exerciseRestSound: false,
  activeSplit: "A",
  splitLabels: defaultSplitLabels,
  trainingDays: 5,
};

const catalogFallback = () => {
  const loaded = load<ExerciseCatalogItem[]>("tr:catalog", useSeedData ? trainingCatalogSeed : []);
  let changed = false;
  const catalog = loaded.map((item) => {
    const repaired = repairImportedExercise(item.name, item.defaultReps);
    const mediaUrls = normalizeMediaUrls(item.mediaUrls, item.gifUrl);
    const mediaChanged =
      mediaUrls.length !== (item.mediaUrls?.length ?? 0) ||
      mediaUrls.some((url, index) => url !== item.mediaUrls?.[index]);
    if (
      repaired.name === item.name &&
      repaired.reps === item.defaultReps &&
      !mediaChanged
    ) return item;
    changed = true;
    const muscle = item.muscle === "Não informado" ? inferMuscleGroup(repaired.name) : item.muscle;
    return {
      ...item,
      name: repaired.name,
      muscle,
      muscles:
        !item.muscles || item.muscles.includes("Não informado")
          ? [muscle, ...(item.secondaryMuscles ?? [])]
          : item.muscles,
      defaultReps: repaired.reps,
      mediaUrls,
    };
  });
  if (changed) save("tr:catalog", catalog);
  return catalog;
};
const cardioFallback = () => load("tr:cardioCat", useSeedData ? cardioCatalogSeed : []);
const templateFallback = () => {
  const fallback = useSeedData ? trainingTemplateSeed : emptyTemplate;
  const loaded = load<Partial<TrainingTemplate>>("tr:template", fallback);
  let changed = false;
  const template = Object.fromEntries(
    splitOrder.map((split) => [
      split,
      loaded[split] ?? { split, am: [], pm: [] },
    ]),
  ) as TrainingTemplate;
  splitOrder.forEach((split) => {
    template[split].pm = template[split].pm.map((exercise) => {
      const repaired = repairImportedExercise(exercise.name, exercise.reps);
      const mediaUrls = normalizeMediaUrls(exercise.mediaUrls, exercise.gifUrl);
      const mediaChanged =
        mediaUrls.length !== (exercise.mediaUrls?.length ?? 0) ||
        mediaUrls.some((url, index) => url !== exercise.mediaUrls?.[index]);
      if (
        repaired.name === exercise.name &&
        repaired.reps === exercise.reps &&
        !mediaChanged
      ) return exercise;
      changed = true;
      const inferredMuscle = inferMuscleGroup(repaired.name);
      return {
        ...exercise,
        name: repaired.name,
        reps: repaired.reps ?? exercise.reps,
        mediaUrls,
        muscles:
          !exercise.muscles || exercise.muscles.includes("Não informado")
            ? [inferredMuscle]
            : exercise.muscles,
      };
    });
  });
  if (changed) save("tr:template", template);
  return template;
};
const weekFallback = () => {
  const fallback = buildWeekLog();
  const saved = load<TrainingLog[]>("tr:week", fallback);
  const loaded = isCurrentWeekLog(saved) ? saved : fallback;
  if (loaded === fallback && saved !== fallback) {
    save("tr:week", fallback);
  }
  return splitOrder.map((split) => {
    const entry = loaded.find((item) => item.split === split) ?? fallback.find((item) => item.split === split)!;
    return {
      ...entry,
      completedCardio: entry.completedCardio ?? [],
      setProgress: entry.setProgress ?? {},
      exerciseSubstitutions: entry.exerciseSubstitutions ?? {},
    };
  });
};
const preferencesFallback = () => {
  const fallback: TrainingPreferences = {
    ...defaultPreferences,
    splitLabels: { ...defaultPreferences.splitLabels },
  };

  const loaded = load<TrainingPreferences>("tr:prefs", fallback);
  loaded.trainingDays = Math.min(7, Math.max(2, Math.round(loaded.trainingDays ?? fallback.trainingDays)));
  loaded.seriesRestSound = loaded.seriesRestSound ?? fallback.seriesRestSound;
  loaded.exerciseRestSound = loaded.exerciseRestSound ?? fallback.exerciseRestSound;
  const activeSplits = getActiveSplits(loaded.trainingDays);
  if (!activeSplits.includes(loaded.activeSplit)) {
    loaded.activeSplit = fallback.activeSplit;
  }
  loaded.splitLabels = {
    ...fallback.splitLabels,
    ...(loaded.splitLabels ?? {}),
  };
  return loaded;
};

export const useTraining = create<TrainingState>((set) => ({
  catalog: catalogFallback(),
  cardioCatalog: cardioFallback(),
  template: templateFallback(),
  weekLog: weekFallback(),
  preferences: preferencesFallback(),

  addCatalogExercise: ({
    name,
    muscle,
    gifUrl,
    mediaUrls,
    muscles,
    secondaryMuscles,
    substitutions,
    defaultSets,
    defaultReps,
  }) =>
    set((state) => {
      const entry: ExerciseCatalogItem = {
        id: uid(),
        name,
        muscle,
        gifUrl: mediaUrls?.[0] ?? gifUrl,
        mediaUrls: normalizeMediaUrls(mediaUrls, gifUrl),
        muscles: (muscles && muscles.length > 0 ? muscles : [muscle]).filter(Boolean),
        secondaryMuscles: secondaryMuscles?.filter(Boolean),
        substitutions: substitutions?.filter(Boolean),
        defaultSets,
        defaultReps,
      };
      const catalog = [...state.catalog, entry];
      save("tr:catalog", catalog);
      return { catalog };
    }),

  updateCatalogExercise: (id, patch) =>
    set((state) => {
      let updatedCatalogItem: ExerciseCatalogItem | undefined;
      const catalog = state.catalog.map((item: ExerciseCatalogItem) => {
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
          gifUrl:
            patch.mediaUrls != null
              ? patch.mediaUrls[0]
              : patch.gifUrl ?? item.gifUrl,
          mediaUrls:
            patch.mediaUrls != null || patch.gifUrl != null
              ? normalizeMediaUrls(patch.mediaUrls, patch.gifUrl)
              : item.mediaUrls,
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
              gifUrl:
                patch.mediaUrls != null
                  ? patch.mediaUrls[0]
                  : patch.gifUrl ?? exercise.gifUrl,
              mediaUrls:
                patch.mediaUrls != null || patch.gifUrl != null
                  ? normalizeMediaUrls(patch.mediaUrls, patch.gifUrl)
                  : exercise.mediaUrls,
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

  addAmBlock: (split, kind, minutes, placement = "before", afterExerciseId) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].am.push({
        id: uid(),
        kind,
        minutes,
        placement,
        afterExerciseId: placement === "between" ? afterExerciseId : undefined,
      });
      save("tr:template", template);
      return { template };
    }),

      updateAmBlock: (split, id, patch) =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].am = template[split].am.map((block) =>
        block.id === id
          ? {
              ...block,
              ...patch,
              afterExerciseId:
                patch.placement === "between" || (patch.placement == null && block.placement === "between")
                  ? patch.afterExerciseId ?? block.afterExerciseId
                  : undefined,
              minutes:
                patch.minutes != null && !Number.isNaN(patch.minutes) && patch.minutes > 0
                  ? patch.minutes
                  : block.minutes,
            }
          : block,
      );
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
        exerciseRestSec: 90,
        catalogId: catalogItem?.id,
        muscles: catalogItem?.muscles ?? [catalogItem?.muscle ?? ""].filter(Boolean),
        gifUrl: catalogItem?.gifUrl,
        mediaUrls: normalizeMediaUrls(catalogItem?.mediaUrls, catalogItem?.gifUrl),
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
      const exerciseIndex = template[split].pm.findIndex((exercise) => exercise.id === id);
      const previousExerciseId = exerciseIndex > 0 ? template[split].pm[exerciseIndex - 1]?.id : undefined;
      template[split].pm = template[split].pm.filter((exercise) => exercise.id !== id);
      template[split].am = reanchorCardioBlocks(template[split].am, id, previousExerciseId);
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

  moveExerciseToSplit: (from, to, id) =>
    set((state) => {
      if (from === to) return {};
      const template = structuredClone(state.template);
      const exerciseIndex = template[from].pm.findIndex((exercise) => exercise.id === id);
      if (exerciseIndex === -1) return {};

      const previousExerciseId = exerciseIndex > 0 ? template[from].pm[exerciseIndex - 1]?.id : undefined;
      const [exercise] = template[from].pm.splice(exerciseIndex, 1);
      template[from].am = reanchorCardioBlocks(template[from].am, id, previousExerciseId);
      template[to].pm.push(exercise);

      const sourceLog = state.weekLog.find((log) => log.split === from);
      const wasDone = sourceLog?.doneExercises.includes(id) ?? false;
      const completedSets = sourceLog?.setProgress[id];
      const weekLog = state.weekLog.map((log) => {
        if (log.split === from) {
          const doneExercises = log.doneExercises.filter((exerciseId) => exerciseId !== id);
          const setProgress = { ...log.setProgress };
          delete setProgress[id];
          const pmDone =
            template[from].pm.length > 0 &&
            template[from].pm.every((item) => doneExercises.includes(item.id));
          return { ...log, doneExercises, setProgress, pmDone };
        }
        if (log.split === to) {
          const doneExercises =
            wasDone && !log.doneExercises.includes(id)
              ? [...log.doneExercises, id]
              : log.doneExercises;
          const setProgress = { ...log.setProgress };
          if (completedSets != null) setProgress[id] = completedSets;
          const pmDone =
            template[to].pm.length > 0 &&
            template[to].pm.every((item) => doneExercises.includes(item.id));
          return { ...log, doneExercises, setProgress, pmDone };
        }
        return log;
      });

      save("tr:template", template);
      save("tr:week", weekLog);
      return { template, weekLog };
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

  recordExerciseLoad: (split, id, loadKg, completedSets, equipment = "other") =>
    set((state) => {
      const template = structuredClone(state.template);
      template[split].pm = template[split].pm.map((exercise) =>
        exercise.id === id
          ? {
              ...exercise,
              loadKg,
              loadsByEquipment: {
                ...(exercise.loadsByEquipment ?? {}),
                [equipment]: loadKg,
              },
              loadHistory: [
                ...(exercise.loadHistory ?? []),
                {
                  dateISO: isoDate(),
                  loadKg,
                  equipment,
                  completedSets,
                  targetSets: exercise.sets,
                },
              ],
            }
          : exercise,
      );
      save("tr:template", template);
      return { template };
    }),

  reorderTrainingSplit: (from, to) =>
    set((state) => {
      const fromIndex = splitOrder.indexOf(from);
      const toIndex = splitOrder.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return {};

      const sourceOrder = [...splitOrder];
      const [movedSource] = sourceOrder.splice(fromIndex, 1);
      sourceOrder.splice(toIndex, 0, movedSource);

      const destinationDates = Object.fromEntries(
        state.weekLog.map((log) => [log.split, log.dateISO]),
      ) as Partial<Record<Split, string>>;
      const template = {} as TrainingTemplate;
      const splitLabels = {} as Record<Split, string>;
      const weekLog = splitOrder.map((destination, index) => {
        const source = sourceOrder[index];
        const sourcePlan = state.template[source];
        const sourceLog = state.weekLog.find((log) => log.split === source);
        template[destination] = {
          ...structuredClone(sourcePlan),
          split: destination,
        };
        splitLabels[destination] = state.preferences.splitLabels[source] ?? "";
        return {
          ...(sourceLog ?? {
            dateISO: destinationDates[destination] ?? isoDate(),
            amDone: false,
            pmDone: false,
            doneExercises: [],
            completedCardio: [],
            setProgress: {},
            exerciseSubstitutions: {},
          }),
          dateISO: destinationDates[destination] ?? sourceLog?.dateISO ?? isoDate(),
          split: destination,
        };
      });

      const movedActiveIndex = sourceOrder.indexOf(state.preferences.activeSplit);
      const nextActiveSplit = splitOrder[movedActiveIndex];
      const activeSplits = getActiveSplits(state.preferences.trainingDays);
      const preferences: TrainingPreferences = {
        ...state.preferences,
        activeSplit: activeSplits.includes(nextActiveSplit)
          ? nextActiveSplit
          : activeSplits[0],
        splitLabels,
      };

      save("tr:template", template);
      save("tr:week", weekLog);
      save("tr:prefs", preferences);
      return { template, weekLog, preferences };
    }),

  setPreferences: (patch) =>
    set((state) => {
      const trainingDays = Math.min(
        7,
        Math.max(2, Math.round(patch.trainingDays ?? state.preferences.trainingDays)),
      );
      const activeSplits = getActiveSplits(trainingDays);
      const requestedActiveSplit = patch.activeSplit ?? state.preferences.activeSplit;
      const preferences: TrainingPreferences = {
        ...state.preferences,
        ...patch,
        trainingDays,
        activeSplit: activeSplits.includes(requestedActiveSplit)
          ? requestedActiveSplit
          : activeSplits[0],
        splitLabels: {
          ...state.preferences.splitLabels,
          ...(patch.splitLabels ?? {}),
        },
      };      save("tr:prefs", preferences);
      return { preferences };
    }),

  ensureCurrentWeek: () =>
    set((state) => {
      if (isCurrentWeekLog(state.weekLog)) return {};
      const weekLog = buildWeekLog();
      save("tr:week", weekLog);
      return { weekLog };
    }),

  substituteExerciseForWorkout: (split, id, catalogId) =>
    set((state) => {
      const weekLog = state.weekLog.map((entry) => {
        if (entry.split !== split) return entry;
        const exerciseSubstitutions = { ...(entry.exerciseSubstitutions ?? {}) };
        if (catalogId) exerciseSubstitutions[id] = catalogId;
        else delete exerciseSubstitutions[id];
        return { ...entry, exerciseSubstitutions };
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

  importSharedPlan: (plan) =>
    set((state) => {
      const catalog = structuredClone(state.catalog);
      const catalogByName = new Map(
        catalog.map((item) => [normalizeCatalogName(item.name), item]),
      );

      for (const workout of plan.workouts) {
        for (const exercise of workout.exercises) {
          const key = normalizeCatalogName(exercise.name);
          if (catalogByName.has(key)) continue;
          const muscle = exercise.muscles?.[0] ?? inferMuscleGroup(exercise.name);
          const item: ExerciseCatalogItem = {
            id: uid(),
            name: exercise.name,
            muscle,
            muscles: exercise.muscles?.length ? exercise.muscles : [muscle],
            secondaryMuscles: exercise.secondaryMuscles,
            gifUrl: exercise.gifUrl,
            mediaUrls: normalizeMediaUrls(exercise.mediaUrls, exercise.gifUrl),
            defaultSets: exercise.sets,
            defaultReps: exercise.reps,
          };
          catalog.push(item);
          catalogByName.set(key, item);
        }
      }

      for (const workout of plan.workouts) {
        for (const exercise of workout.exercises) {
          const item = catalogByName.get(normalizeCatalogName(exercise.name));
          if (!item) continue;
          const receivedMedia = normalizeMediaUrls(exercise.mediaUrls, exercise.gifUrl);
          item.mediaUrls = normalizeMediaUrls(item.mediaUrls, item.gifUrl, receivedMedia);
          if (!item.gifUrl && receivedMedia[0]) item.gifUrl = receivedMedia[0];
          if (!exercise.substitutions?.length) continue;
          const substitutionIds = exercise.substitutions
            .map((name) => catalogByName.get(normalizeCatalogName(name))?.id)
            .filter((id): id is string => Boolean(id));
          if (substitutionIds.length) item.substitutions = substitutionIds;
        }
      }

      const template = structuredClone(emptyTemplate);
      const splitLabels = { ...state.preferences.splitLabels };
      plan.workouts.forEach((workout, index) => {
        const split = splitOrder[index];
        splitLabels[split] = workout.label;
        const exercises = workout.exercises.map((exercise) => {
          const catalogItem = catalogByName.get(normalizeCatalogName(exercise.name));
          return {
            id: uid(),
            catalogId: catalogItem?.id,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restSec: exercise.restSec,
            exerciseRestSec: exercise.exerciseRestSec ?? 90,
            notes: exercise.notes,
            gifUrl: catalogItem?.gifUrl ?? exercise.gifUrl,
            mediaUrls: normalizeMediaUrls(
              catalogItem?.mediaUrls,
              catalogItem?.gifUrl,
              exercise.mediaUrls,
              exercise.gifUrl,
            ),
            muscles: exercise.muscles,
            secondaryMuscles: exercise.secondaryMuscles,
            substitutions: exercise.substitutions
              ?.map((name) => catalogByName.get(normalizeCatalogName(name))?.id)
              .filter((id): id is string => Boolean(id)),
          };
        });
        template[split] = {
          split,
          am: workout.cardio.map((block) => ({
            id: uid(),
            kind: block.kind,
            minutes: block.minutes,
            placement: block.placement ?? "before",
            afterExerciseId:
              block.placement === "between" && block.afterExerciseIndex != null
                ? exercises[block.afterExerciseIndex]?.id
                : undefined,
          })),
          pm: exercises,
        };
      });

      const trainingDays = plan.workouts.length;
      const preferences: TrainingPreferences = {
        ...state.preferences,
        trainingDays,
        activeSplit: "A",
        splitLabels,
      };
      const cardioKinds = new Set(state.cardioCatalog.map((item) => item.kind.toLocaleLowerCase()));
      const cardioCatalog = [...state.cardioCatalog];
      plan.workouts.forEach((workout) => {
        workout.cardio.forEach(({ kind }) => {
          if (cardioKinds.has(kind.toLocaleLowerCase())) return;
          cardioKinds.add(kind.toLocaleLowerCase());
          cardioCatalog.push({ id: uid(), kind });
        });
      });
      const weekLog = buildWeekLog();

      save("tr:catalog", catalog);
      save("tr:cardioCat", cardioCatalog);
      save("tr:template", template);
      save("tr:prefs", preferences);
      save("tr:week", weekLog);
      return { catalog, cardioCatalog, template, preferences, weekLog };
    }),
}));

function buildSetsMap(exercises: Exercise[]) {
  return exercises.reduce<Record<string, number>>((acc, exercise) => {
    acc[exercise.id] = exercise.sets;
    return acc;
  }, {});
}

function reanchorCardioBlocks(
  blocks: CardioBlock[],
  removedExerciseId: string,
  previousExerciseId?: string,
) {
  return blocks.map((block) => {
    if (block.placement !== "between" || block.afterExerciseId !== removedExerciseId) return block;
    return previousExerciseId
      ? { ...block, afterExerciseId: previousExerciseId }
      : { ...block, placement: "before" as const, afterExerciseId: undefined };
  });
}

function normalizeCatalogName(name: string) {
  return name.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
