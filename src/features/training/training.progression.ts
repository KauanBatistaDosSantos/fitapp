import { getExerciseLoadForEquipment } from "./training.equipment";
import type { EquipmentType, Exercise } from "./training.schema";

export type LoadProgressionSuggestion = {
  status: "no-load" | "incomplete" | "repeat" | "increase";
  currentKg?: number;
  suggestedKg?: number;
  percentage?: number;
  daysSinceLastRecord?: number;
  message: string;
};

export function getLoadProgressionSuggestion(
  exercise: Exercise,
  completedSets: number,
  muscles: string[],
  equipment: EquipmentType,
  referenceDate = new Date(),
): LoadProgressionSuggestion {
  const allHistory = [...(exercise.loadHistory ?? [])].sort((a, b) =>
    a.dateISO.localeCompare(b.dateISO),
  );
  const typedHistory = allHistory.filter((entry) => entry.equipment === equipment);
  const hasTypedHistory = allHistory.some((entry) => entry.equipment != null);
  const history = typedHistory.length > 0 || hasTypedHistory
    ? typedHistory
    : allHistory.filter((entry) => entry.equipment == null);
  const currentKg = getExerciseLoadForEquipment(exercise, equipment) ?? history.at(-1)?.loadKg;
  if (!currentKg || currentKg <= 0) {
    return {
      status: "no-load",
      message: "Registre uma carga para começar a acompanhar a progressão.",
    };
  }

  const latest = history.at(-1);
  const daysSinceLastRecord = latest
    ? daysBetween(latest.dateISO, referenceDate)
    : undefined;

  if (completedSets < exercise.sets) {
    return {
      status: "incomplete",
      currentKg,
      daysSinceLastRecord,
      message: "Conclua todas as séries antes de avaliar um aumento de carga.",
    };
  }

  const sameLoadDates = Array.from(
    new Set(
      history
        .filter(
          (entry) =>
            Math.abs(entry.loadKg - currentKg) < 0.01 &&
            (entry.completedSets == null ||
              entry.targetSets == null ||
              entry.completedSets >= entry.targetSets),
        )
        .map((entry) => entry.dateISO),
    ),
  );
  if (sameLoadDates.length < 2) {
    return {
      status: "repeat",
      currentKg,
      daysSinceLastRecord,
      message:
        "Repita essa carga em mais uma sessão e alcance o topo da faixa de repetições com boa técnica.",
    };
  }

  const percentage = isLargeMuscleExercise(exercise.name, muscles) ? 5 : 2.5;
  const rawSuggestion = currentKg * (1 + percentage / 100);
  const suggestedKg = Math.max(currentKg + 0.5, Math.round(rawSuggestion * 2) / 2);
  return {
    status: "increase",
    currentKg,
    suggestedKg,
    percentage,
    daysSinceLastRecord,
    message:
      "Se você também alcançou o topo da faixa de repetições com técnica estável, teste este pequeno aumento.",
  };
}

function isLargeMuscleExercise(name: string, muscles: string[]) {
  const text = `${name} ${muscles.join(" ")}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
  return [
    "perna",
    "quadriceps",
    "posterior",
    "gluteo",
    "agachamento",
    "leg press",
    "stiff",
    "levantamento",
    "panturrilha",
  ].some((term) => text.includes(term));
}

function daysBetween(dateISO: string, referenceDate: Date) {
  const registered = new Date(`${dateISO}T12:00:00`);
  if (Number.isNaN(registered.getTime())) return 0;
  return Math.max(
    0,
    Math.floor((referenceDate.getTime() - registered.getTime()) / 86_400_000),
  );
}
