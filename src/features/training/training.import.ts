import { normalizeMediaUrls } from "./training.media";

export type ParsedExercise = {
  name: string;
  muscle: string;
  sets?: number;
  reps?: string;
  mediaUrls?: string[];
};

const prescriptionPattern =
  /(\d{1,2})[ \u00a0]*(?:[x×][ \u00a0]*(\d+(?:[ \u00a0]*[-–—][ \u00a0]*\d+)?)(?:[ \u00a0]+(segundos?|secs?|minutos?|mins?))?|s[eé]ries?[ \u00a0]*(?:de[ \u00a0]*)?(\d+(?:[ \u00a0]*[-–—][ \u00a0]*\d+)?))(?:[ \u00a0]+por[ \u00a0]+(perna|lado|braço))?/giu;

export function parseExerciseText(text: string): ParsedExercise[] {
  const source = text.replace(/\r/g, "");
  const parsed: ParsedExercise[] = [];
  let cursor = 0;

  for (const match of source.matchAll(prescriptionPattern)) {
    const matchIndex = match.index ?? cursor;
    const chunk = extractExerciseChunk(source.slice(cursor, matchIndex));
    if (chunk.previousUrls.length > 0 && parsed.length > 0) {
      parsed[parsed.length - 1].mediaUrls = normalizeMediaUrls(
        parsed[parsed.length - 1].mediaUrls,
        chunk.previousUrls,
      );
    }
    const name = chunk.name;
    if (name) {
      const range = (match[2] ?? match[4] ?? "").replace(/\s*[-–—]\s*/g, "-");
      const unit = normalizeUnit(match[3]);
      const qualifier = match[5] ? ` por ${match[5].toLocaleLowerCase("pt-BR")}` : "";
      parsed.push({
        name,
        muscle: inferMuscleGroup(name),
        sets: Number(match[1]),
        reps: `${range}${unit ? ` ${unit}` : ""}${qualifier}`.trim(),
        mediaUrls: chunk.currentUrls.length ? chunk.currentUrls : undefined,
      });
    }
    cursor = matchIndex + match[0].length;
  }

  if (cursor === 0) {
    return uniqueExercises(parseUnprescribedExerciseText(source));
  }

  const remainderChunk = extractExerciseChunk(source.slice(cursor));
  if (remainderChunk.previousUrls.length > 0 && parsed.length > 0) {
    parsed[parsed.length - 1].mediaUrls = normalizeMediaUrls(
      parsed[parsed.length - 1].mediaUrls,
      remainderChunk.previousUrls,
    );
  }
  const remainder = remainderChunk.name;
  if (remainder) {
    const names = splitUnprescribedExercises(remainder);
    parsed.push(...names.map((name, index) => ({
      name,
      muscle: inferMuscleGroup(name),
      mediaUrls: index === 0 && remainderChunk.currentUrls.length
        ? remainderChunk.currentUrls
        : undefined,
    })));
  }

  if (parsed.length === 0) {
    return uniqueExercises(parseUnprescribedExerciseText(source));
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

function extractExerciseChunk(value: string) {
  const matches = Array.from(value.matchAll(/https?:\/\/[^\s<>"']+/giu));
  if (matches.length === 0) {
    return { name: cleanExerciseName(value), currentUrls: [], previousUrls: [] };
  }

  const currentUrls: string[] = [];
  const previousUrls: string[] = [];
  for (const match of matches) {
    const beforeUrl = value.slice(0, match.index);
    const hasNameBeforeUrl = Boolean(cleanExerciseName(removeUrls(beforeUrl)));
    const url = cleanUrl(match[0]);
    if (!url) continue;
    if (hasNameBeforeUrl) currentUrls.push(url);
    else previousUrls.push(url);
  }

  return {
    name: cleanExerciseName(removeUrls(value)),
    currentUrls: normalizeMediaUrls(currentUrls),
    previousUrls: normalizeMediaUrls(previousUrls),
  };
}

function removeUrls(value: string) {
  return value.replace(/https?:\/\/[^\s<>"']+/giu, " ");
}

function cleanUrl(value: string) {
  return value.replace(/[.,;:!?)}\]]+$/g, "").trim() || undefined;
}

function splitUnprescribedExercises(value: string) {
  return value
    .split(/[\n\t;|]+/)
    .map(cleanExerciseName)
    .filter(Boolean);
}

function parseUnprescribedExerciseText(value: string): ParsedExercise[] {
  const parsed: ParsedExercise[] = [];
  for (const segment of value.split(/[\n;|]+/)) {
    const chunk = extractExerciseChunk(segment);
    const names = splitUnprescribedExercises(chunk.name);
    const urls = normalizeMediaUrls(chunk.currentUrls, chunk.previousUrls);
    if (names.length === 0) {
      if (urls.length > 0 && parsed.length > 0) {
        parsed[parsed.length - 1].mediaUrls = normalizeMediaUrls(
          parsed[parsed.length - 1].mediaUrls,
          urls,
        );
      }
      continue;
    }
    parsed.push(
      ...names.map((name, index) => ({
        name,
        muscle: inferMuscleGroup(name),
        mediaUrls: index === 0 && urls.length ? urls : undefined,
      })),
    );
  }
  return parsed;
}

function uniqueExercises(exercises: ParsedExercise[]) {
  const unique = new Map<string, ParsedExercise>();
  exercises.forEach((exercise) => {
    const key = normalizeExerciseName(exercise.name);
    if (!key) return;
    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, exercise);
      return;
    }
    existing.mediaUrls = normalizeMediaUrls(existing.mediaUrls, exercise.mediaUrls);
  });
  return Array.from(unique.values());
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
