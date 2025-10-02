import { useEffect, useMemo, useState } from "react";
import type { Split, TrainingTemplate } from "./training.schema";
import type { ExerciseCatalogItem } from "./training.store";

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
  catalog: ExerciseCatalogItem[];
  onRemoveCardio: (id: string) => void;
  onRemoveExercise: (id: string) => void;
  onUpdateExercise: (id: string, payload: { sets: number; reps: string; restSec: number; notes?: string; loadKg?: number }) => void;
  onMoveExercise: (id: string, direction: "up" | "down") => void;
};

type ExerciseDraft = {
  sets: string;
  reps: string;
  rest: string;
  notes: string;
  load: string;
};

export function TrainingDay({
  split,
  plan,
  catalog,
  onRemoveCardio,
  onRemoveExercise,
  onUpdateExercise,
  onMoveExercise,
}: TrainingDayProps) {
  const catalogById = useMemo(
    () =>
      catalog.reduce<Record<string, ExerciseCatalogItem>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [catalog],
  );

  const [drafts, setDrafts] = useState<Record<string, ExerciseDraft>>({});

  useEffect(() => {
    setDrafts((prev) => {
      const next = { ...prev };
      for (const exercise of plan.pm) {
        if (!next[exercise.id]) {
          next[exercise.id] = {
            sets: String(exercise.sets),
            reps: exercise.reps,
            rest: String(exercise.restSec),
            notes: exercise.notes ?? "",
            load: exercise.loadKg != null ? String(exercise.loadKg) : "",
          };
        }
      }
      return next;
    });
  }, [plan.pm]);

  const handleChange = (id: string, field: keyof ExerciseDraft, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (evt: React.FormEvent<HTMLFormElement>, id: string) => {
    evt.preventDefault();
    const draft = drafts[id];
    if (!draft) return;
    const sets = Number(draft.sets) || 1;
    const restSec = Number(draft.rest) || 30;
    const reps = draft.reps.trim() || "10";
    const notes = draft.notes.trim() || undefined;
    const load = draft.load.trim();
    onUpdateExercise(id, {
      sets,
      restSec,
      reps,
      notes,
      loadKg: load ? Number(load) : undefined,
    });
  };

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
                  <div className="training-day__actions">
                    <button type="button" onClick={() => onRemoveCardio(block.id)}>
                      Remover
                    </button>
                  </div>
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
              {plan.pm.map((exercise, index) => {
                const catalogInfo = exercise.catalogId ? catalogById[exercise.catalogId] : undefined;
                const draft =
                  drafts[exercise.id] ?? {
                    sets: String(exercise.sets),
                    reps: exercise.reps,
                    rest: String(exercise.restSec),
                    notes: exercise.notes ?? "",
                    load: exercise.loadKg != null ? String(exercise.loadKg) : "",
                  };

                return (
                  <li key={exercise.id}>
                    <div className="training-day__exercise">
                      <div className="training-day__exerciseHeader">
                        <div>
                          <span className="training-day__exerciseName">{exercise.name}</span>
                          {catalogInfo?.muscles && catalogInfo.muscles.length > 0 && (
                            <span className="training-day__exerciseMuscle">{catalogInfo.muscles.join(", ")}</span>
                          )}
                        </div>
                        <div className="training-day__reorder">
                          <button type="button" onClick={() => onMoveExercise(exercise.id, "up")} disabled={index === 0} aria-label="Mover para cima">
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveExercise(exercise.id, "down")}
                            disabled={index === plan.pm.length - 1}
                            aria-label="Mover para baixo"
                          >
                            ↓
                          </button>
                        </div>
                      </div>

                      <form className="training-day__form" onSubmit={(evt) => handleSubmit(evt, exercise.id)}>
                        <div className="training-day__formGrid">
                          <label>
                            Séries
                            <input
                              value={draft.sets}
                              onChange={(e) => handleChange(exercise.id, "sets", e.target.value)}
                              type="number"
                              min={1}
                              max={12}
                            />
                          </label>
                          <label>
                            Repetições
                            <input
                              value={draft.reps}
                              onChange={(e) => handleChange(exercise.id, "reps", e.target.value)}
                              placeholder="12"
                            />
                          </label>
                          <label>
                            Descanso (s)
                            <input
                              value={draft.rest}
                              onChange={(e) => handleChange(exercise.id, "rest", e.target.value)}
                              type="number"
                              min={15}
                              step={5}
                            />
                          </label>
                          <label>
                            Carga (kg)
                            <input
                              value={draft.load}
                              onChange={(e) => handleChange(exercise.id, "load", e.target.value)}
                              type="number"
                              step={0.5}
                              min={0}
                            />
                          </label>
                        </div>
                        <label className="training-day__notes">
                          Observações
                          <textarea value={draft.notes} onChange={(e) => handleChange(exercise.id, "notes", e.target.value)} rows={2} />
                        </label>
                        <div className="training-day__formActions">
                          <button type="submit">Salvar alterações</button>
                        </div>
                      </form>

                      <div className="training-day__actions">
                        <button type="button" onClick={() => onRemoveExercise(exercise.id)}>
                          Remover exercício
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
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
  flex-direction: column;
  gap: 12px;
  background: white;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.35);
}
.training-day__actions {
  display: flex;
  justify-content: flex-end;
}
.training-day__exercise {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.training-day__exerciseHeader {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.training-day__empty {
  color: #94a3b8;
  font-size: 0.9rem;
}
.training-day__exerciseName {
  font-weight: 700;
}
.training-day__exerciseMuscle {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
}
.training-day__form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.training-day__formGrid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
}
.training-day__formGrid label,
.training-day__notes {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #475569;
}
.training-day__formActions {
  display: flex;
  justify-content: flex-end;
}
.training-day__reorder {
  display: inline-flex;
  gap: 6px;
  margin-left: auto;
}
.training-day__reorder button {
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 2px 8px;
  background: rgba(248, 250, 252, 0.9);
}
.training-day__reorder button:disabled {
  opacity: 0.5;
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