import { Dish, WeeklyDietTemplate } from "./diet.schema";

type MealSeedItem = [dishId: string, qty?: number, id?: string];

const meal = (items: MealSeedItem[], prefix: string) =>
  items.map(([dishId, qty = 1, id], index) => ({
    id: id ?? `${prefix}-${index + 1}`,
    dishId,
    qty,
  }));

export const dietCatalogSeed: Dish[] = [
  { id: "dish-tapioca", name: "Tapioca recheada", unit: "porção", kcal: 280, notes: "Recheio com ovos mexidos" },
  { id: "dish-omelete", name: "Omelete de claras", unit: "porção", kcal: 210 },
  { id: "dish-frutas", name: "Mix de frutas", unit: "tigela", kcal: 150 },
  { id: "dish-cafe", name: "Café sem açúcar", unit: "xícara", kcal: 2 },
  { id: "dish-iogurte", name: "Iogurte natural", unit: "copinho", kcal: 110 },
  { id: "dish-mixnuts", name: "Mix de nuts", unit: "porção", kcal: 180 },
  { id: "dish-frango", name: "Peito de frango grelhado", unit: "filé", kcal: 240 },
  { id: "dish-arroz", name: "Arroz integral", unit: "concha", kcal: 150 },
  { id: "dish-feijao", name: "Feijão preto", unit: "concha", kcal: 120 },
  { id: "dish-salada", name: "Salada verde", unit: "porção", kcal: 60 },
  { id: "dish-suco", name: "Suco verde", unit: "copo", kcal: 90 },
  { id: "dish-wrap", name: "Wrap integral com frango", unit: "unidade", kcal: 320 },
  { id: "dish-whey", name: "Shake de whey", unit: "copo", kcal: 180 },
  { id: "dish-banana", name: "Banana", unit: "unidade", kcal: 90 },
  { id: "dish-saladafrutas", name: "Salada de frutas", unit: "tigela", kcal: 170 },
  { id: "dish-sopa", name: "Sopa de legumes", unit: "tigela", kcal: 210 },
  { id: "dish-peixe", name: "Filé de peixe assado", unit: "filé", kcal: 220 },
  { id: "dish-batata", name: "Batata doce assada", unit: "porção", kcal: 160 },
  { id: "dish-chá", name: "Chá de camomila", unit: "xícara", kcal: 0 },
];

