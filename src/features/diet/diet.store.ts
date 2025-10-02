// features/diet/diet.store.ts
import { create } from "zustand";
import { load, save, uid } from "@/lib/persist";
import { WeeklyDietTemplate, DailyDietProgress, MealName, Dish } from "./diet.schema";

type DietState = {
  catalog: Dish[];
  weekly: WeeklyDietTemplate;
  today: DailyDietProgress;
  addDish: (d: Omit<Dish,"id">) => void;
  assignDishToDay: (dow: keyof WeeklyDietTemplate, meal: MealName, dishId: string, qty?: number) => void;
  toggleTodayItem: (meal: MealName, itemId: string) => void;
  regenerateTodayFromWeekly: (date?: Date) => void; // copia plano do dia -> today
};

export const useDiet = create<DietState>((set, get) => ({
  catalog: load("diet:catalog", [] as Dish[]),
  weekly: load("diet:weekly", {} as WeeklyDietTemplate),
  today: load("diet:today", { dateISO: "", meals: {} } as DailyDietProgress),

  addDish: (d) => set(s => {
    const catalog = [...s.catalog, { id: uid(), ...d }];
    save("diet:catalog", catalog); return { catalog };
  }),

  assignDishToDay: (dow, meal, dishId, qty=1) => set(s => {
    const weekly = structuredClone(s.weekly);
    weekly[dow] ||= { meals: { } as any };
    weekly[dow].meals[meal] ||= [];
    weekly[dow].meals[meal].push({ id: uid(), dishId, qty });
    save("diet:weekly", weekly); return { weekly };
  }),

  regenerateTodayFromWeekly: (date=new Date()) => set(s => {
    const dow = ["sun","mon","tue","wed","thu","fri","sat"][date.getDay()] as keyof WeeklyDietTemplate;
    const src = s.weekly[dow]?.meals || {} as any;
    const meals = Object.fromEntries(
      Object.entries(src).map(([k, arr]: any) => [
        k, arr.map((it: any) => ({...it, checked:false}))
      ])
    ) as DailyDietProgress["meals"];
    const today = { dateISO: date.toISOString().slice(0,10), meals };
    save("diet:today", today); return { today };
  }),

  toggleTodayItem: (meal, itemId) => set(s => {
    const today = structuredClone(s.today);
    today.meals[meal] = today.meals[meal].map(i => i.id===itemId?{...i,checked:!i.checked}:i);
    save("diet:today", today); return { today };
  }),
}));
