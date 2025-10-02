import type { Split, TrainingTemplate } from "./training.schema";

const splitTitles: Record<Split, string> = {
  A: "Treino A",
  B: "Treino B",
  C: "Treino C",
  D: "Treino D",
  E: "Treino E",
};

type TrainingDayProps = {
  split: Split;
  plan: TrainingTemplate[Split];
  onRemoveCardio: (id: string) => void;
  onRemoveExercise: (id: string) => void;
};

export function TrainingDay({ split, plan, onRemoveCardio, onRemoveExercise }: TrainingDayProps) {
  return (
    <div className="training-day">
      <header>
        <h3>{splitTitles[split]}</h3>
      </header>
      <div className="training-day__columns">
        <div>
          <strong>Parte 1 · Cardio</strong>
          {plan.am.length === 0 ? (
            <p className="training-day__empty">Sem blocos cadastrados.</p>
          ) : (
            <ul>
              {plan.am.map((block) => (
                <li key={block.id}>
                  <span>
                    {block.kind} · {block.minutes} min
                  </span>
                  <button type="button" onClick={() => onRemoveCardio(block.id)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <strong>Parte 2 · Musculação</strong>
          {plan.pm.length === 0 ? (
            <p className="training-day__empty">Sem exercícios cadastrados.</p>
          ) : (
            <ul>
              {plan.pm.map((exercise) => (
                <li key={exercise.id}>
                  <div>
                    <span className="training-day__exerciseName">{exercise.name}</span>
                    <span className="training-day__exerciseDetail">
                      {exercise.sets} séries · {exercise.reps} reps · descanso {exercise.restSec}s
                    </span>
                  </div>
                  <button type="button" onClick={() => onRemoveExercise(exercise.id)}>
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-day {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 18px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(248, 250, 252, 0.75);
}
.training-day header h3 {
  margin: 0;
}
.training-day__columns {
  display: grid;
  gap: 18px;
}
.training-day__columns ul {
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.training-day__columns li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  background: white;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
}
.training-day__empty {
  color: #94a3b8;
  font-size: 0.9rem;
}
.training-day__exerciseName {
  font-weight: 700;
}
.training-day__exerciseDetail {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
}
@media (min-width: 768px) {
  .training-day__columns {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}