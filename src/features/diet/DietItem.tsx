import type { Dish, MealName } from "./diet.schema";
import { mealLabels } from "./diet.service";

export type DietMealItem = {
  id: string;
  dishId: string;
  qty: number;
  checked: boolean;
};

type DietItemProps = {
  meal: MealName;
  dish: Dish | undefined;
  item: DietMealItem;
  onToggle: (meal: MealName, itemId: string) => void;
};

export function DietItem({ meal, dish, item, onToggle }: DietItemProps) {
  const label = mealLabels[meal];
  const name = dish?.name ?? "Prato removido";
  const subtitle = dish ? `${item.qty} ${dish.unit}${dish.kcal ? ` · ${dish.kcal} kcal` : ""}` : "Cadastre esse prato novamente";

  return (
    <li>
      <button
        type="button"
        className={`diet-item ${item.checked ? "diet-item--checked" : ""}`}
        onClick={() => onToggle(meal, item.id)}
      >
        <div className="diet-item__icon" aria-hidden>
          {dish?.imageUrl ? <img src={dish.imageUrl} alt="" /> : label.icon}
        </div>
        <div className="diet-item__info">
          <span className="diet-item__name">{name}</span>
          <span className="diet-item__subtitle">{subtitle}</span>
          {dish?.notes && <span className="diet-item__notes">{dish.notes}</span>}
        </div>
        <div className="diet-item__checkbox" aria-hidden>
          <span>{item.checked ? "✓" : "○"}</span>
        </div>
      </button>
    </li>
  );
}

const style = new CSSStyleSheet();
style.replaceSync(`
.diet-item {
  width: 100%;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  background: rgba(255, 255, 255, 0.9);
  padding: 16px 18px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
  color: inherit;
  transition: transform 0.15s ease, border 0.15s ease, box-shadow 0.15s ease;
  min-height: 76px;
}
.diet-item:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 14px 30px -24px rgba(37, 99, 235, 0.6);
}
.diet-item--checked {
  background: rgba(59, 130, 246, 0.08);
  border-color: rgba(37, 99, 235, 0.6);
}
.diet-item__icon {
  height: 48px;
  width: 48px;
  border-radius: 14px;
  background: rgba(148, 163, 184, 0.18);
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  overflow: hidden;
}
.diet-item__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.diet-item__info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
.diet-item__name {
  font-weight: 700;
  font-size: 1.05rem;
  color: #0f172a;
}
.diet-item__subtitle {
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.35;
}
.diet-item__notes {
  font-size: 0.78rem;
  color: #64748b;
  line-height: 1.35;
}
.diet-item__checkbox {
  font-size: 1.4rem;
  color: #2563eb;
  font-weight: 700;
  margin-left: 12px;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}