export const weeklyDietSeed: WeeklyDietTemplate = {
  mon: {
    meals: {
      breakfast: meal(
        [
          ["dish-tapioca", 1, "mon-bf-tapioca"],
          ["dish-cafe", 1, "mon-bf-cafe"],
          ["dish-frutas", 1, "mon-bf-frutas"],
        ],
        "mon-breakfast",
      ),
      snack1: meal(
        [
          ["dish-iogurte", 1, "mon-sn1-iogurte"],
          ["dish-mixnuts", 1, "mon-sn1-nuts"],
        ],
        "mon-snack1",
      ),
      lunch: meal(
        [
          ["dish-frango", 1, "mon-lu-frango"],
          ["dish-arroz", 1, "mon-lu-arroz"],
          ["dish-feijao", 1, "mon-lu-feijao"],
          ["dish-salada", 1, "mon-lu-salada"],
        ],
        "mon-lunch",
      ),
      snack2: meal(
        [
          ["dish-whey", 1, "mon-sn2-whey"],
          ["dish-banana", 1, "mon-sn2-banana"],
        ],
        "mon-snack2",
      ),
      dinner: meal(
        [
          ["dish-peixe", 1, "mon-di-peixe"],
          ["dish-batata", 1, "mon-di-batata"],
          ["dish-salada", 1, "mon-di-salada"],
          ["dish-chá", 1, "mon-di-cha"],
        ],
        "mon-dinner",
      ),
    },
  },
  tue: {
    meals: {
      breakfast: meal(
        [
          ["dish-omelete", 1, "tue-bf-omelete"],
          ["dish-cafe", 1, "tue-bf-cafe"],
          ["dish-frutas", 1, "tue-bf-frutas"],
        ],
        "tue-breakfast",
      ),
      snack1: meal(
        [
          ["dish-iogurte", 1, "tue-sn1-iogurte"],
          ["dish-mixnuts", 1, "tue-sn1-nuts"],
        ],
        "tue-snack1",
      ),
      lunch: meal(
        [
          ["dish-frango", 1, "tue-lu-frango"],
          ["dish-arroz", 1, "tue-lu-arroz"],
          ["dish-salada", 1, "tue-lu-salada"],
        ],
        "tue-lunch",
      ),
      snack2: meal(
        [
          ["dish-wrap", 1, "tue-sn2-wrap"],
          ["dish-suco", 1, "tue-sn2-suco"],
        ],
        "tue-snack2",
      ),
      dinner: meal(
        [
          ["dish-sopa", 1, "tue-di-sopa"],
          ["dish-salada", 1, "tue-di-salada"],
          ["dish-chá", 1, "tue-di-cha"],
        ],
        "tue-dinner",
      ),
    },
  },
  wed: {
    meals: {
      breakfast: meal(
        [
          ["dish-tapioca", 1, "wed-bf-tapioca"],
          ["dish-cafe", 1, "wed-bf-cafe"],
          ["dish-frutas", 1, "wed-bf-frutas"],
        ],
        "wed-breakfast",
      ),
      snack1: meal(
        [
          ["dish-iogurte", 1, "wed-sn1-iogurte"],
          ["dish-mixnuts", 1, "wed-sn1-nuts"],
        ],
        "wed-snack1",
      ),
      lunch: meal(
        [
          ["dish-frango", 1, "wed-lu-frango"],
          ["dish-arroz", 1, "wed-lu-arroz"],
          ["dish-feijao", 1, "wed-lu-feijao"],
          ["dish-salada", 1, "wed-lu-salada"],
        ],
        "wed-lunch",
      ),
      snack2: meal(
        [
          ["dish-whey", 1, "wed-sn2-whey"],
          ["dish-banana", 1, "wed-sn2-banana"],
        ],
        "wed-snack2",
      ),
      dinner: meal(
        [
          ["dish-peixe", 1, "wed-di-peixe"],
          ["dish-batata", 1, "wed-di-batata"],
          ["dish-salada", 1, "wed-di-salada"],
          ["dish-chá", 1, "wed-di-cha"],
        ],
        "wed-dinner",
      ),
    },
  },
  thu: {
    meals: {
      breakfast: meal(
        [
          ["dish-omelete", 1, "thu-bf-omelete"],
          ["dish-cafe", 1, "thu-bf-cafe"],
          ["dish-frutas", 1, "thu-bf-frutas"],
        ],
        "thu-breakfast",
      ),
      snack1: meal(
        [
          ["dish-iogurte", 1, "thu-sn1-iogurte"],
          ["dish-mixnuts", 1, "thu-sn1-nuts"],
        ],
        "thu-snack1",
      ),
      lunch: meal(
        [
          ["dish-frango", 1, "thu-lu-frango"],
          ["dish-arroz", 1, "thu-lu-arroz"],
          ["dish-salada", 1, "thu-lu-salada"],
        ],
        "thu-lunch",
      ),
      snack2: meal(
        [
          ["dish-wrap", 1, "thu-sn2-wrap"],
          ["dish-suco", 1, "thu-sn2-suco"],
        ],
        "thu-snack2",
      ),
      dinner: meal(
        [
          ["dish-sopa", 1, "thu-di-sopa"],
          ["dish-salada", 1, "thu-di-salada"],
          ["dish-chá", 1, "thu-di-cha"],
        ],
        "thu-dinner",
      ),
    },
  },
  fri: {
    meals: {
      breakfast: meal(
        [
          ["dish-tapioca", 1, "fri-bf-tapioca"],
          ["dish-cafe", 1, "fri-bf-cafe"],
          ["dish-frutas", 1, "fri-bf-frutas"],
        ],
        "fri-breakfast",
      ),
      snack1: meal(
        [
          ["dish-iogurte", 1, "fri-sn1-iogurte"],
          ["dish-mixnuts", 1, "fri-sn1-nuts"],
        ],
        "fri-snack1",
      ),
      lunch: meal(
        [
          ["dish-frango", 1, "fri-lu-frango"],
          ["dish-arroz", 1, "fri-lu-arroz"],
          ["dish-feijao", 1, "fri-lu-feijao"],
          ["dish-salada", 1, "fri-lu-salada"],
        ],
        "fri-lunch",
      ),
      snack2: meal(
        [
          ["dish-whey", 1, "fri-sn2-whey"],
          ["dish-banana", 1, "fri-sn2-banana"],
        ],
        "fri-snack2",
      ),
      dinner: meal(
        [
          ["dish-peixe", 1, "fri-di-peixe"],
          ["dish-batata", 1, "fri-di-batata"],
          ["dish-salada", 1, "fri-di-salada"],
          ["dish-chá", 1, "fri-di-cha"],
        ],
        "fri-dinner",
      ),
    },
  },
  sat: {
    meals: {
      breakfast: meal(
        [
          ["dish-saladafrutas", 1, "sat-bf-saladafrutas"],
          ["dish-cafe", 1, "sat-bf-cafe"],
        ],
        "sat-breakfast",
      ),
      snack1: meal([["dish-mixnuts", 1, "sat-sn1-nuts"]], "sat-snack1"),
      lunch: meal(
        [
          ["dish-frango", 1, "sat-lu-frango"],
          ["dish-arroz", 1, "sat-lu-arroz"],
          ["dish-salada", 1, "sat-lu-salada"],
        ],
        "sat-lunch",
      ),
      snack2: meal(
        [
          ["dish-whey", 1, "sat-sn2-whey"],
          ["dish-banana", 1, "sat-sn2-banana"],
        ],
        "sat-snack2",
      ),
      dinner: meal(
        [
          ["dish-sopa", 1, "sat-di-sopa"],
          ["dish-chá", 1, "sat-di-cha"],
        ],
        "sat-dinner",
      ),
    },
  },
  sun: {
    meals: {
      breakfast: meal(
        [
          ["dish-saladafrutas", 1, "sun-bf-salada"],
          ["dish-cafe", 1, "sun-bf-cafe"],
        ],
        "sun-breakfast",
      ),
      snack1: meal([["dish-iogurte", 1, "sun-sn1-iogurte"]], "sun-snack1"),
      lunch: meal(
        [
          ["dish-peixe", 1, "sun-lu-peixe"],
          ["dish-batata", 1, "sun-lu-batata"],
          ["dish-salada", 1, "sun-lu-salada"],
        ],
        "sun-lunch",
      ),
      snack2: meal(
        [
          ["dish-wrap", 1, "sun-sn2-wrap"],
          ["dish-suco", 1, "sun-sn2-suco"],
        ],
        "sun-snack2",
      ),
      dinner: meal(
        [
          ["dish-sopa", 1, "sun-di-sopa"],
          ["dish-chá", 1, "sun-di-cha"],
        ],
        "sun-dinner",
      ),
    },
  },
};