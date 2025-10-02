import type { Split, TrainingTemplate, TrainingLog } from "./training.schema";
import { sessionProgress, isToday } from "./training.service";

const splitTitles: Record<Split, string> = {
  A: "Peitoral",
  B: "Dorsal",
  C: "Pernas",
  D: "Ombros",
  E: "Bíceps & Tríceps",
};

type TrainingSplitProps = {
  split: Split;
  plan: TrainingTemplate[Split];
  log?: TrainingLog;
  onTogglePart: (split: Split, part: "am" | "pm") => void;
  onToggleExercise: (split: Split, id: string) => void;
};

export function TrainingSplit({ split, plan, log, onTogglePart, onToggleExercise }: TrainingSplitProps) {
  const progress = sessionProgress(plan, log);
  const title = splitTitles[split];

  return (
    <section className="training-split">
      <header className="training-split__header">
        <div>
          <h3>
            Treino {split} · {title}
          </h3>
          <p>
            {plan.am.length > 0 && "Cardio pela manhã"}
            {plan.am.length > 0 && plan.pm.length > 0 && " · "}
            {plan.pm.length > 0 && "Musculação à tarde"}
          </p>
        </div>
        <span className="training-split__progress">{Math.round(progress * 100)}%</span>
      </header>

      {plan.am.length > 0 && (
        <div className="training-split__block">
          <div className="training-split__blockHeader">
            <strong>Parte 1 · Cardio</strong>
            <button type="button" onClick={() => onTogglePart(split, "am")}>
              {log?.amDone ? "Desmarcar" : "Concluir"}
            </button>
          </div>
          <ul className="training-split__list">
            {plan.am.map((block) => (
              <li key={block.id}>
                <span>{block.kind}</span>
                <span>{block.minutes} min</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.pm.length > 0 && (
        <div className="training-split__block">
          <div className="training-split__blockHeader">
            <strong>Parte 2 · Musculação</strong>
            <button type="button" onClick={() => onTogglePart(split, "pm")}>
              {log?.pmDone ? "Desmarcar" : "Concluir"}
            </button>
          </div>
          <ul className="training-split__exercises">
            {plan.pm.map((exercise) => {
              const checked = log?.doneExercises.includes(exercise.id) ?? false;
              return (
                <li key={exercise.id}>
                  <button
                    type="button"
                    className={`training-split__exercise ${checked ? "training-split__exercise--done" : ""}`}
                    onClick={() => onToggleExercise(split, exercise.id)}
                  >
                    <div>
                      <span className="training-split__exerciseName">{exercise.name}</span>
                      <span className="training-split__exerciseDetail">
                        {exercise.sets} séries · {exercise.reps} reps · descanso {exercise.restSec}s
                      </span>
                      {exercise.notes && <span className="training-split__exerciseNote">{exercise.notes}</span>}
                    </div>
                    <span className="training-split__exerciseStatus">{checked ? "✓" : "○"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isToday(log ?? { dateISO: "", split, amDone: false, pmDone: false, doneExercises: [] }) && (
        <footer className="training-split__footer">Treino de hoje</footer>
      )}
    </section>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-split {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.training-split__header {
  display: flex;
  align-items: center;
  gap: 12px;
}
.training-split__header h3 {
  margin: 0;
  font-size: 1.2rem;
}
.training-split__header p {
  margin: 4px 0 0;
  color: #475569;
  font-size: 0.9rem;
}
.training-split__progress {
  margin-left: auto;
  font-weight: 700;
  color: #1d4ed8;
}
.training-split__block {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(248, 250, 252, 0.7);
}
.training-split__blockHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.training-split__list,
.training-split__exercises {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
}
.training-split__list li {
  display: flex;
  justify-content: space-between;
  color: #334155;
}
.training-split__exercise {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: white;
  padding: 12px 14px;
  color: inherit;
}
.training-split__exercise--done {
  border-color: rgba(37, 99, 235, 0.6);
  background: rgba(37, 99, 235, 0.08);
}
.training-split__exerciseName {
  font-weight: 700;
}
.training-split__exerciseDetail {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
}
.training-split__exerciseNote {
  display: block;
  color: #94a3b8;
  font-size: 0.75rem;
}
.training-split__exerciseStatus {
  font-size: 1.4rem;
  color: #2563eb;
  margin-left: 12px;
}
.training-split__footer {
  align-self: flex-start;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}