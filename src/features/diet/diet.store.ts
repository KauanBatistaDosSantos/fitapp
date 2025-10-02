import { create } from "zustand";
import { load, save, uid } from "@/lib/persist";
import type { WeeklyDietTemplate, DailyDietProgress, MealName, Dish } from "./diet.schema";
import { buildTodayFromTemplate } from "./diet.service";
import { dietCatalogSeed, weeklyDietSeed } from "./diet.seed";

type DietState = {
  catalog: Dish[];
  weekly: WeeklyDietTemplate;
  today: DailyDietProgress;
  addDish: (d: Omit<Dish, "id">) => void;
  updateDish: (id: string, patch: Partial<Dish>) => void;
  removeDish: (id: string) => void;
  assignDishToDay: (
    dow: keyof WeeklyDietTemplate,
    meal: MealName,
    dishId: string,
    qty?: number,
  ) => void;
  swapMeals: (dow: keyof WeeklyDietTemplate, a: MealName, b: MealName) => void;
  toggleTodayItem: (meal: MealName, itemId: string) => void;
  toggleTodayMeal: (meal: MealName) => void;
  regenerateTodayFromWeekly: (date?: Date) => void;
};

const catalogFallback = () => load("diet:catalog", dietCatalogSeed);
const weeklyFallback = () => load("diet:weekly", weeklyDietSeed);
const todayFallback = () => {
  const saved = load<DailyDietProgress | null>("diet:today", null);
  if (saved) return saved;
  return buildTodayFromTemplate(weeklyDietSeed);
};

export const useDiet = create<DietState>((set) => ({
  catalog: catalogFallback(),
  weekly: weeklyFallback(),
  today: todayFallback(),

  addDish: (d) =>
    set((state) => {
      const catalog = [...state.catalog, { id: uid(), ...d }];
      save("diet:catalog", catalog);
      return { catalog };
    }),

  updateDish: (id, patch) =>
    set((state) => {
      const catalog = state.catalog.map((dish) => (dish.id === id ? { ...dish, ...patch } : dish));
      save("diet:catalog", catalog);
      return { catalog };
    }),

  removeDish: (id) =>
    set((state) => {
      const catalog = state.catalog.filter((dish) => dish.id !== id);
      const weekly = structuredClone(state.weekly);
      for (const day of Object.values(weekly)) {
        if (!day?.meals) continue;
        for (const meal of Object.keys(day.meals) as MealName[]) {
          day.meals[meal] = (day.meals[meal] ?? []).filter((item) => item.dishId !== id);
        }
      }
      save("diet:catalog", catalog);
      save("diet:weekly", weekly);
      return { catalog, weekly };
    }),

  assignDishToDay: (dow, meal, dishId, qty = 1) =>
    set((state) => {
      const weekly = structuredClone(state.weekly);
      weekly[dow] ??= { meals: {} as WeeklyDietTemplate[keyof WeeklyDietTemplate]["meals"] };
      weekly[dow].meals ??= {} as WeeklyDietTemplate[keyof WeeklyDietTemplate]["meals"];
      weekly[dow].meals[meal] ??= [];
      weekly[dow].meals[meal].push({ id: uid(), dishId, qty });
      save("diet:weekly", weekly);
      return { weekly };
    }),

  swapMeals: (dow, a, b) =>
    set((state) => {
      const weekly = structuredClone(state.weekly);
      const day = weekly[dow];
      if (!day?.meals) return {};
      const temp = day.meals[a] ?? [];
      day.meals[a] = day.meals[b] ?? [];
      day.meals[b] = temp;
      save("diet:weekly", weekly);
      return { weekly };
    }),

  regenerateTodayFromWeekly: (date = new Date()) =>
    set((state) => {
      const today = buildTodayFromTemplate(state.weekly, date);
      save("diet:today", today);
      return { today };
    }),

  toggleTodayItem: (meal, itemId) =>
    set((state) => {
      const today = structuredClone(state.today);
      today.meals[meal] = (today.meals[meal] ?? []).map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item,
      );
      save("diet:today", today);
      return { today };
    }),

  toggleTodayMeal: (meal) =>
    set((state) => {
      const today = structuredClone(state.today);
      const items = today.meals[meal] ?? [];
      const shouldCheck = items.some((item) => !item.checked);
      today.meals[meal] = items.map((item) => ({ ...item, checked: shouldCheck }));
      save("diet:today", today);
      return { today };
    }),
}));