import { useEffect, useMemo, useState } from "react";
import { isoDate } from "@/lib/date";
import type { DailyDietProgress, Dish, MealName } from "./diet.schema";
import { mealLabels, mealOrder, resolveDish } from "./diet.service";
import { DietItem } from "./DietItem";

type DietDayViewProps = {
  day: DailyDietProgress;
  dishes: Dish[];
  onToggle: (meal: MealName, itemId: string) => void;
  onToggleMeal: (meal: MealName) => void;
};

type ExpandState = Record<MealName, boolean>;

const buildCollapsedState = () =>
  mealOrder.reduce((acc, meal) => ({ ...acc, [meal]: false }), {} as ExpandState);

const mealPalette: Record<MealName, string> = {
  breakfast: "#fee2e2",
  snack1: "#fef3c7",
  lunch: "#dcfce7",
  snack2: "#ede9fe",
  dinner: "#e0f2fe",
};

export function DietDayView({ day, dishes, onToggle, onToggleMeal }: DietDayViewProps) {
  const [expanded, setExpanded] = useState<ExpandState>(() => buildCollapsedState());

  useEffect(() => {
    setExpanded(buildCollapsedState());
  }, [day.dateISO]);

  const formattedDate = useMemo(
    () =>
      new Date(day.dateISO).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
      }),
    [day.dateISO],
  );
  const isToday = day.dateISO === isoDate();

  const descriptors = useMemo(
    () =>
      mealOrder.map((meal) => {
        const items = day.meals[meal] ?? [];
        const completed = items.filter((item) => item.checked).length;
        const total = items.length;
        return {
          meal,
          items,
          completed,
          total,
          isComplete: total > 0 && completed === total,
        };
      }),
    [day.meals],
  );

  const orderedMeals = useMemo(() => {
    const incomplete = descriptors.filter((descriptor) => !descriptor.isComplete);
    const complete = descriptors.filter((descriptor) => descriptor.isComplete);
    return [...incomplete, ...complete];
  }, [descriptors]);

  return (
    <div className="diet-day">
      <header className="diet-day__header">
        <div>
          <h2>{isToday ? `Hoje · ${formattedDate}` : formattedDate}</h2>
          <p>Marque as refeições concluídas para acompanhar seu progresso diário.</p>
        </div>
      </header>

      <div className="diet-day__list">
        {orderedMeals.map(({ meal, items, completed, total, isComplete }) => {
          const label = mealLabels[meal];
          const isOpen = expanded[meal];

          return (
            <section key={meal} className={`diet-day__meal diet-day__meal--${meal}`} style={{ backgroundColor: mealPalette[meal] }}>
              <button
                type="button"
                className={`diet-day__mealHeader ${isComplete ? "diet-day__mealHeader--complete" : ""}`}
                onClick={() => setExpanded((prev) => ({ ...prev, [meal]: !prev[meal] }))}
              >
                <div className="diet-day__mealIcon" aria-hidden>
                  {label.icon}
                </div>
                <div className="diet-day__mealInfo">
                  <span className="diet-day__mealTitle">{label.title}</span>
                  <span className="diet-day__mealCount">
                    {completed}/{total} item(s)
                  </span>
                  {total === 0 && <span className="diet-day__mealEmpty">Sem itens cadastrados</span>}
                </div>
                {isComplete && (
                  <span className="diet-day__mealStatus" aria-label="Refeição concluída">
                    ✔
                  </span>
                )}
                <span className={`diet-day__chevron ${isOpen ? "diet-day__chevron--open" : ""}`} aria-hidden>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
                <div className="diet-day__panel">
                  <div className="diet-day__panelHeader">
                    <div className="diet-day__panelText">
                      <h3 className="diet-day__panelTitle">{label.title}</h3>
                      <p className="diet-day__panelMeta">
                        {total === 0
                          ? "Nenhum prato cadastrado para este horário"
                          : `${completed} de ${total} item(s) concluídos`}
                      </p>
                    </div>
                    <button type="button" className="diet-day__panelButton" onClick={() => onToggleMeal(meal)}>
                      {completed === total && total > 0 ? "Desmarcar refeição" : "Concluir refeição"}
                    </button>
                  </div>
                  <ul className="diet-day__items">
                    {items.length === 0 ? (
                      <li className="diet-day__empty">Nenhum prato cadastrado para este horário.</li>
                    ) : (
                      items.map((item) => (
                        <DietItem
                          key={item.id}
                          meal={meal}
                          item={item}
                          dish={resolveDish(dishes, item.dishId)}
                          onToggle={onToggle}
                        />
                      ))
                    )}
                  </ul>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.diet-day {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.diet-day__header h2 {
  margin: 0;
  font-size: 1.4rem;
}
.diet-day__header p {
  margin: 6px 0 0;
  color: #475569;
  font-size: 0.95rem;
}
.diet-day__meal {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 18px;
  padding: 12px;
}
.diet-day__mealHeader {
  width: 100%;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  text-align: left;
  color: #0f172a;
}
.diet-day__mealHeader:hover {
  border-color: rgba(37, 99, 235, 0.45);
}
.diet-day__mealHeader--complete {
  border-color: rgba(34, 197, 94, 0.55);
  box-shadow: inset 0 0 0 1px rgba(34, 197, 94, 0.25);
}
.diet-day__mealIcon {
  height: 44px;
  width: 44px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  display: grid;
  place-items: center;
  font-size: 1.2rem;
}
.diet-day__mealInfo {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.diet-day__mealTitle {
  font-weight: 700;
  font-size: 1rem;
}
.diet-day__mealCount {
  font-size: 0.85rem;
  color: #64748b;
}
.diet-day__mealEmpty {
  font-size: 0.75rem;
  color: #94a3b8;
}
.diet-day__mealStatus {
  margin-left: auto;
  font-weight: 700;
  color: #16a34a;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  min-height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(22, 163, 74, 0.4);
  background: rgba(187, 247, 208, 0.6);
}
.diet-day__chevron {
  margin-left: auto;
  color: #64748b;
  transition: transform 0.15s ease;
}
.diet-day__chevron--open {
  transform: rotate(180deg);
}
.diet-day__panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.35);
  box-shadow: 0 18px 36px -28px rgba(15, 23, 42, 0.45);
}
.diet-day__panelHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}
.diet-day__panelText {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.diet-day__panelTitle {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
}
.diet-day__panelMeta {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
}
.diet-day__panelButton {
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: #f8fafc;
  font-weight: 600;
  padding: 10px 18px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
  white-space: nowrap;
  align-self: flex-start;
}
.diet-day__panelButton:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.35);
  outline-offset: 2px;
}
.diet-day__panelButton:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}
.diet-day__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
}
.diet-day__empty {
  font-size: 0.9rem;
  color: #64748b;
  padding-left: 8px;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}