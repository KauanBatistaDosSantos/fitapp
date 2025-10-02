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
  assignDishToDay: (
    dow: keyof WeeklyDietTemplate,
    meal: MealName,
    dishId: string,
    qty?: number,
  ) => void;
  toggleTodayItem: (meal: MealName, itemId: string) => void;
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
}));