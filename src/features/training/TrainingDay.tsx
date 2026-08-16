import { useEffect, useMemo, useState } from "react";
import type { CardioBlock, CardioPlacement, Split, TrainingTemplate } from "./training.schema";
import type { CardioCatalogItem, ExerciseCatalogItem } from "./training.store";
import { MuscleBadge } from "./MuscleBadge";
import { muscleAccentStyle } from "./training.muscles";

const splitTitles: Record<Split, string> = {
  A: "Treino A",
  B: "Treino B",
  C: "Treino C",
  D: "Treino D",
  E: "Treino E",
  F: "Treino F",
  G: "Treino G",
};

type TrainingDayProps = {
  split: Split;
  splitLabel: string;
  plan: TrainingTemplate[Split];
  availableSplits: Split[];
  catalog: ExerciseCatalogItem[];
  cardioCatalog: CardioCatalogItem[];
  onRemoveCardio: (id: string) => void;
  onUpdateCardio: (id: string, payload: Partial<Omit<CardioBlock, "id">>) => void;
  onRemoveExercise: (id: string) => void;
  onUpdateExercise: (id: string, payload: { sets: number; reps: string; restSec: number; exerciseRestSec?: number; notes?: string; loadKg?: number }) => void;
  onMoveExercise: (id: string, direction: "up" | "down") => void;
  onMoveExerciseToSplit: (id: string, target: Split) => void;
};

type ExerciseDraft = {
  sets: string;
  reps: string;
  rest: string;
  exerciseRest: string;
  notes: string;
  load: string;
};

type CardioDraft = {
  kind: string;
  minutes: string;
  placement: CardioPlacement;
  afterExerciseId: string;
};

