import { useMemo } from "react";
import { EmptyState } from "@/components/EmptyState";
import type { WaterLog } from "./water.schema";
import { formatMl, groupByMonth, totalIntake } from "./water.service";

type WaterHistoryProps = {
  history: WaterLog[];
  target: number;
};

export function WaterHistory({ history, target }: WaterHistoryProps) {
  const grouped = useMemo(() => groupByMonth(history), [history]);
  const months = useMemo(
    () => [...grouped.entries()].sort((a, b) => (a[0] > b[0] ? -1 : 1)),
    [grouped],
  );

  if (history.length === 0) {
    return <EmptyState title="Sem histórico" description="Salve o dia atual para montar o histórico mensal." />;
  }

  return (
    <div className="water-history">
      {months.map(([month, logs]) => (
        <section key={month} className="water-history__month">
          <header>
            <h3>{formatMonth(month)}</h3>
            <span>{logs.length} registro(s)</span>
          </header>
          <div className="water-history__grid">
            {logs
              .sort((a, b) => (a.dateISO > b.dateISO ? -1 : 1))
              .map((log) => {
                const total = totalIntake(log);
                const reached = total >= target;
                return (
                  <div key={log.dateISO} className={`water-history__day ${reached ? "water-history__day--hit" : ""}`}>
                    <span className="water-history__date">{formatDay(log.dateISO)}</span>
                    <strong>{formatMl(total)}</strong>
                    <span className="water-history__target">Meta: {formatMl(log.targetML)}</span>
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}

function formatMonth(month: string) {
  const [year, mon] = month.split("-").map(Number);
  return new Date(year, mon - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function formatDay(dateISO: string) {
  const date = new Date(dateISO);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

const style = new CSSStyleSheet();
style.replaceSync(`
.water-history {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.water-history__month {
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 18px;
  padding: 18px;
  background: rgba(248, 250, 252, 0.85);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.water-history__month header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.water-history__month h3 {
  margin: 0;
  text-transform: capitalize;
}
.water-history__grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}
.water-history__day {
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: white;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
}
.water-history__day--hit {
  border-color: rgba(37, 99, 235, 0.6);
  box-shadow: 0 12px 24px -20px rgba(37, 99, 235, 0.5);
}
.water-history__date {
  font-weight: 700;
  color: #0f172a;
}
.water-history__target {
  color: #64748b;
  font-size: 0.8rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}