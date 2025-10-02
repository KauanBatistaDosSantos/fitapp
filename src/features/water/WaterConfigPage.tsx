import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { useWater } from "./water.store";
import { formatMl, streak, totalIntake } from "./water.service";

export default function WaterConfigPage() {
  const { config, monthHistory, setTarget, setPresets } = useWater();
  const [target, setTargetValue] = useState(String(config.targetML));
  const [presets, setPresetsValue] = useState(config.presets.join(", "));

  const handleTargetSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const value = Number(target);
    if (!Number.isFinite(value) || value <= 0) return;
    setTarget(value);
  };

  const handlePresetsSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    const numbers = presets
      .split(",")
      .map((token) => Number(token.trim()))
      .filter((value) => Number.isFinite(value) && value > 0);
    if (numbers.length === 0) return;
    setPresets(numbers);
  };

  const bestDay = monthHistory.reduce(
    (acc, log) => {
      const total = totalIntake(log);
      if (total > acc.total) return { total, date: log.dateISO };
      return acc;
    },
    { total: 0, date: "" },
  );

  return (
    <div className="app-card">
      <Section
        title="Meta diária"
        description="Ajuste a quantidade total e os atalhos de copos para registrar a hidratação mais rápido."
        action={<Link to="/water">Voltar para a hidratação</Link>}
      >
        <form className="water-config__form" onSubmit={handleTargetSubmit}>
          <label>
            Meta diária (ml)
            <input value={target} onChange={(e) => setTargetValue(e.target.value)} type="number" min={500} step={50} />
          </label>
          <button type="submit">Salvar meta</button>
        </form>

        <form className="water-config__form" onSubmit={handlePresetsSubmit}>
          <label>
            Atalhos em ml (separe por vírgula)
            <input value={presets} onChange={(e) => setPresetsValue(e.target.value)} placeholder="220, 330, 500" />
          </label>
          <button type="submit">Salvar atalhos</button>
        </form>

        <div className="water-config__stats">
          <div>
            <span className="water-config__label">Maior consumo registrado</span>
            <strong>{bestDay.total ? `${formatMl(bestDay.total)} em ${formatDate(bestDay.date)}` : "—"}</strong>
          </div>
          <div>
            <span className="water-config__label">Sequência atingindo a meta</span>
            <strong>{streak(monthHistory, config.targetML)} dia(s)</strong>
          </div>
        </div>
      </Section>
    </div>
  );
}

function formatDate(dateISO: string) {
  if (!dateISO) return "";
  return new Date(dateISO).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const style = new CSSStyleSheet();
style.replaceSync(`
.water-config__form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}
.water-config__form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.water-config__stats {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  padding-top: 16px;
  border-top: 1px solid rgba(148, 163, 184, 0.3);
}
.water-config__label {
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.water-config__stats strong {
  font-size: 1.1rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}