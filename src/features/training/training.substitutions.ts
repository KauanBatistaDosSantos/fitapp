import type { Exercise } from "./training.schema";
import type { ExerciseCatalogItem } from "./training.store";

export type ExerciseSubstitutionSuggestion = {
  exercise: ExerciseCatalogItem;
  matchedMuscles: string[];
  reason: string;
  score: number;
};

const muscleAliases: Record<string, string> = {
  peitoral: "peito",
  dorsal: "costas",
  ombro: "ombros",
  gluteo: "gluteos",
  quadriceps: "pernas",
  abdominal: "abdomen",
  panturrilhas: "panturrilha",
  adutor: "adutores",
};

export function suggestExerciseSubstitutions(
  exercise: Exercise,
  currentCatalog: ExerciseCatalogItem | undefined,
  catalog: ExerciseCatalogItem[],
  limit = 8,
): ExerciseSubstitutionSuggestion[] {
  const targetMuscles = collectMuscles(exercise, currentCatalog);
  const targetByKey = new Map(targetMuscles.map((muscle) => [normalizeMuscle(muscle), muscle]));
  const targetKeys = new Set(targetByKey.keys());
  const primaryTarget = normalizeMuscle(currentCatalog?.muscle ?? exercise.muscles?.[0] ?? "");
  const configuredIds = new Set([
    ...(exercise.substitutions ?? []),
    ...(currentCatalog?.substitutions ?? []),
  ]);
  const currentName = normalizeText(exercise.name);

  return catalog
    .filter((candidate) => candidate.id !== currentCatalog?.id && normalizeText(candidate.name) !== currentName)
    .map((candidate) => {
      const candidateMuscles = collectCatalogMuscles(candidate);
      const candidateKeys = new Set(candidateMuscles.map(normalizeMuscle));
      const matchedKeys = Array.from(targetKeys).filter((muscle) => candidateKeys.has(muscle));
      const isConfigured = configuredIds.has(candidate.id);
      const candidatePrimary = normalizeMuscle(candidate.muscle);
      let score = isConfigured ? 1000 : 0;
      score += matchedKeys.length * 30;
      if (primaryTarget && candidatePrimary === primaryTarget) score += 50;
      if (primaryTarget && candidateKeys.has(primaryTarget)) score += 20;

      const matchedMuscles = matchedKeys.map((key) => targetByKey.get(key) ?? key);
      const reason = isConfigured
        ? "Substituição configurada para este exercício"
        : matchedMuscles.length > 1
          ? `Trabalha os mesmos grupos: ${matchedMuscles.join(" e ")}`
          : `Mesmo grupo muscular: ${matchedMuscles[0] ?? candidate.muscle}`;
      return { exercise: candidate, matchedMuscles, reason, score };
    })
    .filter((suggestion) => suggestion.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name, "pt-BR"))
    .slice(0, limit);
}

function collectMuscles(exercise: Exercise, catalog?: ExerciseCatalogItem) {
  return uniqueMuscles([
    ...(exercise.muscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
    catalog?.muscle,
    ...(catalog?.muscles ?? []),
    ...(catalog?.secondaryMuscles ?? []),
  ]);
}

function collectCatalogMuscles(exercise: ExerciseCatalogItem) {
  return uniqueMuscles([
    exercise.muscle,
    ...(exercise.muscles ?? []),
    ...(exercise.secondaryMuscles ?? []),
  ]);
}

function uniqueMuscles(values: Array<string | undefined>) {
  const muscles = new Map<string, string>();
  values.forEach((value) => {
    if (!value?.trim()) return;
    const normalized = normalizeMuscle(value);
    if (!muscles.has(normalized)) muscles.set(normalized, value.trim());
  });
  return Array.from(muscles.values());
}

function normalizeMuscle(value: string) {
  const normalized = normalizeText(value);
  return muscleAliases[normalized] ?? normalized;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
