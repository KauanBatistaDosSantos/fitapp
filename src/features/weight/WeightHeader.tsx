import type { WeightConfig, WeightEntry } from "./weight.schema";
import { progressToTarget, weightStats } from "./weight.service";
import { ProgressBar } from "@/components/ProgressBar";

type WeightHeaderProps = {
  config: WeightConfig;
  entries: WeightEntry[];
};

export function WeightHeader({ config, entries }: WeightHeaderProps) {
  const stats = weightStats(entries, config);
  const progress = progressToTarget(entries, config.targetKg);

  return (
    <div className="weight-header">
      <div className="weight-header__current">
        <div>
          <span className="weight-header__label">Peso atual</span>
          <span className="weight-header__value">{stats.currentKg.toFixed(1)} kg</span>
        </div>
        <div className="weight-header__bmi" style={{ borderColor: stats.status.color }}>
          <span>IMC</span>
          <strong>{stats.bmi.toFixed(1)}</strong>
          <small>{stats.status.label}</small>
        </div>
      </div>

      <div className="weight-header__details">
        <div>
          <span className="weight-header__label">Variação média</span>
          <strong>{stats.variation.toFixed(1)} kg</strong>
        </div>
        <div>
          <span className="weight-header__label">Desde o início</span>
          <strong>{(stats.change).toFixed(1)} kg</strong>
        </div>
        <div>
          <span className="weight-header__label">Peso mais baixo</span>
          <strong>{stats.minKg.toFixed(1)} kg</strong>
        </div>
      </div>

      <ProgressBar value={progress} label="Rumo à meta" />
      <p className="weight-header__target">Meta: {config.targetKg} kg</p>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.weight-header {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.weight-header__current {
  display: flex;
  align-items: center;
  gap: 18px;
}
.weight-header__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}
.weight-header__value {
  font-size: 2.4rem;
  font-weight: 700;
}
.weight-header__bmi {
  margin-left: auto;
  border: 2px solid #22c55e;
  border-radius: 16px;
  padding: 12px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 120px;
}
.weight-header__bmi strong {
  font-size: 1.5rem;
}
.weight-header__bmi small {
  color: #475569;
}
.weight-header__details {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}
.weight-header__details strong {
  font-size: 1.1rem;
}
.weight-header__target {
  margin: 0;
  color: #475569;
}
@media (max-width: 640px) {
  .weight-header__current {
    flex-direction: column;
    align-items: flex-start;
  }
  .weight-header__bmi {
    margin-left: 0;
  }
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}