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
  onUpdateEntry: (index: number, ml: number) => void;
  onRemoveEntry: (index: number) => void;
};

export function WaterToday({ log, presets, onAdd, onCommit, onReset, onUpdateEntry, onRemoveEntry }: WaterTodayProps) {
  const [custom, setCustom] = useState("250");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("0");
  const total = useMemo(() => totalIntake(log), [log]);
  const progress = intakeProgress(log);

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const value = Number(custom);
    if (!Number.isFinite(value) || value <= 0) return;
    onAdd(value);
    setCustom("250");
  };

  const handleUpdate = (evt: FormEvent) => {
    evt.preventDefault();
    if (editingIndex === null) return;
    const value = Number(editingValue);
    if (!Number.isFinite(value) || value <= 0) return;
    onUpdateEntry(editingIndex, value);
    setEditingIndex(null);
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
            {log.entries.map((entry, index) => {
              const isEditing = editingIndex === index;
              return (
                <li key={`${entry}-${index}`}>
                  {isEditing ? (
                    <form onSubmit={handleUpdate} className="water-today__editForm">
                      <input
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        type="number"
                        min={50}
                        step={50}
                      />
                      <button type="submit">Salvar</button>
                      <button type="button" onClick={() => setEditingIndex(null)}>
                        Cancelar
                      </button>
                    </form>
                  ) : (
                    <span>{entry} ml</span>
                  )}
                  {!isEditing && (
                    <div className="water-today__entryActions">
                      <button type="button" onClick={() => { setEditingIndex(index); setEditingValue(String(entry)); }}>
                        Editar
                      </button>
                      <button type="button" onClick={() => onRemoveEntry(index)}>
                        Excluir
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
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
.water-today__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
.water-today__header h2 {
  margin: 0;
}
.water-today__header p {
  margin: 0;
  color: #1d4ed8;
}
.water-today__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.water-today__presets {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.water-today__presets button {
  flex: 1 1 120px;
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
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
}
.water-today__entries li {
  background: white;
  border-radius: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.water-today__empty {
  margin: 0;
  color: #94a3b8;
}
.water-today__entryActions {
  display: flex;
  gap: 6px;
}
.water-today__editForm {
  display: flex;
  gap: 6px;
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