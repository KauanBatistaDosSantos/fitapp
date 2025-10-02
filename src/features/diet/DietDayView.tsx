import { useMemo, useState } from "react";
import type { DailyDietProgress, Dish, MealName } from "./diet.schema";
import { mealLabels, mealOrder, resolveDish } from "./diet.service";
import { DietItem } from "./DietItem";

type DietDayViewProps = {
  day: DailyDietProgress;
  dishes: Dish[];
  onToggle: (meal: MealName, itemId: string) => void;
};

type ExpandState = Record<MealName, boolean>;

const defaultExpanded = mealOrder.reduce((acc, meal) => ({ ...acc, [meal]: meal !== "snack1" }), {} as ExpandState);

export function DietDayView({ day, dishes, onToggle }: DietDayViewProps) {
  const [expanded, setExpanded] = useState<ExpandState>(defaultExpanded);
  const formattedDate = useMemo(() => new Date(day.dateISO).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  }), [day.dateISO]);

  return (
    <div className="diet-day">
      <header className="diet-day__header">
        <div>
          <h2>Hoje · {formattedDate}</h2>
          <p>Marque as refeições concluídas para acompanhar seu progresso diário.</p>
        </div>
      </header>

      <div className="diet-day__list">
        {mealOrder.map((meal) => {
          const label = mealLabels[meal];
          const items = day.meals[meal] ?? [];
          const isOpen = expanded[meal];

          return (
            <section key={meal} className="diet-day__meal">
              <button
                type="button"
                className="diet-day__mealHeader"
                onClick={() => setExpanded((prev) => ({ ...prev, [meal]: !prev[meal] }))}
              >
                <div className="diet-day__mealIcon" aria-hidden>
                  {label.icon}
                </div>
                <div className="diet-day__mealInfo">
                  <span className="diet-day__mealTitle">{label.title}</span>
                  <span className="diet-day__mealCount">{items.length} item(s)</span>
                </div>
                <span className={`diet-day__chevron ${isOpen ? "diet-day__chevron--open" : ""}`} aria-hidden>
                  {isOpen ? "▲" : "▼"}
                </span>
              </button>

              {isOpen && (
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
}
.diet-day__mealHeader {
  width: 100%;
  border-radius: 16px;
  background: white;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  text-align: left;
}
.diet-day__mealHeader:hover {
  border-color: rgba(37, 99, 235, 0.45);
}
.diet-day__mealIcon {
  height: 40px;
  width: 40px;
  border-radius: 14px;
  background: rgba(96, 165, 250, 0.2);
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
.diet-day__chevron {
  margin-left: auto;
  color: #64748b;
  transition: transform 0.15s ease;
}
.diet-day__chevron--open {
  transform: rotate(180deg);
}
.diet-day__items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0 4px 10px 4px;
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