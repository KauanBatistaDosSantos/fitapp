import { useEffect, useMemo, useRef, useState } from "react";
import type { Split, TrainingTemplate, TrainingLog, Exercise, EquipmentType } from "./training.schema";
import { sessionProgress, isToday } from "./training.service";
import type { ExerciseCatalogItem, TrainingPreferences } from "./training.store";
import { defaultSplitLabels } from "./training.store";
import { resolveExerciseMedia } from "./training.media";
import { TrainingMediaGallery } from "./TrainingMediaGallery";
import { startExerciseTimer, useExerciseTimer } from "./useExerciseTimer";
import { getLoadProgressionSuggestion } from "./training.progression";
import {
  equipmentLabels,
  equipmentLoadHints,
  getExerciseLoadForEquipment,
  inferEquipmentType,
} from "./training.equipment";
import { MuscleBadge } from "./MuscleBadge";
import { muscleAccentStyle } from "./training.muscles";

type TrainingSplitProps = {
  split: Split;
  plan: TrainingTemplate[Split];
  log?: TrainingLog;
  catalog: ExerciseCatalogItem[];
  preferences: TrainingPreferences;
  onTogglePart: (split: Split, part: "am" | "pm") => void;
  onToggleCardio: (split: Split, id: string) => void;
  onSetSetProgress: (split: Split, id: string, setsCompleted: number) => void;
  onRecordLoad: (
    split: Split,
    id: string,
    loadKg: number,
    completedSets?: number,
    equipment?: EquipmentType,
  ) => void;
  onUpdateExercise: (split: Split, id: string, patch: Partial<Exercise>) => void;
};

type CombinedItem =
  | { kind: "cardio"; id: string; label: string; detail: string; done: boolean }
  | { kind: "exercise"; exercise: Exercise; done: boolean; setsCompleted: number };

type DetailState = {
  id: string;
  notes: string;
  load: string;
  equipment: EquipmentType;
};

type ExerciseTransitionState = {
  split: Split;
  targetId: string;
  durationSec: number;
};

function createDetailState(exercise: Exercise): DetailState {
  const latestEquipment = [...(exercise.loadHistory ?? [])]
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .at(-1)?.equipment;
  const equipment = inferEquipmentType(exercise.name, latestEquipment);
  const load = getExerciseLoadForEquipment(exercise, equipment);
  return {
    id: exercise.id,
    notes: exercise.notes ?? "",
    equipment,
    load: load != null ? String(load) : "",
  };
}

