import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ProgressBar } from "@/components/ProgressBar";
import { Section } from "@/components/Section";
import { useTraining } from "./training.store";
import { splitOrder, todaySplit, trainingProgress } from "./training.service";
import { TrainingSplit } from "./TrainingSplit";
import type { Split } from "./training.schema";

export default function TrainingPage() {
  const { template, weekLog, toggleSessionPart, toggleExerciseDone, resetWeek } = useTraining();
  const [activeSplit, setActiveSplit] = useState<Split>(todaySplit());

  const summaryProgress = useMemo(() => trainingProgress(template, weekLog), [template, weekLog]);

  return (
    <div className="app-card">
      <Section
        title="Treino semanal"
        description="Escolha o dia da divisão e marque as partes concluídas."
        action={
          <div className="training-actions">
            <button type="button" onClick={resetWeek} className="training-actions__reset">
              Reiniciar semana
            </button>
            <Link to="/training/config">Configurar treinos</Link>
          </div>
        }
      >
        <ProgressBar value={summaryProgress} label="Semana concluída" />

        <div className="training-tabs">
          {splitOrder.map((split) => (
            <button
              key={split}
              type="button"
              className={`training-tabs__item ${activeSplit === split ? "training-tabs__item--active" : ""}`}
              onClick={() => setActiveSplit(split)}
            >
              {`Treino ${split}`}
            </button>
          ))}
        </div>

        <TrainingSplit
          split={activeSplit}
          plan={template[activeSplit]}
          log={weekLog.find((log) => log.split === activeSplit)}
          onTogglePart={toggleSessionPart}
          onToggleExercise={toggleExerciseDone}
        />
      </Section>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.training-tabs {
  display: inline-flex;
  gap: 8px;
  padding: 6px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 999px;
  margin: 18px 0;
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
}
.training-actions__reset {
  background: transparent;
  border: 1px solid rgba(37, 99, 235, 0.25);
  color: #1d4ed8;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}