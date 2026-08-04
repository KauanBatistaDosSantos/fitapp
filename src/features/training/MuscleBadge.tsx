import { getMuscleColor } from "./training.muscles";

export function MuscleBadge({ muscle }: { muscle: string }) {
  const palette = getMuscleColor(muscle);
  return (
    <span
      className="muscle-badge"
      style={{
        color: palette.color,
        background: palette.soft,
        borderColor: palette.color,
      }}
    >
      <span className="muscle-badge__dot" style={{ background: palette.color }} aria-hidden="true" />
      {muscle}
    </span>
  );
}