export function TrainingSplit({
  split,
  plan,
  log,
  catalog,
  preferences,
  onTogglePart,
  onToggleCardio,
  onSetSetProgress,
  onRecordLoad,
  onUpdateExercise,
}: TrainingSplitProps) {
  const progress = sessionProgress(plan, log);
  const [detailState, setDetailState] = useState<DetailState | null>(null);
  const [exerciseTransition, setExerciseTransition] = useState<ExerciseTransitionState | null>(null);
  const transitionTimer = useExerciseTimer(`between-exercises:${split}`);
  const exerciseElements = useRef(new Map<string, HTMLDivElement>());

  const catalogById = useMemo(
    () =>
      catalog.reduce<Record<string, ExerciseCatalogItem>>((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {}),
    [catalog],
  );

  const exercises = useMemo(() => {
    const items = [...plan.pm];
    return items.sort((a, b) => {
      const doneA = log?.doneExercises.includes(a.id) ?? false;
      const doneB = log?.doneExercises.includes(b.id) ?? false;
      if (doneA === doneB) return 0;
      return doneA ? 1 : -1;
    });
  }, [plan.pm, log?.doneExercises]);

  const combinedItems: CombinedItem[] = useMemo(() => {
    const cardioItems: CombinedItem[] = plan.am.map((block) => ({
      kind: "cardio",
      id: block.id,
      label: block.kind,
      detail: `${block.minutes} min`,
      done: log?.completedCardio.includes(block.id) ?? false,
    }));
    const exerciseItems: CombinedItem[] = exercises.map((exercise) => ({
      kind: "exercise",
      exercise,
      done: log?.doneExercises.includes(exercise.id) ?? false,
      setsCompleted: log?.setProgress[exercise.id] ?? (log?.doneExercises.includes(exercise.id) ? exercise.sets : 0),
    }));
    return [...cardioItems, ...exerciseItems];
  }, [plan.am, exercises, log?.completedCardio, log?.doneExercises, log?.setProgress]);

  const detailExercise = useMemo(() => {
    if (!detailState) return undefined;
    return plan.pm.find((exercise) => exercise.id === detailState.id);
  }, [detailState, plan.pm]);

  const detailCatalog = detailExercise?.catalogId ? catalogById[detailExercise.catalogId] : undefined;
  const rawLabel = preferences.splitLabels?.[split] ?? defaultSplitLabels[split] ?? "";
  const splitLabel = rawLabel.trim();
  const transitionIsActive = transitionTimer.phase === "resting" || transitionTimer.phase === "rest-paused";
  const persistedTransitionTarget = transitionTimer.context?.targetExerciseId
    ? plan.pm.find((exercise) => exercise.id === transitionTimer.context?.targetExerciseId)
    : undefined;
  const fallbackTransitionTarget = transitionIsActive
    ? plan.pm.find((exercise) => {
        const completed = log?.setProgress[exercise.id] ?? 0;
        return completed < exercise.sets && !log?.doneExercises.includes(exercise.id);
      })
    : undefined;
  const transitionTarget = exerciseTransition?.split === split
    ? plan.pm.find((exercise) => exercise.id === exerciseTransition.targetId)
    : persistedTransitionTarget ?? fallbackTransitionTarget;
  const transitionDurationSec = exerciseTransition?.split === split
    ? exerciseTransition.durationSec
    : transitionTimer.context?.durationSec ?? 90;

  const handleExerciseCompleted = (exerciseId: string) => {
    const currentIndex = plan.pm.findIndex((exercise) => exercise.id === exerciseId);
    const orderedCandidates = currentIndex >= 0
      ? [...plan.pm.slice(currentIndex + 1), ...plan.pm.slice(0, currentIndex)]
      : plan.pm;
    const nextExercise = orderedCandidates.find((exercise) => {
      if (exercise.id === exerciseId) return false;
      const completed = log?.setProgress[exercise.id] ?? 0;
      return completed < exercise.sets && !log?.doneExercises.includes(exercise.id);
    });
    if (!nextExercise) {
      transitionTimer.clearTimer();
      setExerciseTransition(null);
      return;
    }
    const sourceExercise = plan.pm.find((exercise) => exercise.id === exerciseId);
    const durationSec = sourceExercise?.exerciseRestSec ?? 90;
    setExerciseTransition({
      split,
      targetId: nextExercise.id,
      durationSec,
    });
    transitionTimer.startRest(durationSec, {
      targetExerciseId: nextExercise.id,
      durationSec,
    });
  };

  const handleStartNextExercise = () => {
    if (!transitionTarget) return;
    transitionTimer.clearTimer();
    setExerciseTransition(null);
    startExerciseTimer(transitionTarget.id);
    window.requestAnimationFrame(() => {
      exerciseElements.current.get(transitionTarget.id)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  const handleSeriesStarted = () => {
    if (!transitionIsActive) return;
    transitionTimer.clearTimer();
    setExerciseTransition(null);
  };

  return (
    <section className="training-split">
      <header className="training-split__header">
        <div>
          <h3>
            Treino {split}
            {splitLabel ? ` · ${splitLabel}` : ""}          </h3>
          <p>
            {plan.am.length > 0 && plan.pm.length > 0
              ? "Cardio pela manhã · Musculação à tarde"
              : plan.am.length > 0
              ? "Cardio"
              : plan.pm.length > 0
              ? "Musculação"
              : "Nenhum bloco cadastrado"}
          </p>
        </div>
        <span className="training-split__progress">{Math.round(progress * 100)}%</span>
      </header>

      {transitionIsActive && transitionTarget && (
        <div className="training-split__transition" role="status" aria-live="polite">
          <div className="training-split__transitionInfo">
            <span>Descanso entre exercícios</span>
            <strong>{formatSeconds(transitionTimer.restRemainingSec)}</strong>
            <small>Próximo: {transitionTarget.name}</small>
          </div>
          <div className="training-split__transitionActions">
            {transitionTimer.phase === "resting" ? (
              <button type="button" className="training-split__sessionSecondary" onClick={transitionTimer.pauseRest}>
                Pausar descanso
              </button>
            ) : (
              <>
                <button type="button" className="training-split__sessionSecondary" onClick={transitionTimer.resumeRest}>
                  Retomar descanso
                </button>
                <button
                  type="button"
                  className="training-split__sessionSecondary"
                  onClick={() => transitionTimer.startRest(transitionDurationSec, {
                    targetExerciseId: transitionTarget.id,
                    durationSec: transitionDurationSec,
                  })}
                >
                  Reiniciar descanso
                </button>
              </>
            )}
            <button type="button" className="training-split__play" onClick={handleStartNextExercise}>
              Iniciar próximo exercício agora
            </button>
          </div>
        </div>
      )}

      {preferences.mergeParts ? (
        <div className="training-split__combined">
          {combinedItems.length === 0 && (
            <p className="training-split__empty">Nenhum bloco cadastrado para este dia.</p>
          )}
          {combinedItems.map((item) =>
            item.kind === "cardio" ? (
              <CardioItem
                key={item.id}
                label={item.label}
                detail={item.detail}
                done={item.done}
                onToggle={() => onToggleCardio(split, item.id)}
              />
            ) : (
              <ExerciseItem
                key={item.exercise.id}
                exercise={item.exercise}
                done={item.done}
                setsCompleted={item.setsCompleted}
                catalogInfo={catalogById[item.exercise.catalogId ?? ""]}
                displayFormat={preferences.displayFormat}
                onOpenDetails={() => setDetailState(createDetailState(item.exercise))}
                onSetProgress={(sets) => onSetSetProgress(split, item.exercise.id, sets)}
                onExerciseCompleted={() => handleExerciseCompleted(item.exercise.id)}
                onSeriesStarted={handleSeriesStarted}
                elementRef={(element) => {
                  if (element) exerciseElements.current.set(item.exercise.id, element);
                  else exerciseElements.current.delete(item.exercise.id);
                }}
              />
            ),
          )}
        </div>
      ) : (
        <>
          {plan.am.length > 0 && (
            <div className="training-split__block">
              <div className="training-split__blockHeader">
                <strong>{plan.pm.length > 0 ? "Parte 1 · Cardio" : "Cardio"}</strong>
                <button type="button" onClick={() => onTogglePart(split, "am")}>
                  {log?.amDone ? "Reabrir" : "Concluir parte"}
                </button>
              </div>
              <ul className="training-split__list">
                {plan.am.map((block) => (
                  <li key={block.id}>
                    <CardioItem
                      label={block.kind}
                      detail={`${block.minutes} min`}
                      done={log?.completedCardio.includes(block.id) ?? false}
                      onToggle={() => onToggleCardio(split, block.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.pm.length > 0 && (
            <div className="training-split__block">
              <div className="training-split__blockHeader">
                <strong>{plan.am.length > 0 ? "Parte 2 · Musculação" : "Musculação"}</strong>
                <button type="button" onClick={() => onTogglePart(split, "pm")}>
                  {log?.pmDone ? "Reabrir" : "Concluir parte"}
                </button>
              </div>
              <ul className="training-split__exercises">
                {exercises.map((exercise) => (
                  <li key={exercise.id}>
                    <ExerciseItem
                      exercise={exercise}
                      done={log?.doneExercises.includes(exercise.id) ?? false}
                      setsCompleted={log?.setProgress[exercise.id] ?? (log?.doneExercises.includes(exercise.id) ? exercise.sets : 0)}
                      catalogInfo={catalogById[exercise.catalogId ?? ""]}
                      displayFormat={preferences.displayFormat}
                      onOpenDetails={() => setDetailState(createDetailState(exercise))}
                      onSetProgress={(sets) => onSetSetProgress(split, exercise.id, sets)}
                      onExerciseCompleted={() => handleExerciseCompleted(exercise.id)}
                      onSeriesStarted={handleSeriesStarted}
                      elementRef={(element) => {
                        if (element) exerciseElements.current.set(exercise.id, element);
                        else exerciseElements.current.delete(exercise.id);
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {isToday(log ?? { dateISO: "", split, amDone: false, pmDone: false, doneExercises: [], completedCardio: [], setProgress: {} }) && (
        <footer className="training-split__footer">Treino de hoje</footer>
      )}

      {detailExercise && detailState && (
        <ExerciseDetail
          exercise={detailExercise}
          catalogInfo={detailCatalog}
          substitutions={(detailExercise.substitutions ?? [])
            .map((id) => catalogById[id])
            .filter((item): item is ExerciseCatalogItem => Boolean(item))}
          onClose={() => setDetailState(null)}
          notes={detailState.notes}
          load={detailState.load}
          equipment={detailState.equipment}
          completedSets={
            log?.setProgress[detailExercise.id] ??
            (log?.doneExercises.includes(detailExercise.id) ? detailExercise.sets : 0)
          }
          onNotesChange={(value) => setDetailState((prev) => (prev ? { ...prev, notes: value } : prev))}
          onLoadChange={(value) => setDetailState((prev) => (prev ? { ...prev, load: value } : prev))}
          onEquipmentChange={(equipment) =>
            setDetailState((prev) => {
              if (!prev) return prev;
              const equipmentLoad = getExerciseLoadForEquipment(detailExercise, equipment);
              return {
                ...prev,
                equipment,
                load: equipmentLoad != null ? String(equipmentLoad) : "",
              };
            })
          }
          onSaveNotes={() => onUpdateExercise(split, detailExercise.id, { notes: detailState.notes.trim() || undefined })}
          onRegisterLoad={() => {
            const loadValue = Number(detailState.load);
            if (!Number.isFinite(loadValue) || loadValue <= 0) return;
            onRecordLoad(
              split,
              detailExercise.id,
              loadValue,
              log?.setProgress[detailExercise.id] ??
                (log?.doneExercises.includes(detailExercise.id) ? detailExercise.sets : 0),
              detailState.equipment,
            );
            setDetailState((prev) => (prev ? { ...prev, load: "" } : prev));
          }}
        />
      )}
    </section>
  );
}

type CardioItemProps = {
  label: string;
  detail: string;
  done: boolean;
  onToggle: () => void;
};

function CardioItem({ label, detail, done, onToggle }: CardioItemProps) {
  return (
    <button
      type="button"
      className={`training-split__cardio ${done ? "training-split__cardio--done" : ""}`}
      onClick={onToggle}
    >
      <div>
        <span className="training-split__cardioLabel">{label}</span>
        <span className="training-split__cardioDetail">{detail}</span>
      </div>
      <span className="training-split__status">{done ? "✓" : "○"}</span>
    </button>
  );
}

type ExerciseItemProps = {
  exercise: Exercise;
  done: boolean;
  setsCompleted: number;
  catalogInfo?: ExerciseCatalogItem;
  displayFormat: TrainingPreferences["displayFormat"];
  onOpenDetails: () => void;
  onSetProgress: (sets: number) => void;
  onExerciseCompleted: () => void;
  onSeriesStarted: () => void;
  elementRef: (element: HTMLDivElement | null) => void;
};

function ExerciseItem({
  exercise,
  done,
  setsCompleted,
  catalogInfo,
  displayFormat,
  onOpenDetails,
  onSetProgress,
  onExerciseCompleted,
  onSeriesStarted,
  elementRef,
}: ExerciseItemProps) {
  const detail = formatExerciseDetail(exercise, displayFormat);
  const muscles = resolveMuscles(exercise, catalogInfo);
  const mediaUrls = resolveExerciseMedia(exercise, catalogInfo);
  const [showControls, setShowControls] = useState(() => setsCompleted > 0);
  const timer = useExerciseTimer(exercise.id);
  const timerPhase = timer.phase;
  const clearExerciseTimer = timer.clearTimer;

  useEffect(() => {
    if (setsCompleted > 0) {
      setShowControls(true);
    }
  }, [setsCompleted]);

  const progressPercent = Math.min(100, Math.round((setsCompleted / Math.max(exercise.sets, 1)) * 100));
  const isCompleted = setsCompleted >= exercise.sets;
  const currentSeries = Math.min(setsCompleted + 1, exercise.sets);

  useEffect(() => {
    if (isCompleted && timerPhase) clearExerciseTimer();
  }, [clearExerciseTimer, isCompleted, timerPhase]);

  const handleCompleteSeries = () => {
    setShowControls(true);
    if (isCompleted) return;
    const nextValue = Math.min(setsCompleted + 1, exercise.sets);
    onSetProgress(nextValue);
    if (nextValue < exercise.sets) {
      timer.startRest(exercise.restSec ?? 60);
    } else {
      timer.clearTimer();
      onExerciseCompleted();
    }
  };

  const handleSetChange = (value: number) => {
    setShowControls(true);
    timer.clearTimer();
    onSetProgress(value);
    if (value >= exercise.sets && setsCompleted < exercise.sets) {
      onExerciseCompleted();
    }
  };

  const handleStartSeries = () => {
    onSeriesStarted();
    timer.startSeries();
  };

  return (
    <div
      className={`training-split__exercise ${done ? "training-split__exercise--done" : ""}`}
      style={muscleAccentStyle(muscles[0])}
      ref={elementRef}
    >
      <button
        type="button"
        className="training-split__detailButton"
        onClick={onOpenDetails}
        aria-label="Ver detalhes do exercício"
      >
        ℹ️
      </button>
      <div className="training-split__exerciseMain">
        <div className="training-split__exerciseMedia">
          {mediaUrls.length > 0 ? (
            <TrainingMediaGallery
              exerciseName={exercise.name}
              urls={mediaUrls}
              variant="compact"
            />
          ) : (
            <span className="training-split__exercisePlaceholder">Sem imagem</span>
          )}
        </div>
        <div className="training-split__exerciseInfo">
          <div className="training-split__exerciseContent">
            <div className="training-split__exerciseHeading">
              <div className="training-split__exerciseMeta">
                <span className="training-split__exerciseName">{exercise.name}</span>
                {muscles.length > 0 && (
                  <span className="training-split__exerciseMuscles">
                    {muscles.map((muscle) => <MuscleBadge key={muscle} muscle={muscle} />)}
                  </span>
                )}
                <span className="training-split__exerciseDetail">{detail}</span>
              </div>
            </div>
            {(timer.phase === "working" || timer.phase === "work-paused") && !isCompleted && (
              <div className="training-split__seriesNotice">
                <strong>
                  Série {currentSeries} {timer.phase === "work-paused" ? "pausada" : "em andamento"}
                </strong>
                <span>{formatSeconds(timer.seriesElapsedSec)}</span>
              </div>
            )}
            {(timer.phase === "resting" || timer.phase === "rest-paused") && !isCompleted && (
              <div className="training-split__restNotice">
                <strong>
                  Descanso entre séries {timer.phase === "rest-paused" ? "pausado" : ""}
                </strong>
                <span>{formatSeconds(timer.restRemainingSec)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="training-split__sessionActions">
            {isCompleted ? (
              <button type="button" className="training-split__play training-split__play--done" disabled>
                <span aria-hidden="true">✓</span>
                <span>Concluído</span>
              </button>
            ) : timer.phase === "working" ? (
              <>
                <button type="button" className="training-split__sessionSecondary" onClick={timer.pauseSeries}>Pausar série</button>
                <button type="button" className="training-split__sessionSecondary" onClick={timer.restartSeries}>Reiniciar</button>
                <button type="button" className="training-split__play" onClick={handleCompleteSeries}>Concluir série</button>
              </>
            ) : timer.phase === "work-paused" ? (
              <>
                <button type="button" className="training-split__sessionSecondary" onClick={timer.resumeSeries}>Retomar série</button>
                <button type="button" className="training-split__sessionSecondary" onClick={timer.restartSeries}>Reiniciar</button>
                <button type="button" className="training-split__play" onClick={handleCompleteSeries}>Concluir série</button>
              </>
            ) : timer.phase === "resting" ? (
              <>
                <button type="button" className="training-split__sessionSecondary" onClick={timer.pauseRest}>Pausar descanso</button>
                <button type="button" className="training-split__play" onClick={handleStartSeries}>Iniciar próxima série agora</button>
              </>
            ) : timer.phase === "rest-paused" ? (
              <>
                <button type="button" className="training-split__sessionSecondary" onClick={timer.resumeRest}>Retomar descanso</button>
                <button type="button" className="training-split__sessionSecondary" onClick={() => timer.startRest(exercise.restSec ?? 60)}>Reiniciar descanso</button>
                <button type="button" className="training-split__play" onClick={handleStartSeries}>Iniciar próxima série agora</button>
              </>
            ) : (
              <button type="button" className="training-split__play" onClick={handleStartSeries}>
                <span aria-hidden="true">▶️</span>
                <span>Iniciar série {currentSeries}</span>
              </button>
            )}
      </div>
      {showControls && (
        <div className="training-split__exerciseControls">
          <SetCounter total={exercise.sets} completed={setsCompleted} onChange={handleSetChange} />
          <div className="training-split__exerciseProgress">
            <div className="training-split__exerciseProgressBar" aria-hidden="true">
              <div className="training-split__exerciseProgressFill" style={{ width: `${progressPercent}%` }} />
            </div>
            <span className="training-split__exerciseProgressText">
              {setsCompleted} de {exercise.sets} séries
            </span>
          </div>
        </div>
      )}
      {exercise.notes && <span className="training-split__exerciseNote">Obs.: {exercise.notes}</span>}
    </div>
  );
}

type SetCounterProps = {
  total: number;
  completed: number;
  onChange: (value: number) => void;
};

function SetCounter({ total, completed, onChange }: SetCounterProps) {
  const circles = [];
  for (let i = 1; i <= total; i += 1) {
    const active = completed >= i;
    circles.push(
      <button
        key={i}
        type="button"
        className={`training-split__set ${active ? "training-split__set--active" : ""}`}
        onClick={() => onChange(active && completed === i ? i - 1 : i)}
        aria-label={`Definir ${i} ${i === 1 ? "série concluída" : "séries concluídas"}`}
      >
        {i}
      </button>,
    );
  }

  return <div className="training-split__sets">{circles}</div>;
}

type ExerciseDetailProps = {
  exercise: Exercise;
  catalogInfo?: ExerciseCatalogItem;
  substitutions: ExerciseCatalogItem[];
  notes: string;
  load: string;
  equipment: EquipmentType;
  completedSets: number;
  onNotesChange: (value: string) => void;
  onLoadChange: (value: string) => void;
  onEquipmentChange: (value: EquipmentType) => void;
  onSaveNotes: () => void;
  onRegisterLoad: () => void;
  onClose: () => void;
};

function ExerciseDetail({
  exercise,
  catalogInfo,
  substitutions,
  notes,
  load,
  equipment,
  completedSets,
  onNotesChange,
  onLoadChange,
  onEquipmentChange,
  onSaveNotes,
  onRegisterLoad,
  onClose,
}: ExerciseDetailProps) {
  const muscles = resolveMuscles(exercise, catalogInfo);
  const mediaUrls = resolveExerciseMedia(exercise, catalogInfo);
  const loadHistory = [...(exercise.loadHistory ?? [])].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));
  const loadSuggestion = getLoadProgressionSuggestion(exercise, completedSets, muscles, equipment);

  return (
    <div className="training-detail" role="dialog" aria-modal="true">
      <div className="training-detail__card">
        <div className="training-detail__header">
          <h4>{exercise.name}</h4>
          <button type="button" onClick={onClose} aria-label="Fechar detalhes">
            ×
          </button>
        </div>
        {muscles.length > 0 && (
          <div className="training-detail__muscles">
            <span>Ativação</span>
            <div className="training-detail__muscleBadges">
              {muscles.map((muscle) => <MuscleBadge key={muscle} muscle={muscle} />)}
            </div>
          </div>
        )}
        {mediaUrls.length > 0 && (
          <TrainingMediaGallery exerciseName={exercise.name} urls={mediaUrls} />
        )}
        <div className="training-detail__section">
          <h5>Observações</h5>
          <textarea value={notes} onChange={(e) => onNotesChange(e.target.value)} rows={3} />
          <div className="training-detail__actions">
            <button type="button" onClick={onSaveNotes}>
              Salvar observações
            </button>
          </div>
        </div>
        <div className="training-detail__section">
          <h5>Registro de carga</h5>
          <label className="training-detail__equipment">
            Equipamento usado
            <select
              value={equipment}
              onChange={(event) => onEquipmentChange(event.target.value as EquipmentType)}
            >
              {(Object.entries(equipmentLabels) as [EquipmentType, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <small>{equipmentLoadHints[equipment]}</small>
          </label>
          <div className={`training-detail__loadSuggestion training-detail__loadSuggestion--${loadSuggestion.status}`}>
            <strong>Progressão sugerida · {equipmentLabels[equipment]}</strong>
            {loadSuggestion.status === "increase" && loadSuggestion.suggestedKg ? (
              <>
                <span>
                  {loadSuggestion.currentKg?.toFixed(1)} kg → {loadSuggestion.suggestedKg.toFixed(1)} kg
                  {loadSuggestion.percentage ? ` (+${loadSuggestion.percentage}%)` : ""}
                </span>
                <p>{loadSuggestion.message}</p>
                <button type="button" onClick={() => onLoadChange(String(loadSuggestion.suggestedKg))}>
                  Usar sugestão no campo
                </button>
              </>
            ) : (
              <p>{loadSuggestion.message}</p>
            )}
            {loadSuggestion.daysSinceLastRecord != null && (
              <small>
                Último registro: {loadSuggestion.daysSinceLastRecord === 0 ? "hoje" : `há ${loadSuggestion.daysSinceLastRecord} dia(s)`}
              </small>
            )}
          </div>
          <div className="training-detail__formRow">
            <input
              value={load}
              onChange={(e) => onLoadChange(e.target.value)}
              type="number"
              step={0.5}
              min={0}
              placeholder="Peso em kg"
            />
            <button type="button" onClick={onRegisterLoad}>
              Registrar
            </button>
          </div>
          {loadHistory.length === 0 ? (
            <p className="training-detail__empty">Ainda sem histórico de cargas.</p>
          ) : (
            <ul className="training-detail__history">
              {loadHistory.map((entry, index) => (
                <li key={`${entry.dateISO}-${entry.loadKg}-${entry.equipment ?? "legacy"}-${index}`}>
                  <span>
                    {new Date(entry.dateISO).toLocaleDateString("pt-BR")}
                    <small>{entry.equipment ? equipmentLabels[entry.equipment] : "Equipamento não identificado"}</small>
                  </span>
                  <strong>{entry.loadKg.toFixed(1)} kg</strong>
                </li>
              ))}
            </ul>
          )}
        </div>
        {substitutions.length > 0 && (
          <div className="training-detail__section">
            <h5>Substituições sugeridas</h5>
            <ul className="training-detail__substitutions">
              {substitutions.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function formatSeconds(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "00:00";
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function formatExerciseDetail(exercise: Exercise, format: TrainingPreferences["displayFormat"]) {
  const latestLoad = [...(exercise.loadHistory ?? [])]
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO))
    .at(-1);
  const loadValue = latestLoad?.loadKg ?? exercise.loadKg;
  const loadText = loadValue != null
    ? `${loadValue.toFixed(1)} kg${latestLoad?.equipment ? ` · ${equipmentLabels[latestLoad.equipment]}` : ""}`
    : undefined;
  if (format === "inline") {
    return [
      `${exercise.sets} x ${exercise.reps}`,
      `descanso ${exercise.restSec}s`,
      loadText,
    ]
      .filter(Boolean)
      .join(" • ");
  }
  return [`${exercise.sets} séries`, `${exercise.reps} reps`, `descanso ${exercise.restSec}s`, loadText]
    .filter(Boolean)
    .join(" · ");
}

function resolveMuscles(exercise: Exercise, info?: ExerciseCatalogItem) {
  const muscles = new Set<string>();
  exercise.muscles?.forEach((muscle) => muscle && muscles.add(muscle));
  exercise.secondaryMuscles?.forEach((muscle) => muscle && muscles.add(muscle));
  if (info?.muscle) muscles.add(info.muscle);
  info?.muscles?.forEach((muscle) => muscle && muscles.add(muscle));
  info?.secondaryMuscles?.forEach((muscle) => muscle && muscles.add(muscle));
  return Array.from(muscles);
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-split {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.training-split__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  gap: 12px;
  margin: 0;
  padding: 0;
}
.training-split__cardio {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: white;
  padding: 12px 14px;
  text-align: left;
  color: inherit;
}
.training-split__cardio--done {
  border-color: rgba(37, 99, 235, 0.6);
  background: rgba(37, 99, 235, 0.08);
}
.training-split__cardioLabel {
  font-weight: 600;
}
.training-split__cardioDetail {
  display: block;
  color: #64748b;
  font-size: 0.85rem;
}
.training-split__status {
  font-size: 1.3rem;
  color: #2563eb;
}
.training-split__exercise {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-left: 5px solid var(--muscle-color, #94a3b8);
  border-radius: 16px;
  padding: 16px;
  background: white;
  max-width: 100%;
  overflow: hidden;
}
.training-split__exercise--done {
  border-color: rgba(37, 99, 235, 0.6);
  background: rgba(37, 99, 235, 0.08);
}
.training-split__exerciseMain {
  display: flex;
  gap: 16px;
  align-items: stretch;
}
.training-split__exerciseMedia {
  width: 96px;
  height: 96px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.15);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 1px solid rgba(148, 163, 184, 0.3);
}
.training-split__exercisePlaceholder {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  padding: 0 8px;
}
.training-split__exerciseInfo {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 96px;
}
.training-split__exerciseContent {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 72px;
}
.training-split__exerciseHeading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.training-split__exerciseMeta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.training-split__exerciseName {
  font-weight: 700;
  overflow-wrap: anywhere;
}
.training-split__exerciseMuscles,
.training-detail__muscleBadges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.training-split__exerciseDetail {
  font-size: 0.85rem;
  color: #475569;
}
.training-split__detailButton {
  position: absolute;
  top: 16px;
  right: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: rgba(248, 250, 252, 0.9);
  cursor: pointer;
}
.training-split__play {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  background: #2563eb;
  color: white;
  padding: 6px 14px;
  font-weight: 600;
  box-shadow: 0 10px 20px -12px rgba(37, 99, 235, 0.8);
  cursor: pointer;
  align-self: flex-end;
  margin-top: auto;
}
.training-split__play--done {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: none;
  cursor: default;
}
.training-split__sessionActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  width: 100%;
}
.training-split__sessionActions button {
  min-width: 0;
  max-width: 100%;
  white-space: normal;
  text-align: center;
}
.training-split__sessionActions .training-split__play {
  margin-top: 0;
}
.training-split__sessionSecondary {
  border: 1px solid rgba(37, 99, 235, 0.28);
  border-radius: 999px;
  padding: 6px 11px;
  background: rgba(219, 234, 254, 0.6);
  color: #1d4ed8;
  font-size: 0.82rem;
  font-weight: 700;
}
.training-split__seriesNotice,
.training-split__restNotice {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 8px;
  border-radius: 10px;
  padding: 6px 9px;
  font-size: 0.85rem;
  color: #2563eb;
  background: rgba(219, 234, 254, 0.62);
}
.training-split__seriesNotice span,
.training-split__restNotice span {
  min-width: 48px;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  text-align: right;
}
.training-split__exerciseControls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
  padding-top: 12px;
}
.training-split__sets {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.training-split__set {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  width: 32px;
  height: 32px;
  flex: 0 0 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
  font-size: 0.85rem;
  background: rgba(248, 250, 252, 0.9);
}
.training-split__set--active {
  border-color: rgba(37, 99, 235, 0.6);
  background: rgba(37, 99, 235, 0.15);
  color: #1d4ed8;
}
.training-split__exerciseProgress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.training-split__exerciseProgressBar {
  position: relative;
  height: 8px;
  background: rgba(148, 163, 184, 0.25);
  border-radius: 999px;
  overflow: hidden;
}
.training-split__exerciseProgressFill {
  position: absolute;
  inset: 0;
  width: 0;
  background: #2563eb;
  border-radius: 999px;
  transition: width 0.4s ease;
}
.training-split__exerciseProgressText {
  font-size: 0.85rem;
  color: #475569;
  font-weight: 600;
}
.training-split__exerciseNote {
  font-size: 0.8rem;
  color: #475569;
}
.training-split__footer {
  align-self: flex-start;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
}
.training-split__combined {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.training-split__empty {
  color: #94a3b8;
}
.training-detail {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 20;
}
.training-detail__card {
  width: min(520px, 100%);
  background: white;
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 90vh;
  overflow: auto;
}
.training-detail__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.training-detail__header h4 {
  margin: 0;
}
.training-detail__header button {
  border: none;
  background: transparent;
  font-size: 1.5rem;
  line-height: 1;
}
.training-detail__muscles {
  margin: 0;
  color: #475569;
  display: flex;
  flex-direction: column;
  gap: 7px;
  font-size: 0.85rem;
  font-weight: 700;
}
.training-split__transition {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(37, 99, 235, 0.35);
  border-radius: 16px;
  background: rgba(219, 234, 254, 0.72);
}
.training-split__transitionInfo {
  display: grid;
  grid-template-columns: auto auto;
  align-items: center;
  gap: 3px 12px;
  min-width: 0;
}
.training-split__transitionInfo > span {
  color: #1d4ed8;
  font-weight: 800;
}
.training-split__transitionInfo > strong {
  color: #1d4ed8;
  font-size: 1.35rem;
  font-variant-numeric: tabular-nums;
}
.training-split__transitionInfo > small {
  grid-column: 1 / -1;
  color: #475569;
}
.training-split__transitionActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}
.training-split__transitionActions .training-split__play {
  align-self: center;
  margin: 0;
}
.training-detail__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.training-detail__section h5 {
  margin: 0;
  font-size: 1rem;
}
.training-detail__actions {
  display: flex;
  justify-content: flex-end;
}
.training-detail__formRow {
  display: flex;
  gap: 8px;
}
.training-detail__formRow input {
  flex: 1;
}
.training-detail__equipment {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.training-detail__equipment small {
  color: #64748b;
  font-weight: 400;
}
.training-detail__loadSuggestion {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.85);
}
.training-detail__loadSuggestion p {
  margin: 0;
  color: #475569;
  font-size: 0.88rem;
}
.training-detail__loadSuggestion > span {
  color: #166534;
  font-size: 1.05rem;
  font-weight: 800;
}
.training-detail__loadSuggestion small {
  color: #64748b;
}
.training-detail__loadSuggestion button {
  align-self: flex-start;
}
.training-detail__loadSuggestion--increase {
  border-color: rgba(34, 197, 94, 0.38);
  background: rgba(220, 252, 231, 0.65);
}
.training-detail__empty {
  color: #94a3b8;
  font-size: 0.9rem;
}
.training-detail__history {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.training-detail__history li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
}
.training-detail__history li > span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.training-detail__history li small {
  color: #64748b;
  font-size: 0.75rem;
}
.training-detail__substitutions {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
@media (max-width: 640px) {
  .training-split {
    padding: 12px;
  }
  .training-split__exercise {
    padding: 12px;
  }
  .training-split__exerciseMain {
    gap: 12px;
  }
  .training-split__exerciseMedia {
    width: min(96px, 32vw);
    height: min(96px, 32vw);
  }
  .training-split__exerciseContent {
    padding-right: 42px;
  }
  .training-split__sessionActions {
    justify-content: stretch;
  }
  .training-split__sessionActions button {
    flex: 1 1 100%;
    width: 100%;
    justify-content: center;
  }
  .training-split__transition {
    align-items: stretch;
    flex-direction: column;
  }
  .training-split__transitionActions {
    flex-direction: column;
  }
  .training-split__transitionActions button {
    width: 100%;
    justify-content: center;
  }
  .training-detail__formRow {
    flex-direction: column;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}
