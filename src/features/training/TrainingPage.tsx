import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ProgressBar";
import { Section } from "@/components/Section";
import { parseISODate } from "@/lib/date";
import { defaultSplitLabels, useTraining } from "./training.store";
import {
  getActiveSplits,
  hasTrainingDayStarted,
  isTrainingDayCompleted,
  nextTrainingSplit,
  sessionProgress,
  trainingProgress,
} from "./training.service";
import { TrainingSplit } from "./TrainingSplit";
import { playTrainingRestSound } from "./training.audio";
import type { Split } from "./training.schema";

export default function TrainingPage() {
  const {
    template,
    weekLog,
    toggleSessionPart,
    toggleCardioBlock,
    setExerciseSetProgress,
    recordExerciseLoad,
    resetWeek,
    ensureCurrentWeek,
    preferences,
    setPreferences,
    updatePmExercise,
    catalog,
  } = useTraining();

  const activeSplits = useMemo(
    () => getActiveSplits(preferences.trainingDays),
    [preferences.trainingDays],
  );
  const preferredSplit = activeSplits.includes(preferences.activeSplit)
    ? preferences.activeSplit
    : activeSplits[0];
  const initialSplit = nextTrainingSplit(template, weekLog, activeSplits, preferredSplit);
  const [activeSplit, setActiveSplit] = useState<Split>(initialSplit);
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");
  const [immersiveMode, setImmersiveMode] = useState(false);

  useEffect(() => {
    ensureCurrentWeek();
  }, [ensureCurrentWeek]);

  useEffect(() => {
    if (!activeSplits.includes(activeSplit)) {
      setActiveSplit(activeSplits[0]);
    }
  }, [activeSplit, activeSplits]);

  useEffect(() => {
    if (!immersiveMode) return;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setImmersiveMode(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [immersiveMode]);

  const handleSelectSplit = (split: Split) => {
    setActiveSplit(split);
    setPreferences({ activeSplit: split });
  };

  const summaryProgress = useMemo(
    () => trainingProgress(template, weekLog, activeSplits),
    [activeSplits, template, weekLog],
  );

  const resolveSplitLabel = useCallback(
    (split: Split) =>
      (preferences.splitLabels?.[split] ?? defaultSplitLabels[split] ?? "").trim(),
    [preferences.splitLabels],
  );

  const activePlan = template[activeSplit];
  const activeLog = weekLog.find((log) => log.split === activeSplit);
  const immersiveProgress = sessionProgress(activePlan, activeLog);
  const immersiveCompleted = isTrainingDayCompleted(activePlan, activeLog);
  const immersiveMessage = immersiveCompleted
    ? "Treino completo. Excelente trabalho — você cumpriu tudo o que planejou!"
    : immersiveProgress === 0
    ? "Seu treino está pronto. Comece pelo primeiro bloco e avance uma etapa de cada vez."
    : immersiveProgress < 0.5
    ? "Bom começo. Mantenha o ritmo e continue acumulando séries concluídas."
    : immersiveProgress < 0.85
    ? "Você já passou da metade. Continue firme até completar o treino."
    : "Último esforço. Falta pouco para concluir todo o treino!";

  const timeline = useMemo(
    () =>
      weekLog
        .slice()
        .filter((log) => activeSplits.includes(log.split))
        .sort((a, b) => (a.dateISO > b.dateISO ? 1 : -1))
        .map((log) => {
          const label = resolveSplitLabel(log.split);
          const plan = template[log.split];
          return {
            ...log,
            label: label ? `Treino ${log.split} · ${label}` : `Treino ${log.split}`,
            completed: isTrainingDayCompleted(plan, log),
            started: hasTrainingDayStarted(log),
          };
        }),
    [activeSplits, resolveSplitLabel, template, weekLog],
  );

  return (
    <div className="app-card">
      <Section title="Treino semanal" description="Escolha o dia da divisão e marque as partes concluídas.">
        <div className="training-viewTabs" role="tablist" aria-label="Navegar entre treinos e configurações">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`training-viewTabs__item ${activeTab === "overview" ? "training-viewTabs__item--active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Treino semanal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "settings"}
            className={`training-viewTabs__item ${activeTab === "settings" ? "training-viewTabs__item--active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Configurar treinos
          </button>
        </div>

        {activeTab === "overview" ? (
          <>
            <div className="training-header">
              <ProgressBar value={summaryProgress} label="Semana concluída" />
            </div>

            <div className="training-tabs">
              {activeSplits.map((split) => {
                const label = resolveSplitLabel(split);
                return (
                  <button
                    key={split}
                    type="button"
                    className={`training-tabs__item ${activeSplit === split ? "training-tabs__item--active" : ""}`}
                    onClick={() => handleSelectSplit(split)}
                    aria-label={label ? `Treino ${split}: ${label}` : `Treino ${split}`}
                  >
                    <span className="training-tabs__title">{`Treino ${split}`}</span>
                    {label && <span className="training-tabs__subtitle">{label}</span>}
                  </button>
                );
              })}
            </div>

            <div className="training-immersiveEntry">
              <div>
                <strong>Pronto para treinar?</strong>
                <span>Elimine distrações e acompanhe somente o treino selecionado.</span>
              </div>
              <button type="button" onClick={() => setImmersiveMode(true)}>
                Iniciar modo imersivo
              </button>
            </div>

            <TrainingSplit
              split={activeSplit}
              plan={activePlan}
              log={activeLog}
              catalog={catalog}
              preferences={preferences}
              onTogglePart={toggleSessionPart}
              onToggleCardio={toggleCardioBlock}
              onSetSetProgress={setExerciseSetProgress}
              onRecordLoad={recordExerciseLoad}
              onUpdateExercise={updatePmExercise}
            />

            <div className="training-timeline">
              <h4>Trilha da semana</h4>
              <div className="training-timeline__rail">
                {timeline.map((entry) => {
                  const isActive = entry.split === activeSplit;
                  const status = entry.completed
                    ? "Concluído"
                    : entry.started
                    ? "Parcial"
                    : "Pendente";
                  return (
                    <button
                      key={entry.dateISO}
                      type="button"
                      className={`training-timeline__item ${entry.completed ? "training-timeline__item--done" : ""} ${isActive ? "training-timeline__item--active" : ""}`}
                      onClick={() => handleSelectSplit(entry.split)}
                    >
                      <span className="training-timeline__date">
                        {parseISODate(entry.dateISO).toLocaleDateString("pt-BR", {
                          weekday: "short",
                          day: "2-digit",
                        })}
                      </span>
                      <strong>{entry.label}</strong>
                      <small>{status}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="training-actions">
              <button type="button" onClick={resetWeek} className="training-actions__reset">
                Reiniciar semana
              </button>
            </div>
          </>
        ) : (
          <div className="training-settings">
            <p className="training-settings__description">
              Personalize como os detalhes aparecem nos cards e ajuste suas preferências da divisão.
            </p>
            <div className="training-preferences">
              <label>
                Estilo das informações
                <select
                  value={preferences.displayFormat}
                  onChange={(e) => setPreferences({ displayFormat: e.target.value as (typeof preferences.displayFormat) })}
                >
                  <option value="inline">Compacto (4 x 12 • descanso 60s)</option>
                  <option value="stacked">Detalhado (3 séries · 12 reps)</option>
                </select>
              </label>
              <label className="training-preferences__merge">
                <input
                  type="checkbox"
                  checked={preferences.mergeParts}
                  onChange={(e) => setPreferences({ mergeParts: e.target.checked })}
                />
                Unir cardio e musculação em uma lista
              </label>
              <fieldset className="training-preferences__sounds">
                <legend>Alertas sonoros</legend>
                <p>Escolha quando o app deve avisar que o descanso terminou.</p>
                <label className="training-preferences__soundOption">
                  <input
                    type="checkbox"
                    checked={preferences.seriesRestSound}
                    onChange={(event) => {
                      setPreferences({ seriesRestSound: event.target.checked });
                      if (event.target.checked) playTrainingRestSound("series");
                    }}
                  />
                  <span>
                    <strong>Fim do descanso entre séries</strong>
                    <small>Dois toques curtos para iniciar a próxima série.</small>
                  </span>
                </label>
                <label className="training-preferences__soundOption">
                  <input
                    type="checkbox"
                    checked={preferences.exerciseRestSound}
                    onChange={(event) => {
                      setPreferences({ exerciseRestSound: event.target.checked });
                      if (event.target.checked) playTrainingRestSound("exercise");
                    }}
                  />
                  <span>
                    <strong>Fim do descanso entre exercícios</strong>
                    <small>Um aviso crescente para seguir ao próximo exercício.</small>
                  </span>
                </label>
              </fieldset>
            </div>
            <Link to="/training/config" className="training-actions__config training-settings__link">
              Abrir biblioteca de exercícios
            </Link>
          </div>
        )}
      </Section>

      {immersiveMode && (
        <div className="training-immersive" role="dialog" aria-modal="true" aria-label={`Modo imersivo do treino ${activeSplit}`}>
          <div className="training-immersive__topbar">
            <div>
              <span className="training-immersive__eyebrow">Modo imersivo</span>
              <h2>
                Treino {activeSplit}
                {resolveSplitLabel(activeSplit) ? ` · ${resolveSplitLabel(activeSplit)}` : ""}
              </h2>
            </div>
            <button type="button" className="training-immersive__close" onClick={() => setImmersiveMode(false)} autoFocus>
              Sair
            </button>
          </div>

          <main className="training-immersive__content">
            <section className={`training-immersive__motivation ${
              immersiveCompleted ? "training-immersive__motivation--completed" : ""
            }`}>
              <div className="training-immersive__progressHeader">
                <strong>{Math.round(immersiveProgress * 100)}% concluído</strong>
                <span>{immersiveCompleted ? "Missão cumprida" : "Continue avançando"}</span>
              </div>
              <ProgressBar value={immersiveProgress} label="Progresso deste treino" />
              <p>{immersiveMessage}</p>
            </section>

            <TrainingSplit
              split={activeSplit}
              plan={activePlan}
              log={activeLog}
              catalog={catalog}
              preferences={preferences}
              onTogglePart={toggleSessionPart}
              onToggleCardio={toggleCardioBlock}
              onSetSetProgress={setExerciseSetProgress}
              onRecordLoad={recordExerciseLoad}
              onUpdateExercise={updatePmExercise}
            />

            <div className="training-immersive__footer">
              <strong>
                {immersiveCompleted
                  ? "Tudo concluído. Recupere-se e volte ainda mais forte."
                  : "Finalize todos os blocos antes de encerrar."}
              </strong>
              <button type="button" onClick={() => setImmersiveMode(false)}>
                Sair do modo imersivo
              </button>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.training-immersiveEntry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(219, 234, 254, 0.85), rgba(239, 246, 255, 0.75));
}
.training-immersiveEntry > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.training-immersiveEntry span {
  color: #475569;
  font-size: 0.88rem;
}
.training-immersiveEntry button {
  flex-shrink: 0;
  background: #1d4ed8;
  color: white;
}
.training-immersive {
  position: fixed;
  inset: 0;
  z-index: 1000;
  overflow-y: auto;
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 34%),
    #f8fafc;
}
.training-immersive__topbar {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px max(20px, calc((100vw - 960px) / 2));
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  background: rgba(248, 250, 252, 0.94);
  backdrop-filter: blur(14px);
}
.training-immersive__topbar h2 {
  margin: 2px 0 0;
  font-size: clamp(1.25rem, 3vw, 1.8rem);
}
.training-immersive__eyebrow {
  color: #2563eb;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}
.training-immersive__close {
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: white;
  color: #334155;
}
.training-immersive__content {
  width: min(920px, calc(100% - 32px));
  margin: 0 auto;
  padding: 28px 0 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.training-immersive__motivation {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 50px -38px rgba(29, 78, 216, 0.65);
}
.training-immersive__motivation--completed {
  border-color: rgba(34, 197, 94, 0.45);
  background: rgba(240, 253, 244, 0.96);
}
.training-immersive__progressHeader {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
.training-immersive__progressHeader strong {
  color: #1d4ed8;
  font-size: 1.35rem;
}
.training-immersive__motivation--completed .training-immersive__progressHeader strong {
  color: #15803d;
}
.training-immersive__progressHeader span,
.training-immersive__motivation p {
  color: #475569;
}
.training-immersive__motivation p {
  margin: 0;
  font-weight: 600;
}
.training-immersive__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 18px;
  background: #0f172a;
  color: white;
}
.training-immersive__footer button {
  flex-shrink: 0;
  background: white;
  color: #0f172a;
}
.training-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 999px;
  margin: 18px 0;
  justify-content: flex-start;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: thin;
}
.training-tabs__item {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  color: #475569;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 110px;
  flex: 0 0 auto;
}
.training-tabs__title {
  line-height: 1.1;
}
.training-tabs__subtitle {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
  line-height: 1.1;
}
.training-tabs__item--active {
  background: white;
  color: #1d4ed8;
  box-shadow: 0 10px 18px -16px rgba(37, 99, 235, 0.5);
}
.training-tabs__item--active .training-tabs__subtitle {
  color: #1d4ed8;
}
@media (min-width: 720px) {
  .training-tabs {
    justify-content: center;
  }
}
.training-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.training-actions__reset {
  background: transparent;
  border: 1px solid rgba(37, 99, 235, 0.25);
  color: #1d4ed8;
}
.training-actions__config {
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.3);
  padding: 6px 16px;
}
.training-viewTabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  background: rgba(148, 163, 184, 0.12);
  border-radius: 999px;
  margin-bottom: 24px;
}
.training-viewTabs__item {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
}
.training-viewTabs__item--active {
  background: white;
  color: #1d4ed8;
  box-shadow: 0 12px 22px -18px rgba(37, 99, 235, 0.6);
}
.training-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.training-settings__description {
  margin: 0;
  color: #475569;
}
.training-preferences {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 16px;
  padding: 18px;
}
.training-preferences label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  font-weight: 600;
  color: #1f2937;
}
.training-preferences select {
  width: 100%;
  font-weight: 500;
}
.training-preferences__merge {
  flex-direction: row;
  align-items: center;
  font-size: 0.9rem;
  color: #475569;
  font-weight: 500;
}
.training-preferences__sounds {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  padding-top: 4px;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
}
.training-preferences__sounds legend {
  padding-top: 14px;
  margin-bottom: 2px;
}
.training-preferences__sounds > p {
  margin: 0 0 2px;
  color: #64748b;
  font-size: 0.85rem;
}
.training-preferences .training-preferences__soundOption {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
}
.training-preferences__soundOption input {
  width: auto;
  margin-top: 3px;
  accent-color: #2563eb;
}
.training-preferences__soundOption span {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.training-preferences__soundOption small {
  color: #64748b;
  font-weight: 500;
}
.training-settings__link {
  align-self: flex-start;
  text-decoration: none;
  color: #1d4ed8;
  font-weight: 600;
}
.training-timeline {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.training-timeline h4 {
  margin: 0;
}
.training-timeline__rail {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.training-timeline__item {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 12px;
  background: #bbdffb;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}
.training-timeline__item--done {
  border-color: rgba(37, 99, 235, 0.5);
}
.training-timeline__item--active {
  box-shadow: 0 14px 30px -24px rgba(37, 99, 235, 0.6);
}
.training-timeline__date {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: capitalize;
}
@media (max-width: 640px) {
  .training-immersiveEntry,
  .training-immersive__footer {
    align-items: stretch;
    flex-direction: column;
  }
  .training-immersiveEntry button,
  .training-immersive__footer button {
    width: 100%;
  }
  .training-immersive__topbar {
    padding: 12px 16px;
  }
  .training-immersive__content {
    width: min(100% - 20px, 920px);
    padding-top: 14px;
  }
  .training-immersive__motivation {
    padding: 16px;
  }
  .training-immersive__progressHeader {
    align-items: flex-start;
    flex-direction: column;
    gap: 3px;
  }
  .training-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}
