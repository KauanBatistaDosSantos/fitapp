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
  imageUrl: string;
};

const defaultDish: DishDraft = { name: "", unit: "porção", kcal: "", notes: "", imageUrl: "" };

export default function DietConfigPage() {
  const {
    catalog,
    weekly,
    addDish,
    updateDish,
    removeDish,
    assignDishToDay,
    swapMeals,
    regenerateTodayFromWeekly,
  } = useDiet();
  const [dishForm, setDishForm] = useState<DishDraft>(defaultDish);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dow, setDow] = useState<keyof typeof weekly>("mon");
  const [meal, setMeal] = useState<MealName>("breakfast");
  const [dishId, setDishId] = useState<string>(catalog[0]?.id ?? "");
  const [qty, setQty] = useState("1");
  const [swapFrom, setSwapFrom] = useState<MealName>("lunch");
  const [swapTo, setSwapTo] = useState<MealName>("dinner");

  const weeklyPreview = useMemo(() => weekly[dow]?.meals ?? {}, [weekly, dow]);

  const handleDishSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!dishForm.name.trim()) return;
    addDish({
      name: dishForm.name.trim(),
      unit: dishForm.unit.trim() || "porção",
      kcal: dishForm.kcal ? Number(dishForm.kcal) : undefined,
      notes: dishForm.notes.trim() || undefined,
      imageUrl: dishForm.imageUrl.trim() || undefined,
    });
    setDishForm(defaultDish);
  };

  const handleAssign = (evt: FormEvent) => {
    evt.preventDefault();
    if (!dishId) return;
    assignDishToDay(dow, meal, dishId, Number(qty) || 1);
    setQty("1");
  };

  const handleEditSubmit = (evt: FormEvent) => {
    evt.preventDefault();
    if (!editingId) return;
    updateDish(editingId, {
      name: dishForm.name.trim() || "Prato",
      unit: dishForm.unit.trim() || "porção",
      kcal: dishForm.kcal ? Number(dishForm.kcal) : undefined,
      notes: dishForm.notes.trim() || undefined,
      imageUrl: dishForm.imageUrl.trim() || undefined,
    });
    setEditingId(null);
    setDishForm(defaultDish);
  };

  const startEdit = (id: string) => {
    const dish = catalog.find((item) => item.id === id);
    if (!dish) return;
    setEditingId(id);
    setDishForm({
      name: dish.name,
      unit: dish.unit,
      kcal: dish.kcal != null ? String(dish.kcal) : "",
      notes: dish.notes ?? "",
      imageUrl: dish.imageUrl ?? "",
    });
  };

  return (
    <div className="app-card">
      <Section
        title="Catálogo de pratos"
        description="Cadastre refeições que você poderá reutilizar em qualquer dia da semana."
        action={<Link to="/diet">Voltar para hoje</Link>}
      >
        <form className="diet-form" onSubmit={editingId ? handleEditSubmit : handleDishSubmit}>
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
          <label>
            Foto (URL)
            <input
              value={dishForm.imageUrl}
              onChange={(e) => setDishForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>
          <button type="submit">{editingId ? "Salvar alterações" : "Adicionar prato"}</button>
          {editingId && (
            <button type="button" className="diet-form__cancel" onClick={() => { setEditingId(null); setDishForm(defaultDish); }}>
              Cancelar edição
            </button>
          )}
        </form>

        {catalog.length === 0 ? (
          <EmptyState title="Nenhum prato ainda" description="Cadastre pratos para montar os cardápios." />
        ) : (
          <ul className="diet-catalog">
            {catalog.map((dish) => (
              <li key={dish.id}>
                {dish.imageUrl && <img src={dish.imageUrl} alt="" className="diet-catalog__thumb" />}
                <div>
                  <strong>{dish.name}</strong>
                  <span>
                    {dish.unit}
                    {dish.kcal ? ` · ${dish.kcal} kcal` : ""}
                  </span>
                  {dish.notes && <span className="diet-catalog__notes">{dish.notes}</span>}
                </div>
                <div className="diet-catalog__actions">
                  <button type="button" onClick={() => startEdit(dish.id)}>
                    Editar
                  </button>
                  <button type="button" className="diet-catalog__delete" onClick={() => removeDish(dish.id)}>
                    Excluir
                  </button>
                </div>
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

        <form
          className="diet-swap"
          onSubmit={(evt) => {
            evt.preventDefault();
            if (swapFrom === swapTo) return;
            swapMeals(dow, swapFrom, swapTo);
          }}
        >
          <span>Trocar refeições de {weekDayLabel(dow)}:</span>
          <select value={swapFrom} onChange={(e) => setSwapFrom(e.target.value as MealName)}>
            {mealOrder.map((m) => (
              <option key={m} value={m}>
                {mealLabels[m].title}
              </option>
            ))}
          </select>
          <span>com</span>
          <select value={swapTo} onChange={(e) => setSwapTo(e.target.value as MealName)}>
            {mealOrder.map((m) => (
              <option key={m} value={m}>
                {mealLabels[m].title}
              </option>
            ))}
          </select>
          <button type="submit">Trocar</button>
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
  gap: 12px;
  margin-bottom: 20px;
}
.diet-form__grid {
  display: grid;
  gap: 16px;
}
.diet-form__grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.diet-form__cancel {
  align-self: flex-start;
  background: transparent;
  border: 1px solid rgba(148, 163, 184, 0.35);
}
.diet-catalog {
  display: grid;
  gap: 12px;
}
.diet-catalog li {
  display: grid;
  gap: 10px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 16px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.8);
}
.diet-catalog__thumb {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  object-fit: cover;
}
.diet-catalog__notes {
  display: block;
  font-size: 0.8rem;
  color: #64748b;
}
.diet-catalog__actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.diet-catalog__delete {
  color: #b91c1c;
}
.diet-form__grid--assign {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: start;
}
.diet-week-preview {
  margin-top: 24px;
  display: grid;
  gap: 16px;
}
.diet-week-preview__meal {
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px;
  padding: 12px;
  background: rgba(248, 250, 252, 0.7);
}
.diet-week-preview__empty {
  display: block;
  color: #94a3b8;
  font-size: 0.9rem;
}
.diet-swap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin: 16px 0;
}
`);

if (typeof document !== "undefined" && !document.adoptedStyleSheets.includes(style)) {
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, style];
}