import { useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import type { WaterLog } from "./water.schema";
import { formatMl, groupByMonth, totalIntake } from "./water.service";

type WaterHistoryProps = {
  history: WaterLog[];
  onEdit: (dateISO: string, total: number) => void;
  onDelete: (dateISO: string) => void;
};

export function WaterHistory({ history, onEdit, onDelete }: WaterHistoryProps) {
  const [editing, setEditing] = useState<{ dateISO: string; value: string } | null>(null);
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
                const statusClass = total === log.targetML
                  ? "water-history__day--goal"
                  : total > log.targetML
                  ? "water-history__day--high"
                  : "water-history__day--low";
                const isEditing = editing?.dateISO === log.dateISO;
                return (
                  <div key={log.dateISO} className={`water-history__day ${statusClass}`}>
                    <span className="water-history__date">{formatDay(log.dateISO)}</span>
                    {isEditing ? (
                      <form
                        className="water-history__edit"
                        onSubmit={(evt) => {
                          evt.preventDefault();
                          if (!editing) return;
                          const value = Number(editing.value);
                          if (!Number.isFinite(value) || value <= 0) return;
                          onEdit(log.dateISO, value);
                          setEditing(null);
                        }}
                      >
                        <input
                          value={editing.value}
                          onChange={(e) => setEditing((prev) => (prev ? { ...prev, value: e.target.value } : prev))}
                          type="number"
                          min={100}
                          step={50}
                        />
                        <button type="submit">Salvar</button>
                        <button type="button" onClick={() => setEditing(null)}>
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <strong>{formatMl(total)}</strong>
                    )}
                    <span className="water-history__target">Meta: {formatMl(log.targetML)}</span>
                    {!isEditing && (
                      <div className="water-history__actions">
                        <button type="button" onClick={() => setEditing({ dateISO: log.dateISO, value: String(total) })}>
                          Editar
                        </button>
                        <button type="button" onClick={() => onDelete(log.dateISO)} className="water-history__delete">
                          Excluir
                        </button>
                      </div>
                    )}
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
.water-history__day {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  background: white;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
}
.water-history__day--goal {
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(59, 130, 246, 0.1);
}
.water-history__day--high {
  border-color: rgba(34, 197, 94, 0.6);
  background: rgba(34, 197, 94, 0.12);
}
.water-history__day--low {
  border-color: rgba(251, 146, 60, 0.6);
  background: rgba(251, 191, 36, 0.12);
}
.water-history__date {
  font-weight: 700;
  color: #0f172a;
}
.water-history__target {
  color: #64748b;
  font-size: 0.8rem;
}
.water-history__actions {
  display: flex;
  gap: 6px;
}
.water-history__delete {
  color: #b91c1c;
}
.water-history__edit {
  display: flex;
  gap: 6px;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}