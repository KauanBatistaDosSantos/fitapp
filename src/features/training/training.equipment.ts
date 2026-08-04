import type { EquipmentType, Exercise } from "./training.schema";

export const equipmentLabels: Record<EquipmentType, string> = {
  machine: "Máquina ou polia",
  barbell: "Barra",
  dumbbell: "Halteres",
  other: "Outro",
};

export const equipmentLoadHints: Record<EquipmentType, string> = {
  machine: "Registre o peso indicado pela máquina.",
  barbell: "Registre o peso total, incluindo a barra.",
  dumbbell: "Registre o peso de cada halter.",
  other: "Registre a carga usada no exercício.",
};

export function inferEquipmentType(
  exerciseName: string,
  latestEquipment?: EquipmentType,
): EquipmentType {
  if (latestEquipment) return latestEquipment;
  const name = normalize(exerciseName);
  if (["maquina", "polia", "smith", "cabo", "pulley"].some((term) => name.includes(term))) {
    return "machine";
  }
  if (["halter", "dumbbell"].some((term) => name.includes(term))) return "dumbbell";
  if (["barra", "barbell"].some((term) => name.includes(term))) return "barbell";
  return "other";
}

export function getExerciseLoadForEquipment(
  exercise: Exercise,
  equipment: EquipmentType,
): number | undefined {
  const direct = exercise.loadsByEquipment?.[equipment];
  if (direct != null) return direct;

  const matchingHistory = [...(exercise.loadHistory ?? [])]
    .filter((entry) => entry.equipment === equipment)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  const latestMatching = matchingHistory.at(-1)?.loadKg;
  if (latestMatching != null) return latestMatching;

  const hasTypedData =
    Object.keys(exercise.loadsByEquipment ?? {}).length > 0 ||
    (exercise.loadHistory ?? []).some((entry) => entry.equipment != null);
  return hasTypedData ? undefined : exercise.loadKg;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}
