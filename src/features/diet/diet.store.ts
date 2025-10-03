import { create } from "zustand";
import { isoDate } from "@/lib/date";
import { load, remove, save, uid } from "@/lib/persist";
import type { WeeklyDietTemplate, DailyDietProgress, MealName, Dish } from "./diet.schema";
import { buildTodayFromTemplate } from "./diet.service";
import { dietCatalogSeed, weeklyDietSeed } from "./diet.seed";

type DietState = {
  catalog: Dish[];
  weekly: WeeklyDietTemplate;
  days: Record<string, DailyDietProgress>;
  selectedDateISO: string;
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
  selectDate: (date: Date) => void;
  regenerateDayFromWeekly: (date?: Date) => void;
  toggleItem: (meal: MealName, itemId: string) => void;
  toggleMeal: (meal: MealName) => void;
};

const useSeedData = import.meta.env.DEV;

const emptyCatalog: Dish[] = [];
const emptyWeekly: WeeklyDietTemplate = {} as WeeklyDietTemplate;

const catalogFallback = () => load("diet:catalog", useSeedData ? dietCatalogSeed : emptyCatalog);
const weeklyFallback = () => load("diet:weekly", useSeedData ? weeklyDietSeed : emptyWeekly);

type DietStateData = Pick<DietState, "catalog" | "weekly" | "days" | "selectedDateISO">;

const loadInitialState = (): DietStateData => {
  const catalog = catalogFallback();
  const weekly = weeklyFallback();
  const legacyToday = load<DailyDietProgress | null>("diet:today", null);
  const storedDays = load<Record<string, DailyDietProgress> | null>("diet:days", null);
  const baseDay = legacyToday ?? buildTodayFromTemplate(weekly);

  const days: Record<string, DailyDietProgress> =
    storedDays && Object.keys(storedDays).length > 0
      ? { ...storedDays }
      : { [baseDay.dateISO]: baseDay };

  if (!storedDays || Object.keys(storedDays).length === 0) {
    save("diet:days", days);
  }

  if (legacyToday) {
    days[legacyToday.dateISO] = legacyToday;
    save("diet:days", days);
    remove("diet:today");
  }

  const selectedStored = load<string>("diet:selectedDate", baseDay.dateISO);
  const selectedDateISO = days[selectedStored] ? selectedStored : baseDay.dateISO;

  return { catalog, weekly, days, selectedDateISO };
};

const persistDays = (days: Record<string, DailyDietProgress>) => {
  save("diet:days", days);
};

const ensureDay = (
  date: Date,
  weekly: WeeklyDietTemplate,
  days: Record<string, DailyDietProgress>,
) => {
  const target = isoDate(date);
  if (days[target]) return { target, days };
  const nextDays = { ...days, [target]: buildTodayFromTemplate(weekly, date) };
  persistDays(nextDays);
  return { target, days: nextDays };
};

const initialData = loadInitialState();

export const useDiet = create<DietState>((set) => ({
  catalog: initialData.catalog,
  weekly: initialData.weekly,
  days: initialData.days,
  selectedDateISO: initialData.selectedDateISO,

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

      const days = Object.fromEntries(
        Object.entries(state.days).map(([key, day]) => [
          key,
          {
            ...day,
            meals: Object.fromEntries(
              Object.entries(day.meals).map(([mealKey, list]) => [
                mealKey,
                (list ?? []).filter((item) => item.dishId !== id),
              ]),
            ) as DailyDietProgress["meals"],
          },
        ]),
      );

      save("diet:catalog", catalog);
      save("diet:weekly", weekly);
      persistDays(days);
      return { catalog, weekly, days };
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

  selectDate: (date) =>
    set((state) => {
      const nextDate = new Date(date);
      if (Number.isNaN(nextDate.getTime())) return {};
      const { target, days } = ensureDay(nextDate, state.weekly, state.days);
      save("diet:selectedDate", target);
      return { selectedDateISO: target, days };
    }),

  regenerateDayFromWeekly: (date) =>
    set((state) => {
      const baseDate = date ? new Date(date) : new Date(state.selectedDateISO ?? isoDate());
      if (Number.isNaN(baseDate.getTime())) return {};
      const target = isoDate(baseDate);
      const day = buildTodayFromTemplate(state.weekly, baseDate);
      const days = { ...state.days, [target]: day };
      persistDays(days);
      save("diet:selectedDate", target);
      return { days, selectedDateISO: target };
    }),

  toggleItem: (meal, itemId) =>
    set((state) => {
      const iso = state.selectedDateISO;
      const day = state.days[iso];
      if (!day) return {};
      const nextDay: DailyDietProgress = {
        ...day,
        meals: {
          ...day.meals,
          [meal]: (day.meals[meal] ?? []).map((item) =>
            item.id === itemId ? { ...item, checked: !item.checked } : item,
          ),
        },
      };
      const days = { ...state.days, [iso]: nextDay };
      persistDays(days);
      return { days };
    }),

  toggleMeal: (meal) =>
    set((state) => {
      const iso = state.selectedDateISO;
      const day = state.days[iso];
      if (!day) return {};
      const items = day.meals[meal] ?? [];
      const shouldCheck = items.some((item) => !item.checked);
      const nextDay: DailyDietProgress = {
        ...day,
        meals: {
          ...day.meals,
          [meal]: items.map((item) => ({ ...item, checked: shouldCheck })),
        },
      };
      const days = { ...state.days, [iso]: nextDay };
      persistDays(days);
      return { days };
    }),
}));