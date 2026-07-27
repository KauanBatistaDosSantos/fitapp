type MediaSource = {
  mediaUrls?: string[];
  gifUrl?: string;
};

export function normalizeMediaUrls(
  ...values: Array<string | string[] | undefined>
) {
  const urls = values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((value) => value.trim())
    .filter((value) => /^https?:\/\//i.test(value));
  return Array.from(new Set(urls));
}

export function parseMediaUrls(value: string) {
  return normalizeMediaUrls(value.match(/https?:\/\/[^\s<>"']+/giu)?.map(cleanMediaUrl));
}

export function resolveExerciseMedia(
  exercise?: MediaSource,
  catalogItem?: MediaSource,
) {
  return normalizeMediaUrls(
    catalogItem?.mediaUrls,
    catalogItem?.gifUrl,
    exercise?.mediaUrls,
    exercise?.gifUrl,
  );
}

function cleanMediaUrl(value: string) {
  return value.replace(/[.,;:!?)}\]]+$/g, "").trim();
}