export function TrainingDay({
  split,
  splitLabel,
  plan,
  availableSplits,
  catalog,
  cardioCatalog,
  onRemoveCardio,
  onUpdateCardio,
  onRemoveExercise,
  onUpdateExercise,
  onMoveExercise,
  onMoveExerciseToSplit,
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
  const [exerciseDestinations, setExerciseDestinations] = useState<Record<string, Split | "">>({});
  const [activeSection, setActiveSection] = useState<"exercises" | "cardio">(
    plan.pm.length > 0 ? "exercises" : "cardio",
  );

  useEffect(() => {
    setExerciseDrafts(() => {
      const next: Record<string, ExerciseDraft> = {};
      for (const exercise of plan.pm) {
        next[exercise.id] = {
          sets: String(exercise.sets),
          reps: exercise.reps,
          rest: String(exercise.restSec),
          exerciseRest: String(exercise.exerciseRestSec ?? 90),
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
          placement: block.placement ?? "before",
          afterExerciseId: block.afterExerciseId ?? "",
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
    const parsedExerciseRest = Number(draft.exerciseRest);
    const exerciseRestSec = Number.isFinite(parsedExerciseRest) && parsedExerciseRest >= 0
      ? parsedExerciseRest
      : 90;
    const reps = draft.reps.trim() || "10";
    const notes = draft.notes.trim() || undefined;
    const load = draft.load.trim();
    onUpdateExercise(id, {
      sets,
      restSec,
      exerciseRestSec,
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
    const placement = draft.placement === "between" && !draft.afterExerciseId
      ? "before"
      : draft.placement;
    const payload: Partial<Omit<CardioBlock, "id">> = {
      minutes,
      placement,
      afterExerciseId: placement === "between" ? draft.afterExerciseId : undefined,
    };
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
        exerciseRest: String(exercise.exerciseRestSec ?? 90),
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
        exerciseRest: String(exercise.exerciseRestSec ?? 90),
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
        placement: block.placement ?? "before",
        afterExerciseId: block.afterExerciseId ?? "",
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
        placement: block.placement ?? "before",
        afterExerciseId: block.afterExerciseId ?? "",
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
        <h3>
          {splitTitles[split]}
          {splitLabel?.trim() ? ` · ${splitLabel.trim()}` : ""}
        </h3>
      </header>
      <div className="training-day__contentTabs" role="tablist" aria-label={`Conteúdo do treino ${split}`}>
        <button
          id={`training-day-${split}-exercises-tab`}
          type="button"
          role="tab"
          aria-selected={activeSection === "exercises"}
          aria-controls={`training-day-${split}-exercises-panel`}
          className={activeSection === "exercises" ? "training-day__contentTab--active" : ""}
          onClick={() => setActiveSection("exercises")}
        >
          <span>Musculação</span>
          <small>{plan.pm.length}</small>
        </button>
        <button
          id={`training-day-${split}-cardio-tab`}
          type="button"
          role="tab"
          aria-selected={activeSection === "cardio"}
          aria-controls={`training-day-${split}-cardio-panel`}
          className={activeSection === "cardio" ? "training-day__contentTab--active" : ""}
          onClick={() => setActiveSection("cardio")}
        >
          <span>Cardio</span>
          <small>{plan.am.length}</small>
        </button>
      </div>
      <div className="training-day__columns">
        {activeSection === "cardio" && (
        <div
          className="training-day__cardioSection"
          id={`training-day-${split}-cardio-panel`}
          role="tabpanel"
          aria-labelledby={`training-day-${split}-cardio-tab`}
        >
          <strong>Cardios do treino</strong>
          {plan.am.length === 0 ? (
            <p className="training-day__empty">Sem blocos cadastrados.</p>
          ) : (
            <ul className="training-day__cardioList">
              {plan.am.map((block) => {
                const cardioDraft = cardioDrafts[block.id] ?? {
                  kind: block.kind,
                  minutes: String(block.minutes),
                  placement: block.placement ?? "before",
                  afterExerciseId: block.afterExerciseId ?? "",
                };
                const isEditingCardio = Boolean(editingCardio[block.id]);

                return (
                  <li key={block.id}>
                    <div className="training-day__cardioHeader">
                      <span className="training-day__cardioTitle">
                        {block.kind} · {block.minutes} min
                        <small>{formatCardioPlacement(block, plan.pm)}</small>
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
                        <label>
                          Posição no treino
                          <select
                            value={cardioDraft.placement}
                            onChange={(e) => handleCardioChange(block.id, "placement", e.target.value as CardioPlacement)}
                          >
                            <option value="before">Antes da musculação</option>
                            <option value="between" disabled={plan.pm.length < 2}>Entre exercícios</option>
                            <option value="after">Depois da musculação</option>
                          </select>
                        </label>
                        {cardioDraft.placement === "between" && plan.pm.length > 0 && (
                          <label>
                            Inserir depois de
                            <select
                              value={cardioDraft.afterExerciseId}
                              onChange={(e) => handleCardioChange(block.id, "afterExerciseId", e.target.value)}
                            >
                              <option value="" disabled>Escolha um exercício</option>
                              {plan.pm.map((exercise) => (
                                <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
                              ))}
                            </select>
                          </label>
                        )}
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
        )}
        {activeSection === "exercises" && (
        <div
          className="training-day__exerciseSection"
          id={`training-day-${split}-exercises-panel`}
          role="tabpanel"
          aria-labelledby={`training-day-${split}-exercises-tab`}
        >
          <strong>Exercícios de musculação</strong>
          {plan.pm.length === 0 ? (
            <p className="training-day__empty">Sem exercícios cadastrados.</p>
          ) : (
            <ul className="training-day__exerciseList">
              {plan.pm.map((exercise, index) => {
                const catalogInfo = exercise.catalogId ? catalogById[exercise.catalogId] : undefined;
                const draft =
                  exerciseDrafts[exercise.id] ?? {
                    sets: String(exercise.sets),
                    reps: exercise.reps,
                    rest: String(exercise.restSec),
                    exerciseRest: String(exercise.exerciseRestSec ?? 90),
                    notes: exercise.notes ?? "",
                    load: exercise.loadKg != null ? String(exercise.loadKg) : "",
                  };
                const isEditing = Boolean(editingExercises[exercise.id]);
                const muscles = Array.from(
                  new Set([
                    ...(exercise.muscles ?? []),
                    catalogInfo?.muscle ?? "",
                    ...(catalogInfo?.secondaryMuscles ?? []),
                  ]),
                ).filter(Boolean);

                return (
                  <li key={exercise.id} style={muscleAccentStyle(muscles[0])}>
                    <div className="training-day__exercise">
                      <div className="training-day__exerciseHeader">
                        <span className="training-day__sequence" aria-label={`Exercício ${index + 1}`}>
                          {index + 1}
                        </span>
                        <div className="training-day__exerciseInfo">
                          <span className="training-day__exerciseName">{exercise.name}</span>
                          {muscles.length > 0 && (
                            <span className="training-day__exerciseMuscles">
                              {muscles.map((muscle) => <MuscleBadge key={muscle} muscle={muscle} />)}
                            </span>
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
                              Até o próximo exercício (s)
                              <input
                                value={draft.exerciseRest}
                                onChange={(e) => handleExerciseChange(exercise.id, "exerciseRest", e.target.value)}
                                type="number"
                                min={0}
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
                            <span>Próximo exercício: {exercise.exerciseRestSec ?? 90}s</span>
                            {exercise.loadKg != null && <span>Carga: {exercise.loadKg} kg</span>}
                          </div>
                          {exercise.notes && <p className="training-day__notesText">{exercise.notes}</p>}
                        </div>
                      )}

                      <div className="training-day__actions training-day__actions--gap">
                        <select
                          className="training-day__moveSelect"
                          value={exerciseDestinations[exercise.id] ?? ""}
                          aria-label={`Escolher destino de ${exercise.name}`}
                          onChange={(event) =>
                            setExerciseDestinations((prev) => ({
                              ...prev,
                              [exercise.id]: event.target.value as Split | "",
                            }))
                          }
                        >
                          <option value="">Mover para...</option>
                          {availableSplits
                            .filter((target) => target !== split)
                            .map((target) => (
                              <option key={target} value={target}>
                                Treino {target}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          disabled={!exerciseDestinations[exercise.id]}
                          onClick={() => {
                            const target = exerciseDestinations[exercise.id];
                            if (target) onMoveExerciseToSplit(exercise.id, target);
                          }}
                        >
                          Mover
                        </button>
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
        )}
      </div>
    </div>
  );
}

function formatCardioPlacement(
  block: CardioBlock,
  exercises: TrainingTemplate[Split]["pm"],
) {
  const placement = block.placement ?? "before";
  if (placement === "after") return "Depois da musculação";
  if (placement === "between") {
    const exercise = exercises.find((item) => item.id === block.afterExerciseId);
    return exercise ? `Depois de ${exercise.name}` : "Entre exercícios";
  }
  return "Antes da musculação";
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
.training-day__contentTabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  padding: 5px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.14);
}
.training-day__contentTabs button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 42px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #475569;
  font-weight: 700;
}
.training-day__contentTabs button small {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.25);
  color: inherit;
  font-size: 0.76rem;
  font-weight: 800;
}
.training-day__contentTabs .training-day__contentTab--active {
  background: white;
  color: #1d4ed8;
  box-shadow: 0 8px 20px -16px rgba(15, 23, 42, 0.7);
}
.training-day__contentTabs .training-day__contentTab--active small {
  background: #dbeafe;
}
.training-day__columns {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 18px;
}
.training-day__cardioSection,
.training-day__exerciseSection {
  min-width: 0;
}
.training-day__columns ul {
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.training-day__columns .training-day__cardioList {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
.training-day__columns > div:last-child li {
  border-left: 5px solid var(--muscle-color, #94a3b8);
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
.training-day__actions button,
.training-day__formActions button {
  padding: 4px 10px;
  font-size: 0.85rem;
  line-height: 1.1;
  border-radius: 8px;
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
.training-day__sequence {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(37, 99, 235, 0.28);
  border-radius: 10px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.9rem;
  font-weight: 800;
}
.training-day__exerciseInfo {
  flex: 1;
  min-width: 0;
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
.training-day__cardioTitle small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 0.76rem;
  font-weight: 500;
}
.training-day__empty {
  color: #94a3b8;
  font-size: 0.9rem;
}
.training-day__exerciseName {
  font-weight: 700;
  display: block;
  overflow-wrap: anywhere;
}
.training-day__exerciseMuscles {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 5px;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  min-height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  padding: 3px 8px;
  background: rgba(248, 250, 252, 0.9);
  color: #0f172a;
  font-weight: 800;
}
.training-day__reorder button:disabled {
  opacity: 0.42;
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
.training-day__moveSelect {
  min-width: 126px;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 0.85rem;
}
html[data-theme="dark"] .training-day__reorder button {
  border-color: #60a5fa;
  background: #1d4ed8;
  color: #f8fafc;
  box-shadow: 0 5px 14px -9px rgba(96, 165, 250, 0.9);
}
html[data-theme="dark"] .training-day__reorder button:disabled {
  border-color: #475569;
  background: #334155;
  color: #94a3b8;
  box-shadow: none;
  opacity: 1;
}
html[data-theme="dark"] .training-day__summaryChips span {
  background: #334155;
  color: #e2e8f0;
}
html[data-theme="dark"] .training-day__contentTabs {
  border-color: var(--border);
  background: rgba(148, 163, 184, 0.1);
}
html[data-theme="dark"] .training-day__contentTabs button {
  color: #cbd5e1;
}
html[data-theme="dark"] .training-day__contentTabs .training-day__contentTab--active {
  background: #1d4ed8;
  color: #f8fafc;
}
html[data-theme="dark"] .training-day__contentTabs .training-day__contentTab--active small {
  background: rgba(255, 255, 255, 0.18);
  color: #f8fafc;
}
html[data-theme="dark"] .training-day__sequence {
  border-color: rgba(96, 165, 250, 0.55);
  background: rgba(37, 99, 235, 0.22);
  color: #bfdbfe;
}
@media (min-width: 900px) {
  .training-day__columns .training-day__exerciseList {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: start;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}
