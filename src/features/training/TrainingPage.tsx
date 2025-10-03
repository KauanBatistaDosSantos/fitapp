import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ProgressBar";
import { Section } from "@/components/Section";
import { useTraining } from "./training.store";
import { splitOrder, todaySplit, trainingProgress } from "./training.service";
import { TrainingSplit } from "./TrainingSplit";
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
    preferences,
    setPreferences,
    updatePmExercise,
    catalog,
  } = useTraining();

  const [activeSplit, setActiveSplit] = useState<Split>(preferences.activeSplit ?? todaySplit());
  const [activeTab, setActiveTab] = useState<"overview" | "settings">("overview");

  useEffect(() => {
    setActiveSplit(preferences.activeSplit ?? todaySplit());
  }, [preferences.activeSplit]);

  const handleSelectSplit = (split: Split) => {
    setActiveSplit(split);
    setPreferences({ activeSplit: split });
  };

  const summaryProgress = useMemo(() => trainingProgress(template, weekLog), [template, weekLog]);

  const timeline = useMemo(
    () =>
      weekLog
        .slice()
        .sort((a, b) => (a.dateISO > b.dateISO ? 1 : -1))
        .map((log) => ({
          ...log,
          label: `Treino ${log.split}`,
          completed: (log.completedCardio.length > 0 || log.amDone) && (log.pmDone || log.doneExercises.length > 0),
        })),
    [weekLog],
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
              {splitOrder.map((split) => (
                <button
                  key={split}
                  type="button"
                  className={`training-tabs__item ${activeSplit === split ? "training-tabs__item--active" : ""}`}
                  onClick={() => handleSelectSplit(split)}
                >
                  {`Treino ${split}`}
                </button>
              ))}
            </div>

            <TrainingSplit
              split={activeSplit}
              plan={template[activeSplit]}
              log={weekLog.find((log) => log.split === activeSplit)}
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
                    : entry.amDone || entry.pmDone
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
                        {new Date(entry.dateISO).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" })}
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
            </div>
            <Link to="/training/config" className="training-actions__config training-settings__link">
              Abrir biblioteca de exercícios
            </Link>
          </div>
        )}
      </Section>
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
.training-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 999px;
  margin: 18px 0;
  justify-content: center;
  width: 100%;
}
.training-tabs__item {
  background: transparent;
  border: none;
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 600;
  color: #475569;
}
.training-tabs__item--active {
  background: white;
  color: #1d4ed8;
  box-shadow: 0 10px 18px -16px rgba(37, 99, 235, 0.5);
}
.training-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  .training-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}