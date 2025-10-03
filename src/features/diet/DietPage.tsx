import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { isoDate } from "@/lib/date";
import { ProgressBar } from "@/components/ProgressBar";
import { Section } from "@/components/Section";
import { useDiet } from "./diet.store";
import { computeDietProgress } from "./diet.service";
import { DietDayView } from "./DietDayView";

export default function DietPage() {
  const catalog = useDiet((state) => state.catalog);
  const selectedDateISO = useDiet((state) => state.selectedDateISO);
  const day = useDiet((state) => state.days[state.selectedDateISO]);
  const selectDate = useDiet((state) => state.selectDate);
  const regenerateDayFromWeekly = useDiet((state) => state.regenerateDayFromWeekly);
  const toggleItem = useDiet((state) => state.toggleItem);
  const toggleMeal = useDiet((state) => state.toggleMeal);

  useEffect(() => {
    if (!day && selectedDateISO) {
      regenerateDayFromWeekly(new Date(`${selectedDateISO}T00:00:00`));
    }
  }, [day, regenerateDayFromWeekly, selectedDateISO]);

  if (!day) {
    return null;
  }

  const progress = computeDietProgress(day);
  const allMealsDone = progress.totalMeals > 0 && progress.completedMeals === progress.totalMeals;
  const selectedDate = useMemo(() => new Date(`${selectedDateISO}T00:00:00`), [selectedDateISO]);
  const formattedDate = useMemo(
    () =>
      selectedDate.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      }),
    [selectedDateISO],
  );
  const formattedLabel = formattedDate.replace(/^./, (char) => char.toUpperCase());
  const isToday = selectedDateISO === isoDate();

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    selectDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    selectDate(next);
  };

  const goToDate = (value: string) => {
    if (!value) return;
    selectDate(new Date(`${value}T00:00:00`));
  };

  const goToToday = () => {
    selectDate(new Date());
  };

  return (
    <div className="app-card">
      <Section
        title={isToday ? "Sua dieta de hoje" : `Sua dieta de ${formattedLabel}`}
        description="Cada refeição foi carregada do plano semanal. Marque o que já comeu para acompanhar a sua disciplina."
        action={<Link to="/diet/config">Configurar dieta</Link>}
      >
        <div className="diet-controls">
          <button type="button" onClick={goToPreviousDay} className="diet-controls__nav">
            ◀ Dia anterior
          </button>
          <label className="diet-controls__date">
            <span>Escolha o dia</span>
            <input
              type="date"
              value={selectedDateISO}
              onChange={(event) => goToDate(event.target.value)}
            />
          </label>
          <button type="button" onClick={goToNextDay} className="diet-controls__nav">
            Próximo dia ▶
          </button>
          <button type="button" onClick={goToToday} className="diet-controls__today" disabled={isToday}>
            Hoje
          </button>
        </div>
        <ProgressBar value={progress.itemProgress} label="Itens concluídos" />
        <p className={`diet-summary ${allMealsDone ? "diet-summary--success" : ""}`}>
          {progress.totalItems === 0
            ? "Nenhum item cadastrado para este dia."
            : allMealsDone
            ? "Alimentação concluída! Todas as refeições deste dia foram marcadas."
            : `${progress.checkedItems} de ${progress.totalItems} itens concluídos · ${progress.completedMeals} refeições completas`}
        </p>
        <DietDayView day={day} dishes={catalog} onToggle={toggleItem} onToggleMeal={toggleMeal} />
      </Section>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.diet-summary {
  margin: 6px 0 18px;
  color: #475569;
  font-weight: 600;
  font-size: 0.95rem;
}
.diet-summary--success {
  color: #15803d;
}
.diet-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 18px;
}
.diet-controls__nav,
.diet-controls__today {
  border: 1px solid rgba(148, 163, 184, 0.5);
  border-radius: 999px;
  padding: 8px 14px;
  background: white;
  font-weight: 600;
  color: #1f2937;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease;
}
.diet-controls__nav:hover,
.diet-controls__today:hover:enabled {
  border-color: rgba(59, 130, 246, 0.8);
  color: #1d4ed8;
}
.diet-controls__today:disabled {
  opacity: 0.6;
  cursor: default;
}
.diet-controls__date {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}
.diet-controls__date input {
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.6);
  padding: 8px 12px;
  font-size: 0.95rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}