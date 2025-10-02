import { useEffect, useMemo, useState } from "react";
import type { Split, TrainingTemplate, TrainingLog, Exercise } from "./training.schema";
import { sessionProgress, isToday } from "./training.service";
import type { ExerciseCatalogItem, TrainingPreferences } from "./training.store";

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
  catalog: ExerciseCatalogItem[];
  preferences: TrainingPreferences;
  onTogglePart: (split: Split, part: "am" | "pm") => void;
  onToggleCardio: (split: Split, id: string) => void;
  onSetSetProgress: (split: Split, id: string, setsCompleted: number) => void;
  onRecordLoad: (split: Split, id: string, loadKg: number) => void;
  onUpdateExercise: (split: Split, id: string, patch: Partial<Exercise>) => void;
};

type CombinedItem =
  | { kind: "cardio"; id: string; label: string; detail: string; done: boolean }
  | { kind: "exercise"; exercise: Exercise; done: boolean; setsCompleted: number };

type DetailState = {
  id: string;
  notes: string;
  load: string;
};

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

  return (
    <section className="training-split">
      <header className="training-split__header">
        <div>
          <h3>
            Treino {split} · {splitTitles[split]}
          </h3>
          <p>
            {plan.am.length > 0 && "Cardio pela manhã"}
            {plan.am.length > 0 && plan.pm.length > 0 && " · "}
            {plan.pm.length > 0 && "Musculação à tarde"}
          </p>
        </div>
        <span className="training-split__progress">{Math.round(progress * 100)}%</span>
      </header>

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
                onOpenDetails={() =>
                  setDetailState({
                    id: item.exercise.id,
                    notes: item.exercise.notes ?? "",
                    load: item.exercise.loadKg != null ? String(item.exercise.loadKg) : "",
                  })
                }
                onSetProgress={(sets) => onSetSetProgress(split, item.exercise.id, sets)}
              />
            ),
          )}
        </div>
      ) : (
        <>
          {plan.am.length > 0 && (
            <div className="training-split__block">
              <div className="training-split__blockHeader">
                <strong>Parte 1 · Cardio</strong>
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
                <strong>Parte 2 · Musculação</strong>
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
                      onOpenDetails={() =>
                        setDetailState({
                          id: exercise.id,
                          notes: exercise.notes ?? "",
                          load: exercise.loadKg != null ? String(exercise.loadKg) : "",
                        })
                      }
                      onSetProgress={(sets) => onSetSetProgress(split, exercise.id, sets)}
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
          onNotesChange={(value) => setDetailState((prev) => (prev ? { ...prev, notes: value } : prev))}
          onLoadChange={(value) => setDetailState((prev) => (prev ? { ...prev, load: value } : prev))}
          onSaveNotes={() => onUpdateExercise(split, detailExercise.id, { notes: detailState.notes.trim() || undefined })}
          onRegisterLoad={() => {
            const loadValue = Number(detailState.load);
            if (!Number.isFinite(loadValue) || loadValue <= 0) return;
            onRecordLoad(split, detailExercise.id, loadValue);
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
};

function ExerciseItem({
  exercise,
  done,
  setsCompleted,
  catalogInfo,
  displayFormat,
  onOpenDetails,
  onSetProgress,
}: ExerciseItemProps) {
  const detail = formatExerciseDetail(exercise, displayFormat);
  const muscles = resolveMuscles(exercise, catalogInfo);
  const gif = exercise.gifUrl ?? catalogInfo?.gifUrl;
  const [showControls, setShowControls] = useState(() => setsCompleted > 0);
  const [restRemaining, setRestRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (setsCompleted > 0) {
      setShowControls(true);
    }
    if (setsCompleted >= exercise.sets) {
      setRestRemaining(null);
    }
  }, [setsCompleted, exercise.sets]);

  useEffect(() => {
    if (restRemaining == null || restRemaining <= 0) return;
    const interval = window.setInterval(() => {
      setRestRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [restRemaining]);

  const progressPercent = Math.min(100, Math.round((setsCompleted / Math.max(exercise.sets, 1)) * 100));
  const isResting = restRemaining != null && restRemaining > 0;
  const isCompleted = setsCompleted >= exercise.sets;

  const handlePlay = () => {
    setShowControls(true);
    if (isCompleted) return;
    const nextValue = Math.min(setsCompleted + 1, exercise.sets);
    onSetProgress(nextValue);
    if (nextValue < exercise.sets) {
      setRestRemaining(exercise.restSec ?? 60);
    } else {
      setRestRemaining(null);
    }
  };

  const handleSetChange = (value: number) => {
    setShowControls(true);
    onSetProgress(value);
    if (value >= exercise.sets || value < setsCompleted) {
      setRestRemaining(null);
    }
  };

  const playLabel = isCompleted
    ? "Concluído"
    : setsCompleted === 0
    ? "Iniciar série"
    : "Próxima série";
  const playIcon = isCompleted ? "✓" : "▶️";

  return (
    <div className={`training-split__exercise ${done ? "training-split__exercise--done" : ""}`}>
      <div className="training-split__exerciseMain">
        <div className="training-split__exerciseMedia">
          {gif ? (
            <img src={gif} alt={exercise.name} className="training-split__exerciseImage" loading="lazy" />
          ) : (
            <span className="training-split__exercisePlaceholder">Sem imagem</span>
          )}
        </div>
        <div className="training-split__exerciseContent">
          <div className="training-split__exerciseHeading">
            <div className="training-split__exerciseMeta">
              <span className="training-split__exerciseName">{exercise.name}</span>
              {muscles.length > 0 && <span className="training-split__exerciseMuscle">{muscles.join(", ")}</span>}
              <span className="training-split__exerciseDetail">{detail}</span>
            </div>
            <div className="training-split__exerciseActions">
              <button
                type="button"
                className="training-split__detailButton"
                onClick={onOpenDetails}
                aria-label="Ver detalhes do exercício"
              >
                ℹ️
              </button>
              <button
                type="button"
                className={`training-split__play ${isCompleted ? "training-split__play--done" : ""}`}
                onClick={handlePlay}
              >
                <span aria-hidden="true">{playIcon}</span>
                <span>{playLabel}</span>
              </button>
            </div>
          </div>
          {isResting && !isCompleted && (
            <div className="training-split__restNotice">Descanso: {formatSeconds(restRemaining)}</div>
          )}
        </div>
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
        aria-label={`Marcar série ${i}`}
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
  onNotesChange: (value: string) => void;
  onLoadChange: (value: string) => void;
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
  onNotesChange,
  onLoadChange,
  onSaveNotes,
  onRegisterLoad,
  onClose,
}: ExerciseDetailProps) {
  const muscles = resolveMuscles(exercise, catalogInfo);
  const gif = exercise.gifUrl ?? catalogInfo?.gifUrl;
  const loadHistory = [...(exercise.loadHistory ?? [])].sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  return (
    <div className="training-detail" role="dialog" aria-modal="true">
      <div className="training-detail__card">
        <div className="training-detail__header">
          <h4>{exercise.name}</h4>
          <button type="button" onClick={onClose} aria-label="Fechar detalhes">
            ×
          </button>
        </div>
        {muscles.length > 0 && <p className="training-detail__muscles">Ativação: {muscles.join(", ")}</p>}
        {gif && (
          <div className="training-detail__media">
            <img src={gif} alt={`Demonstração de ${exercise.name}`} />
          </div>
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
              {loadHistory.map((entry) => (
                <li key={`${entry.dateISO}-${entry.loadKg}`}>
                  <span>{new Date(entry.dateISO).toLocaleDateString("pt-BR")}</span>
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
  const loadText = exercise.loadKg != null ? `${exercise.loadKg.toFixed(1)} kg` : undefined;
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
  display: flex;
  flex-direction: column;
  gap: 14px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 16px;
  padding: 16px;
  background: white;
}
.training-split__exercise--done {
  border-color: rgba(37, 99, 235, 0.6);
  background: rgba(37, 99, 235, 0.08);
}
.training-split__exerciseMain {
  display: flex;
  gap: 16px;
  align-items: flex-start;
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
.training-split__exerciseImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.training-split__exercisePlaceholder {
  font-size: 0.75rem;
  color: #64748b;
  text-align: center;
  padding: 0 8px;
}
.training-split__exerciseContent {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
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
}
.training-split__exerciseMuscle {
  font-size: 0.8rem;
  color: #64748b;
}
.training-split__exerciseDetail {
  font-size: 0.85rem;
  color: #475569;
}
.training-split__exerciseActions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.training-split__detailButton {
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 6px 10px;
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
}
.training-split__play--done {
  background: rgba(34, 197, 94, 0.15);
  color: #15803d;
  border-color: rgba(34, 197, 94, 0.4);
  box-shadow: none;
  cursor: default;
}
.training-split__restNotice {
  font-size: 0.85rem;
  color: #2563eb;
  font-weight: 600;
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
  display: grid;
  place-items: center;
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
}
.training-detail__media img {
  width: 100%;
  border-radius: 12px;
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
  font-size: 0.9rem;
}
.training-detail__substitutions {
  margin: 0;
  padding-left: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
@media (max-width: 640px) {
  .training-detail__formRow {
    flex-direction: column;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}