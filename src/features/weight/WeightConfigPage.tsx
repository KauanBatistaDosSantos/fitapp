import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { useWeight } from "./weight.store";
import { sortEntries } from "./weight.service";

export default function WeightConfigPage() {
  const { config, updateConfig, addEntry, entries } = useWeight();
  const [height, setHeight] = useState(String(config.heightM));
  const [target, setTarget] = useState(String(config.targetKg));
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [kg, setKg] = useState("");

  const handleConfigSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const heightValue = Number(height);
    const targetValue = Number(target);
    if (!heightValue || !targetValue) return;
    updateConfig({ heightM: heightValue, targetKg: targetValue });
  };

  const handleEntrySubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const value = Number(kg);
    if (!value) return;
    addEntry(value, date);
    setKg("");
  };

  return (
    <div className="app-card">
      <Section
        title="Configurar meta"
        description="Atualize sua altura e o peso desejado para recalcular o IMC."
        action={<Link to="/weight">Voltar para o painel</Link>}
      >
        <form className="weight-config__form" onSubmit={handleConfigSubmit}>
          <label>
            Altura (m)
            <input value={height} onChange={(e) => setHeight(e.target.value)} type="number" step={0.01} min={1.3} max={2.2} />
          </label>
          <label>
            Peso alvo (kg)
            <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" step={0.1} min={30} />
          </label>
          <button type="submit">Salvar alterações</button>
        </form>

        <form className="weight-config__form" onSubmit={handleEntrySubmit}>
          <h3>Registrar peso específico</h3>
          <label>
            Data
            <input value={date} onChange={(e) => setDate(e.target.value)} type="date" />
          </label>
          <label>
            Peso (kg)
            <input value={kg} onChange={(e) => setKg(e.target.value)} type="number" step={0.1} min={20} />
          </label>
          <button type="submit" disabled={!kg}>
            Salvar registro
          </button>
        </form>

        <div className="weight-config__summary">
          <h4>Resumo dos registros</h4>
          <ul>
            {sortEntries(entries).map((entry) => (
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
.weight-config__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}
.weight-config__form h3 {
  margin: 0;
}
.weight-config__summary {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  padding: 16px;
  background: rgba(248, 250, 252, 0.8);
}
.weight-config__summary ul {
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.weight-config__summary li {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
  padding-bottom: 6px;
}
.weight-config__summary li:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}