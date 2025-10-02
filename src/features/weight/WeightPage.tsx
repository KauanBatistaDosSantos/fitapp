import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { useWeight } from "./weight.store";
import { WeightHeader } from "./WeightHeader";
import { WeightChart } from "./WeightChart";
import { sortEntries } from "./weight.service";

export default function WeightPage() {
  const { config, entries, addEntry } = useWeight();
  const [newWeight, setNewWeight] = useState("");
  const sorted = sortEntries(entries);

  const handleSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const value = Number(newWeight);
    if (!Number.isFinite(value) || value <= 0) return;
    addEntry(value);
    setNewWeight("");
  };

  return (
    <div className="app-card">
      <Section
        title="Meta de peso"
        description="Acompanhe seu progresso, cadastre novos pesos e ajuste metas."
        action={<Link to="/weight/config">Configurar meta</Link>}
      >
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
          <ul>
            {sorted.slice().reverse().map((entry) => (
              <li key={entry.dateISO}>
                <span>{new Date(entry.dateISO).toLocaleDateString("pt-BR")}</span>
                <strong>{entry.kg.toFixed(1)} kg</strong>
              </li>
            ))}
          </ul>
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
  border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
  padding-bottom: 6px;
  font-size: 0.95rem;
}
.weight-history li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}