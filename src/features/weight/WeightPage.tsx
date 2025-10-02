import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { useWeight } from "./weight.store";
import { WeightHeader } from "./WeightHeader";
import { WeightChart } from "./WeightChart";
import { sortEntries } from "./weight.service";

export default function WeightPage() {
  const { config, entries, addEntry, updateEntry, removeEntry } = useWeight();
  const [newWeight, setNewWeight] = useState("");
  const [editing, setEditing] = useState<{ dateISO: string; value: string } | null>(null);
  const sorted = sortEntries(entries);

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const value = Number(newWeight);
    if (!Number.isFinite(value) || value <= 0) return;
    addEntry(value);
    setNewWeight("");
  };

  const handleEditSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!editing) return;
    const value = Number(editing.value);
    if (!Number.isFinite(value) || value <= 0) return;
    updateEntry(editing.dateISO, value);
    setEditing(null);
  };

  return (
    <div className="app-card">
      <Section title="Meta de peso" description="Acompanhe seu progresso, cadastre novos pesos e ajuste metas.">
        <div className="weight-actions">
          <Link to="/weight/config">Configurar meta</Link>
        </div>
        <WeightHeader config={config} entries={sorted} />

        <form className="weight-form" onSubmit={handleSubmit}>
          <label>
            Registrar novo peso (kg)
            <input value={newWeight} onChange={(e) => setNewWeight(e.target.value)} type="number" min={20} step={0.1} />
          </label>
          <button type="submit" disabled={!newWeight}>
            Salvar peso
          </button>
        </form>

        <WeightChart entries={sorted} />

        <div className="weight-history">
          <h3>Histórico recente</h3>
          {sorted.length === 0 ? (
            <p className="weight-history__empty">Cadastre seu primeiro registro para visualizar aqui.</p>
          ) : (
            <ul>
              {sorted
                .slice()
                .reverse()
                .map((entry) => {
                  const isEditing = editing?.dateISO === entry.dateISO;
                  return (
                    <li key={entry.dateISO}>
                      <div className="weight-history__info">
                        <span>{new Date(entry.dateISO).toLocaleDateString("pt-BR")}</span>
                        {isEditing ? (
                          <form onSubmit={handleEditSubmit} className="weight-history__form">
                            <input
                              value={editing?.value ?? ""}
                              onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                              type="number"
                              step={0.1}
                              min={20}
                            />
                            <button type="submit">Salvar</button>
                          </form>
                        ) : (
                          <strong>{entry.kg.toFixed(1)} kg</strong>
                        )}
                      </div>
                      <div className="weight-history__actions">
                        {isEditing ? (
                          <button type="button" onClick={() => setEditing(null)}>
                            Cancelar
                          </button>
                        ) : (
                          <button type="button" onClick={() => setEditing({ dateISO: entry.dateISO, value: entry.kg.toFixed(1) })}>
                            Editar
                          </button>
                        )}
                        <button type="button" className="weight-history__delete" onClick={() => removeEntry(entry.dateISO)}>
                          Excluir
                        </button>
                      </div>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>
      </Section>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.weight-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 12px 0 24px;
}
.weight-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.weight-history {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.weight-history h3 {
  margin: 0;
}
.weight-history ul {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.weight-history li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
  padding-bottom: 6px;
  font-size: 0.95rem;
}
.weight-history li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.weight-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.weight-history__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.weight-history__actions {
  display: flex;
  gap: 8px;
}
.weight-history__delete {
  color: #b91c1c;
}
.weight-history__form {
  display: flex;
  gap: 6px;
}
.weight-history__empty {
  margin: 0;
  color: #94a3b8;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}