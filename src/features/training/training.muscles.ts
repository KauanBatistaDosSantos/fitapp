import type { CSSProperties } from "react";

export type MuscleColor = {
  color: string;
  soft: string;
};

const colors: Record<string, MuscleColor> = {
  peito: { color: "#dc2626", soft: "rgba(239, 68, 68, 0.14)" },
  peitoral: { color: "#dc2626", soft: "rgba(239, 68, 68, 0.14)" },
  costas: { color: "#2563eb", soft: "rgba(37, 99, 235, 0.14)" },
  dorsal: { color: "#2563eb", soft: "rgba(37, 99, 235, 0.14)" },
  ombro: { color: "#d97706", soft: "rgba(245, 158, 11, 0.16)" },
  ombros: { color: "#d97706", soft: "rgba(245, 158, 11, 0.16)" },
  pernas: { color: "#16a34a", soft: "rgba(34, 197, 94, 0.14)" },
  quadriceps: { color: "#16a34a", soft: "rgba(34, 197, 94, 0.14)" },
  gluteo: { color: "#db2777", soft: "rgba(236, 72, 153, 0.14)" },
  gluteos: { color: "#db2777", soft: "rgba(236, 72, 153, 0.14)" },
  "posterior de coxa": { color: "#0d9488", soft: "rgba(20, 184, 166, 0.14)" },
  biceps: { color: "#7c3aed", soft: "rgba(139, 92, 246, 0.14)" },
  triceps: { color: "#ea580c", soft: "rgba(249, 115, 22, 0.14)" },
  abdomen: { color: "#0891b2", soft: "rgba(6, 182, 212, 0.14)" },
  abdominal: { color: "#0891b2", soft: "rgba(6, 182, 212, 0.14)" },
  panturrilha: { color: "#65a30d", soft: "rgba(132, 204, 22, 0.15)" },
  panturrilhas: { color: "#65a30d", soft: "rgba(132, 204, 22, 0.15)" },
  trapezio: { color: "#4f46e5", soft: "rgba(99, 102, 241, 0.14)" },
  adutores: { color: "#059669", soft: "rgba(16, 185, 129, 0.14)" },
  adutor: { color: "#059669", soft: "rgba(16, 185, 129, 0.14)" },
  "nao informado": { color: "#64748b", soft: "rgba(100, 116, 139, 0.14)" },
};

const fallbackColors: MuscleColor[] = [
  { color: "#0284c7", soft: "rgba(14, 165, 233, 0.14)" },
  { color: "#9333ea", soft: "rgba(168, 85, 247, 0.14)" },
  { color: "#c2410c", soft: "rgba(234, 88, 12, 0.14)" },
  { color: "#0f766e", soft: "rgba(13, 148, 136, 0.14)" },
];

export function getMuscleColor(muscle?: string): MuscleColor {
  if (!muscle) return colors["nao informado"];
  const normalized = normalize(muscle);
  const exact = colors[normalized];
  if (exact) return exact;
  const partial = Object.entries(colors).find(([name]) => normalized.includes(name));
  if (partial) return partial[1];
  const hash = Array.from(normalized).reduce((total, char) => total + char.charCodeAt(0), 0);
  return fallbackColors[hash % fallbackColors.length];
}

export function muscleAccentStyle(muscle?: string): CSSProperties {
  return { "--muscle-color": getMuscleColor(muscle).color } as CSSProperties;
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}
