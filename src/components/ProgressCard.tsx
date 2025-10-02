import { Link } from "react-router-dom";
import { ProgressBar } from "./ProgressBar";

type ProgressCardProps = {
  title: string;
  subtitle?: string;
  value: number;
  to: string;
  accentColor?: string;
};

export function ProgressCard({ title, subtitle, value, to, accentColor }: ProgressCardProps) {
  return (
    <Link to={to} className="progress-card">
      <div className="progress-card__header">
        <div>
          <p className="progress-card__title">{title}</p>
          {subtitle && <p className="progress-card__subtitle">{subtitle}</p>}
        </div>
        <span className="progress-card__chevron">›</span>
      </div>
      <ProgressBar value={value} color={accentColor} />
    </Link>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.progress-card {
  background: white;
  border-radius: 20px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 18px 36px -28px rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(148, 163, 184, 0.18);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.progress-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 48px -30px rgba(15, 23, 42, 0.6);
}
.progress-card__header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.progress-card__title {
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0;
  color: #0f172a;
}
.progress-card__subtitle {
  font-size: 0.85rem;
  color: #475569;
  margin: 4px 0 0;
}
.progress-card__chevron {
  margin-left: auto;
  color: #94a3b8;
  font-size: 1.4rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}
