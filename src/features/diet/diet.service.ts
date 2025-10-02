import { isoDate, weekDayKey } from "@/lib/date";
import type { Dish, MealName, WeeklyDietTemplate, DailyDietProgress } from "./diet.schema";

export const mealOrder: MealName[] = ["breakfast", "snack1", "lunch", "snack2", "dinner"];

export const mealLabels: Record<MealName, { title: string; icon: string }> = {
  breakfast: { title: "Café da manhã", icon: "☀️" },
  snack1: { title: "Lanche", icon: "🍎" },
  lunch: { title: "Almoço", icon: "⭐" },
  snack2: { title: "Lanche da tarde", icon: "🍵" },
  dinner: { title: "Jantar", icon: "🌙" },
};

export function buildTodayFromTemplate(
  weekly: WeeklyDietTemplate,
  date: Date = new Date(),
): DailyDietProgress {
  const dow = weekDayKey(date);
  const source = weekly[dow]?.meals ?? ({} as WeeklyDietTemplate[keyof WeeklyDietTemplate]["meals"]);
  const meals = Object.fromEntries(
    mealOrder.map((key) => [
      key,
      (source?.[key] ?? []).map((item) => ({ ...item, checked: false })),
    ]),
  ) as DailyDietProgress["meals"];

  return {
    dateISO: isoDate(date),
    meals,
  };
}

export function computeDietProgress(today: DailyDietProgress) {
  const totals = mealOrder.reduce(
    (acc, meal) => {
      const list = today.meals[meal] ?? [];
      acc.totalItems += list.length;
      acc.checkedItems += list.filter((it) => it.checked).length;
      acc.totalMeals += list.length > 0 ? 1 : 0;
      acc.completedMeals += list.length > 0 && list.every((it) => it.checked) ? 1 : 0;
      return acc;
    },
    { totalItems: 0, checkedItems: 0, totalMeals: 0, completedMeals: 0 },
  );

  const itemProgress = totals.totalItems === 0 ? 0 : totals.checkedItems / totals.totalItems;
  const mealProgress = totals.totalMeals === 0 ? 0 : totals.completedMeals / totals.totalMeals;

  return {
    ...totals,
    itemProgress,
    mealProgress,
  };
}

export function resolveDish(dishes: Dish[], dishId: string) {
  return dishes.find((dish) => dish.id === dishId);
}

export function mealTitle(meal: MealName) {
  return mealLabels[meal];
}