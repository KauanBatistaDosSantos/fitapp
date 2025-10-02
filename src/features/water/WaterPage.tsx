import { useState } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { useWater } from "./water.store";
import { WaterToday } from "./WaterToday";
import { WaterHistory } from "./WaterHistory";

const tabs = [
  { key: "today", label: "Atual" },
  { key: "history", label: "Histórico" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function WaterPage() {
  const { today, config, addEntry, commitToday, resetToday, monthHistory } = useWater();
  const [tab, setTab] = useState<TabKey>("today");

  return (
    <div className="app-card">
      <Section
        title="Consumo de água"
        description="Registre cada copo e acompanhe sua evolução mensal."
        action={<Link to="/water/config">Configurar atalhos</Link>}
      >
        <div className="water-tabs">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`water-tabs__item ${tab === item.key ? "water-tabs__item--active" : ""}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === "today" ? (
          <WaterToday
            log={today}
            presets={config.presets}
            onAdd={addEntry}
            onCommit={commitToday}
            onReset={resetToday}
          />
        ) : (
          <WaterHistory history={monthHistory} target={config.targetML} />
        )}
      </Section>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.water-tabs {
  display: inline-flex;
  padding: 6px;
  background: rgba(148, 163, 184, 0.15);
  border-radius: 999px;
  gap: 6px;
  margin-bottom: 18px;
}
.water-tabs__item {
  background: transparent;
  border: none;
  color: #475569;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 999px;
}
.water-tabs__item--active {
  background: white;
  color: #1d4ed8;
  box-shadow: 0 10px 18px -16px rgba(37, 99, 235, 0.5);
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}