import { useEffect, useMemo, useState } from "react";
import type { Split, TrainingTemplate } from "./training.schema";
import type { CardioCatalogItem, ExerciseCatalogItem } from "./training.store";

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
  cardioCatalog: CardioCatalogItem[];
  onRemoveCardio: (id: string) => void;
  onUpdateCardio: (id: string, payload: { kind?: string; minutes?: number }) => void;
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

type CardioDraft = {
  kind: string;
  minutes: string;
};

export function TrainingDay({
  split,
  plan,
  catalog,
  cardioCatalog,
  onRemoveCardio,
  onUpdateCardio,
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

  const [exerciseDrafts, setExerciseDrafts] = useState<Record<string, ExerciseDraft>>({});
  const [cardioDrafts, setCardioDrafts] = useState<Record<string, CardioDraft>>({});
  const [editingExercises, setEditingExercises] = useState<Record<string, boolean>>({});
  const [editingCardio, setEditingCardio] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setExerciseDrafts(() => {
      const next: Record<string, ExerciseDraft> = {};
      for (const exercise of plan.pm) {
        next[exercise.id] = {
          sets: String(exercise.sets),
          reps: exercise.reps,
          rest: String(exercise.restSec),
          notes: exercise.notes ?? "",
          load: exercise.loadKg != null ? String(exercise.loadKg) : "",
        };
      }
      return next;
    });
    setEditingExercises((prev) => {
      const valid = new Set(plan.pm.map((exercise) => exercise.id));
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(prev)) {
        if (valid.has(key)) {
          next[key] = prev[key];
        }
      }
      return next;
    });
  }, [plan.pm]);

  useEffect(() => {
    setCardioDrafts(() => {
      const next: Record<string, CardioDraft> = {};
      for (const block of plan.am) {
        next[block.id] = {
          kind: block.kind,
          minutes: String(block.minutes),
        };
      }
      return next;
    });
    setEditingCardio((prev) => {
      const valid = new Set(plan.am.map((block) => block.id));
      const next: Record<string, boolean> = {};
      for (const key of Object.keys(prev)) {
        if (valid.has(key)) {
          next[key] = prev[key];
        }
      }
      return next;
    });
  }, [plan.am]);

  const handleExerciseChange = (id: string, field: keyof ExerciseDraft, value: string) => {
    setExerciseDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleExerciseSubmit = (evt: React.FormEvent<HTMLFormElement>, id: string) => {
    evt.preventDefault();
    const draft = exerciseDrafts[id];
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
    setEditingExercises((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleCardioChange = (id: string, field: keyof CardioDraft, value: string) => {
    setCardioDrafts((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleCardioSubmit = (evt: React.FormEvent<HTMLFormElement>, id: string) => {
    evt.preventDefault();
    const draft = cardioDrafts[id];
    if (!draft) return;
    const minutes = Number(draft.minutes) || 5;
    const payload: { kind?: string; minutes?: number } = { minutes };
    const kind = draft.kind.trim();
    if (kind) {
      payload.kind = kind;
    }
    onUpdateCardio(id, payload);
    setEditingCardio((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const startExerciseEdit = (id: string) => {
    const exercise = plan.pm.find((item) => item.id === id);
    if (!exercise) return;
    setExerciseDrafts((prev) => ({
      ...prev,
      [id]: {
        sets: String(exercise.sets),
        reps: exercise.reps,
        rest: String(exercise.restSec),
        notes: exercise.notes ?? "",
        load: exercise.loadKg != null ? String(exercise.loadKg) : "",
      },
    }));
    setEditingExercises((prev) => ({ ...prev, [id]: true }));
  };

  const cancelExerciseEdit = (id: string) => {
    const exercise = plan.pm.find((item) => item.id === id);
    if (!exercise) return;
    setExerciseDrafts((prev) => ({
      ...prev,
      [id]: {
        sets: String(exercise.sets),
        reps: exercise.reps,
        rest: String(exercise.restSec),
        notes: exercise.notes ?? "",
        load: exercise.loadKg != null ? String(exercise.loadKg) : "",
      },
    }));
    setEditingExercises((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const startCardioEdit = (id: string) => {
    const block = plan.am.find((item) => item.id === id);
    if (!block) return;
    setCardioDrafts((prev) => ({
      ...prev,
      [id]: {
        kind: block.kind,
        minutes: String(block.minutes),
      },
    }));
    setEditingCardio((prev) => ({ ...prev, [id]: true }));
  };

  const cancelCardioEdit = (id: string) => {
    const block = plan.am.find((item) => item.id === id);
    if (!block) return;
    setCardioDrafts((prev) => ({
      ...prev,
      [id]: {
        kind: block.kind,
        minutes: String(block.minutes),
      },
    }));
    setEditingCardio((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
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
              {plan.am.map((block) => {
                const cardioDraft = cardioDrafts[block.id] ?? {
                  kind: block.kind,
                  minutes: String(block.minutes),
                };
                const isEditingCardio = Boolean(editingCardio[block.id]);

                return (
                  <li key={block.id}>
                    <div className="training-day__cardioHeader">
                      <span className="training-day__cardioTitle">
                        {block.kind} · {block.minutes} min
                      </span>
                      <div className="training-day__actions training-day__actions--gap">
                        {isEditingCardio ? (
                          <button type="button" onClick={() => cancelCardioEdit(block.id)}>
                            Cancelar
                          </button>
                        ) : (
                          <button type="button" onClick={() => startCardioEdit(block.id)}>
                            Editar
                          </button>
                        )}
                        <button type="button" onClick={() => onRemoveCardio(block.id)}>
                          Remover
                        </button>
                      </div>
                    </div>
                    {isEditingCardio && (
                      <form className="training-day__form" onSubmit={(evt) => handleCardioSubmit(evt, block.id)}>
                        <div className="training-day__formGrid">
                          <label>
                            Tipo de cardio
                          {cardioCatalog.length > 0 ? (
                            <select
                              value={cardioDraft.kind}
                              onChange={(e) => handleCardioChange(block.id, "kind", e.target.value)}
                            >
                              {cardioCatalog.some((option) => option.kind === cardioDraft.kind) ? null : (
                                <option value={cardioDraft.kind}>{cardioDraft.kind}</option>
                              )}
                              {cardioCatalog.map((item) => (
                                <option key={item.id} value={item.kind}>
                                  {item.kind}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={cardioDraft.kind}
                              onChange={(e) => handleCardioChange(block.id, "kind", e.target.value)}
                            />
                          )}
                        </label>
                        <label>
                          Duração (minutos)
                          <input
                            value={cardioDraft.minutes}
                            onChange={(e) => handleCardioChange(block.id, "minutes", e.target.value)}
                            type="number"
                            min={5}
                            step={5}
                          />
                        </label>
                      </div>
                      <div className="training-day__formActions">
                        <button type="submit">Salvar alterações</button>
                      </div>
                    </form>
                    )}
                  </li>
                );
              })}
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
                  exerciseDrafts[exercise.id] ?? {
                    sets: String(exercise.sets),
                    reps: exercise.reps,
                    rest: String(exercise.restSec),
                    notes: exercise.notes ?? "",
                    load: exercise.loadKg != null ? String(exercise.loadKg) : "",
                  };
                const isEditing = Boolean(editingExercises[exercise.id]);

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
                      {isEditing ? (
                        <form className="training-day__form" onSubmit={(evt) => handleExerciseSubmit(evt, exercise.id)}>
                          <div className="training-day__formGrid">
                            <label>
                              Séries
                              <input
                                value={draft.sets}
                                onChange={(e) => handleExerciseChange(exercise.id, "sets", e.target.value)}
                                type="number"
                                min={1}
                                max={12}
                              />
                            </label>
                            <label>
                              Repetições
                              <input
                                value={draft.reps}
                                onChange={(e) => handleExerciseChange(exercise.id, "reps", e.target.value)}
                                placeholder="12"
                              />
                            </label>
                            <label>
                              Descanso (s)
                              <input
                                value={draft.rest}
                                onChange={(e) => handleExerciseChange(exercise.id, "rest", e.target.value)}
                                type="number"
                                min={15}
                                step={5}
                              />
                            </label>
                            <label>
                              Carga (kg)
                              <input
                                value={draft.load}
                                onChange={(e) => handleExerciseChange(exercise.id, "load", e.target.value)}
                                type="number"
                                step={0.5}
                                min={0}
                              />
                            </label>
                          </div>
                          <label className="training-day__notes">
                            Observações
                            <textarea
                              value={draft.notes}
                              onChange={(e) => handleExerciseChange(exercise.id, "notes", e.target.value)}
                              rows={2}
                            />
                          </label>
                          <div className="training-day__formActions training-day__formActions--split">
                            <button type="submit">Salvar alterações</button>
                            <button type="button" onClick={() => cancelExerciseEdit(exercise.id)}>
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="training-day__exerciseSummary">
                          <div className="training-day__summaryChips">
                            <span>{exercise.sets} séries</span>
                            <span>{exercise.reps} reps</span>
                            <span>Descanso: {exercise.restSec}s</span>
                            {exercise.loadKg != null && <span>Carga: {exercise.loadKg} kg</span>}
                          </div>
                          {exercise.notes && <p className="training-day__notesText">{exercise.notes}</p>}
                        </div>
                      )}

                      <div className="training-day__actions training-day__actions--gap">
                        {!isEditing && (
                          <button type="button" onClick={() => startExerciseEdit(exercise.id)}>
                            Editar
                          </button>
                        )}
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
  align-items: center;
}
.training-day__actions--gap {
  gap: 8px;
  flex-wrap: wrap;
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
.training-day__cardioHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.training-day__cardioTitle {
  font-weight: 600;
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
.training-day__formActions--split {
  gap: 8px;
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
.training-day__exerciseSummary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.training-day__summaryChips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.85rem;
  color: #475569;
}
.training-day__summaryChips span {
  background: rgba(148, 163, 184, 0.2);
  border-radius: 999px;
  padding: 4px 10px;
}
.training-day__notesText {
  margin: 0;
  font-size: 0.85rem;
  color: #475569;
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