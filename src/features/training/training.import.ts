export type ParsedExercise = {
  name: string;
  muscle: string;
  sets?: number;
  reps?: string;
};

const prescriptionPattern =
  /(\d{1,2})[ \u00a0]*(?:[x×][ \u00a0]*(\d+(?:[ \u00a0]*[-–—][ \u00a0]*\d+)?)(?:[ \u00a0]+(segundos?|secs?|minutos?|mins?))?|s[eé]ries?[ \u00a0]*(?:de[ \u00a0]*)?(\d+(?:[ \u00a0]*[-–—][ \u00a0]*\d+)?))(?:[ \u00a0]+por[ \u00a0]+(perna|lado|braço))?/giu;

export function parseExerciseText(text: string): ParsedExercise[] {
  const source = text.replace(/\r/g, "");
  const parsed: ParsedExercise[] = [];
  let cursor = 0;

  for (const match of source.matchAll(prescriptionPattern)) {
    const matchIndex = match.index ?? cursor;
    const name = cleanExerciseName(source.slice(cursor, matchIndex));
    if (name) {
      const range = (match[2] ?? match[4] ?? "").replace(/\s*[-–—]\s*/g, "-");
      const unit = normalizeUnit(match[3]);
      const qualifier = match[5] ? ` por ${match[5].toLocaleLowerCase("pt-BR")}` : "";
      parsed.push({
        name,
        muscle: inferMuscleGroup(name),
        sets: Number(match[1]),
        reps: `${range}${unit ? ` ${unit}` : ""}${qualifier}`.trim(),
      });
    }
    cursor = matchIndex + match[0].length;
  }

  const remainder = cleanExerciseName(source.slice(cursor));
  if (remainder) {
    parsed.push(
      ...splitUnprescribedExercises(remainder).map((name) => ({
        name,
        muscle: inferMuscleGroup(name),
      })),
    );
  }

  if (parsed.length === 0) {
    return uniqueExercises(
      splitUnprescribedExercises(source).map((name) => ({
        name,
        muscle: inferMuscleGroup(name),
      })),
    );
  }

  return uniqueExercises(parsed);
}

export function normalizeExerciseName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export function repairImportedExercise(name: string, reps?: string) {
  const repairs: Array<[RegExp, string]> = [
    [/^upino\b/i, "Supino"],
    [/^tiff\b/i, "Stiff"],
  ];
  const repair = repairs.find(([pattern]) => pattern.test(name));
  if (!repair || !reps?.endsWith(" segundos")) return { name, reps };
  return {
    name: name.replace(repair[0], repair[1]),
    reps: reps.replace(/\s+segundos$/i, ""),
  };
}

function cleanExerciseName(value: string) {
  return value
    .replace(/^[\s|;,:•·\-–—]+|[\s|;,:•·\-–—]+$/gu, "")
    .replace(/^\d+\s*[.)-]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitUnprescribedExercises(value: string) {
  return value
    .split(/[\n\t;|]+/)
    .map(cleanExerciseName)
    .filter(Boolean);
}

function uniqueExercises(exercises: ParsedExercise[]) {
  const seen = new Set<string>();
  return exercises.filter((exercise) => {
    const key = normalizeExerciseName(exercise.name);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeUnit(unit?: string) {
  if (!unit) return "";
  const normalized = unit.toLocaleLowerCase("pt-BR");
  if (normalized === "s" || normalized.startsWith("sec")) return "segundos";
  if (normalized.startsWith("min")) return "minutos";
  return normalized;
}

export function inferMuscleGroup(name: string) {
  const normalized = normalizeExerciseName(name);
  const includesAny = (...terms: string[]) => terms.some((term) => normalized.includes(term));

  if (includesAny("elevacao pelvica", "hip thrust", "abdutora")) return "Glúteos";
  if (includesAny("stiff", "romeno", "flexora")) return "Posterior de coxa";
  if (includesAny("agachamento", "leg press", "afundo", "extensora")) return "Pernas";
  if (includesAny("adutora")) return "Adutores";
  if (includesAny("panturrilha")) return "Panturrilhas";
  if (includesAny("supino", "chest press", "crucifixo")) {
    if (includesAny("crucifixo invertido")) return "Ombros";
    return "Peito";
  }
  if (includesAny("puxada", "remada")) return "Costas";
  if (includesAny("desenvolvimento", "elevacao lateral", "face pull", "crucifixo invertido")) return "Ombros";
  if (includesAny("encolhimento")) return "Trapézio";
  if (includesAny("rosca")) return "Bíceps";
  if (includesAny("triceps")) return "Tríceps";
  if (includesAny("prancha", "abdominal")) return "Abdômen";
  return "Não informado";
}
