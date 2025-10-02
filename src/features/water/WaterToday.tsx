import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import { formatMl, intakeProgress, totalIntake } from "./water.service";
import type { WaterLog } from "./water.schema";

type WaterTodayProps = {
  log: WaterLog;
  presets: number[];
  onAdd: (ml: number) => void;
  onCommit: () => void;
  onReset: () => void;
};

export function WaterToday({ log, presets, onAdd, onCommit, onReset }: WaterTodayProps) {
  const [custom, setCustom] = useState("250");
  const total = useMemo(() => totalIntake(log), [log]);
  const progress = intakeProgress(log);

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const value = Number(custom);
    if (!Number.isFinite(value) || value <= 0) return;
    onAdd(value);
    setCustom("250");
  };

  return (
    <div className="water-today">
      <div className="water-today__header">
        <div>
          <h2>Hoje</h2>
          <p>
            Você já ingeriu <strong>{formatMl(total)}</strong> de {formatMl(log.targetML)}.
          </p>
        </div>
        <div className="water-today__actions">
          <button type="button" onClick={onCommit}>
            Salvar no histórico
          </button>
          <button type="button" onClick={onReset} className="water-today__reset">
            Reiniciar dia
          </button>
        </div>
      </div>

      <ProgressBar value={progress} label="Meta diária" />

      <div className="water-today__presets">
        {presets.map((ml) => (
          <button key={ml} type="button" onClick={() => onAdd(ml)}>
            +{ml} ml
          </button>
        ))}
      </div>

      <form className="water-today__form" onSubmit={handleSubmit}>
        <label>
          Quantidade personalizada (ml)
          <input value={custom} onChange={(e) => setCustom(e.target.value)} type="number" min={50} step={50} />
        </label>
        <button type="submit">Adicionar</button>
      </form>

      <div className="water-today__entries">
        <h3>Registros do dia</h3>
        {log.entries.length === 0 ? (
          <p className="water-today__empty">Comece registrando o primeiro copo de água!</p>
        ) : (
          <ul>
            {log.entries.map((entry, index) => (
              <li key={`${entry}-${index}`}>{entry} ml</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.water-today {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.water-today__header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.water-today__header h2 {
  margin: 0;
}
.water-today__header p {
  margin: 0;
  color: #475569;
}
.water-today__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.water-today__reset {
  background: transparent;
  border-color: rgba(37, 99, 235, 0.2);
  color: #1d4ed8;
}
.water-today__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.water-today__presets button {
  background: white;
  color: #2563eb;
  border: 1px solid rgba(37, 99, 235, 0.3);
}
.water-today__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.water-today__form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.water-today__entries {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
}
.water-today__entries h3 {
  margin: 0 0 8px;
}
.water-today__entries ul {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0;
}
.water-today__entries li {
  background: white;
  border-radius: 12px;
  padding: 6px 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  font-weight: 600;
}
.water-today__empty {
  margin: 0;
  color: #94a3b8;
}
@media (min-width: 640px) {
  .water-today__header {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}