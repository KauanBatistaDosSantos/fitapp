import { isoDate } from "@/lib/date";
import type { TrainingTemplate, Split, Exercise } from "./training.schema";

type ExerciseCatalogSeed = { id: string; name: string; muscle: string };
type CardioCatalogSeed = { id: string; kind: string };

export const trainingCatalogSeed: ExerciseCatalogSeed[] = [
  { id: "ex-supino", name: "Supino reto com halter", muscle: "Peito" },
  { id: "ex-crucifixo", name: "Crucifixo com halter", muscle: "Peito" },
  { id: "ex-puxador", name: "Puxada na frente", muscle: "Costas" },
  { id: "ex-serrote", name: "Remada unilateral", muscle: "Costas" },
  { id: "ex-agachamento", name: "Agachamento livre", muscle: "Pernas" },
  { id: "ex-legpress", name: "Leg press", muscle: "Pernas" },
  { id: "ex-desenvolvimento", name: "Desenvolvimento com halter", muscle: "Ombros" },
  { id: "ex-elevacao", name: "Elevação lateral", muscle: "Ombros" },
  { id: "ex-rosca", name: "Rosca direta", muscle: "Bíceps" },
  { id: "ex-triceps", name: "Tríceps testa", muscle: "Tríceps" },
];

export const cardioCatalogSeed: CardioCatalogSeed[] = [
  { id: "cardio-zumba", kind: "Zumba" },
  { id: "cardio-esteira", kind: "Esteira" },
  { id: "cardio-bike", kind: "Bike" },
  { id: "cardio-corda", kind: "Corda" },
];

const cardio = (kind: CardioCatalogSeed["kind"], minutes: number, id: string) => ({ id, kind, minutes });
const exercise = (id: string, name: string, sets: number, reps: string, restSec = 60): Exercise => ({
  id,
  name,
  sets,
  reps,
  restSec,
});

export const trainingTemplateSeed: TrainingTemplate = {
  A: {
    split: "A",
    am: [cardio("Zumba", 40, "cardio-a-1")],
    pm: [
      exercise("tr-ex-1", "Supino reto com halter", 4, "10-12"),
      exercise("tr-ex-2", "Crucifixo com halter", 3, "12"),
      exercise("tr-ex-3", "Desenvolvimento com halter", 3, "12"),
    ],
  },
  B: {
    split: "B",
    am: [cardio("Esteira", 35, "cardio-b-1")],
    pm: [
      exercise("tr-ex-4", "Puxada na frente", 4, "10-12"),
      exercise("tr-ex-5", "Remada unilateral", 3, "12"),
      exercise("tr-ex-6", "Rosca direta", 3, "12"),
    ],
  },
  C: {
    split: "C",
    am: [cardio("Bike", 40, "cardio-c-1")],
    pm: [
      exercise("tr-ex-7", "Agachamento livre", 4, "8-10"),
      exercise("tr-ex-8", "Leg press", 4, "12"),
      exercise("tr-ex-9", "Elevação lateral", 3, "12"),
    ],
  },
  D: {
    split: "D",
    am: [cardio("Esteira", 30, "cardio-d-1")],
    pm: [
      exercise("tr-ex-10", "Supino reto com halter", 4, "8-10"),
      exercise("tr-ex-11", "Crucifixo com halter", 3, "12"),
      exercise("tr-ex-12", "Tríceps testa", 3, "12"),
    ],
  },
  E: {
    split: "E",
    am: [cardio("Corda", 20, "cardio-e-1")],
    pm: [
      exercise("tr-ex-13", "Remada unilateral", 3, "12"),
      exercise("tr-ex-14", "Leg press", 4, "12"),
      exercise("tr-ex-15", "Elevação lateral", 3, "12"),
    ],
  },
};

export function buildWeekLog(reference: Date = new Date()) {
  const base = new Date(reference);
  return ("ABCDE".split("") as Split[]).map((split, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return { dateISO: isoDate(date), split, amDone: false, pmDone: false, doneExercises: [] };
  });
}