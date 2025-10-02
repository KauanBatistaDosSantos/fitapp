import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Section } from "@/components/Section";
import { EmptyState } from "@/components/EmptyState";
import { useDiet } from "./diet.store";
import { mealLabels, mealOrder } from "./diet.service";
import type { MealName, WeeklyDietTemplate } from "./diet.schema";

type DishDraft = {
  name: string;
  unit: string;
  kcal: string;
  notes: string;
};

const defaultDish: DishDraft = { name: "", unit: "porção", kcal: "", notes: "" };

export default function DietConfigPage() {
  const { catalog, weekly, addDish, assignDishToDay, regenerateTodayFromWeekly } = useDiet();
  const [dishForm, setDishForm] = useState<DishDraft>(defaultDish);
  const [dow, setDow] = useState<keyof typeof weekly>("mon");
  const [meal, setMeal] = useState<MealName>("breakfast");
  const [dishId, setDishId] = useState<string>(catalog[0]?.id ?? "");
  const [qty, setQty] = useState("1");

  const weeklyPreview = useMemo(() => weekly[dow]?.meals ?? {}, [weekly, dow]);

  const handleDishSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!dishForm.name.trim()) return;
    addDish({
      name: dishForm.name.trim(),
      unit: dishForm.unit.trim() || "porção",
      kcal: dishForm.kcal ? Number(dishForm.kcal) : undefined,
      notes: dishForm.notes.trim() || undefined,
    });
    setDishForm(defaultDish);
  };

  const handleAssign = (evt: FormEvent) => {
    evt.preventDefault();
    if (!dishId) return;
    assignDishToDay(dow, meal, dishId, Number(qty) || 1);
    setQty("1");
  };

  return (
    <div className="app-card">
      <Section
        title="Catálogo de pratos"
        description="Cadastre refeições que você poderá reutilizar em qualquer dia da semana."
        action={<Link to="/diet">Voltar para hoje</Link>}
      >
        <form className="diet-form" onSubmit={handleDishSubmit}>
          <div className="diet-form__grid">
            <label>
              Nome do prato
              <input
                value={dishForm.name}
                onChange={(e) => setDishForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Unidade
              <input
                value={dishForm.unit}
                onChange={(e) => setDishForm((prev) => ({ ...prev, unit: e.target.value }))}
              />
            </label>
            <label>
              Calorias
              <input
                type="number"
                min={0}
                step="1"
                value={dishForm.kcal}
                onChange={(e) => setDishForm((prev) => ({ ...prev, kcal: e.target.value }))}
              />
            </label>
          </div>
          <label>
            Observações
            <input
              value={dishForm.notes}
              onChange={(e) => setDishForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Ingredientes, substituições etc."
            />
          </label>
          <button type="submit">Adicionar prato</button>
        </form>

        {catalog.length === 0 ? (
          <EmptyState title="Nenhum prato ainda" description="Cadastre pratos para montar os cardápios." />
        ) : (
          <ul className="diet-catalog">
            {catalog.map((dish) => (
              <li key={dish.id}>
                <strong>{dish.name}</strong>
                <span>
                  {dish.unit}
                  {dish.kcal ? ` · ${dish.kcal} kcal` : ""}
                </span>
                {dish.notes && <span className="diet-catalog__notes">{dish.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="Plano semanal"
        description="Escolha o dia, selecione o prato e defina a refeição."
        action={<button onClick={() => regenerateTodayFromWeekly(new Date())}>Gerar plano de hoje novamente</button>}
      >
        <form className="diet-form" onSubmit={handleAssign}>
          <div className="diet-form__grid diet-form__grid--assign">
            <label>
              Dia da semana
              <select value={dow} onChange={(e) => setDow(e.target.value as keyof typeof weekly)}>
                <option value="mon">Segunda</option>
                <option value="tue">Terça</option>
                <option value="wed">Quarta</option>
                <option value="thu">Quinta</option>
                <option value="fri">Sexta</option>
                <option value="sat">Sábado</option>
                <option value="sun">Domingo</option>
              </select>
            </label>
            <label>
              Refeição
              <select value={meal} onChange={(e) => setMeal(e.target.value as MealName)}>
                {mealOrder.map((m) => (
                  <option key={m} value={m}>
                    {mealLabels[m].title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Prato
              <select value={dishId} onChange={(e) => setDishId(e.target.value)}>
                <option value="" disabled>
                  Escolha um prato
                </option>
                {catalog.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Quantidade
              <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min={0.5} step={0.5} />
            </label>
          </div>
          <button type="submit" disabled={!dishId}>
            Adicionar ao plano
          </button>
        </form>

        <div className="diet-week-preview">
          <h3>Refeições de {weekDayLabel(dow)}</h3>
          {mealOrder.map((m) => {
            const items = weeklyPreview[m] ?? [];
            return (
              <div key={m} className="diet-week-preview__meal">
                <strong>{mealLabels[m].title}</strong>
                {items.length === 0 ? (
                  <span className="diet-week-preview__empty">Sem itens cadastrados.</span>
                ) : (
                  <ul>
                    {items.map((item) => {
                      const dish = catalog.find((d) => d.id === item.dishId);
                      return (
                        <li key={item.id}>
                          {dish?.name ?? "Prato removido"} · {item.qty} {dish?.unit ?? "un"}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function weekDayLabel(key: keyof WeeklyDietTemplate) {
  const labels: Record<string, string> = {
    mon: "segunda-feira",
    tue: "terça-feira",
    wed: "quarta-feira",
    thu: "quinta-feira",
    fri: "sexta-feira",
    sat: "sábado",
    sun: "domingo",
  };
  return labels[key] ?? key;
}

const style = new CSSStyleSheet();
style.replaceSync(`
.diet-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}
.diet-form__grid {
  display: grid;
  gap: 16px;
}
.diet-form__grid--assign {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}
.diet-form__grid label,
.diet-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-weight: 600;
  color: #1f2937;
}
.diet-catalog {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.diet-catalog li {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.3);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.diet-catalog span {
  font-size: 0.85rem;
  color: #475569;
}
.diet-catalog__notes {
  font-size: 0.8rem;
  color: #64748b;
}
.diet-week-preview {
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.35);
  padding: 18px;
  background: rgba(248, 250, 252, 0.75);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.diet-week-preview h3 {
  margin: 0;
}
.diet-week-preview__meal {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.diet-week-preview__meal ul {
  margin: 0;
  padding-left: 18px;
  color: #1f2937;
}
.diet-week-preview__empty {
  color: #94a3b8;
  font-size: 0.9rem;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}