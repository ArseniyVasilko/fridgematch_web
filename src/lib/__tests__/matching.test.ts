import { describe, expect, it } from "vitest";
import { evaluateRecipe, rankRecipes, type CatalogueRecipe } from "../matching";

const recipe = (id: number, name: string, ingredients: [string, string][]): CatalogueRecipe => ({
  id,
  name,
  category: null,
  area: null,
  imageUrl: null,
  ingredients: ingredients.map(([n, measure]) => ({ name: n, measure })),
});

const eggFriedRice = recipe(1, "Egg Fried Rice", [
  ["Rice", "300g"],
  ["Eggs", "2"],
  ["Onion", "1"],
  ["Soy Sauce", "2 tbsp"],
  ["Salt", "pinch"],
]);
const tomatoSoup = recipe(2, "Tomato Soup", [
  ["Tomatoes", "6"],
  ["Onion", "1"],
  ["Vegetable Stock", "500ml"],
  ["Olive Oil", "2 tbsp"],
]);
const pancakes = recipe(3, "Pancakes", [
  ["Plain Flour", "100g"],
  ["Milk", "300ml"],
  ["Eggs", "2"],
]);
const saltOnly = recipe(4, "Salted Water", [["Salt", "1 tsp"], ["Water", "1l"]]);

describe("evaluateRecipe", () => {
  it("counts have / missing / staple ingredients", () => {
    const m = evaluateRecipe(eggFriedRice, [{ name: "rice" }, { name: "eggs" }, { name: "onion" }]);
    expect(m.total).toBe(5);
    expect(m.haveCount).toBe(4); // rice, eggs, onion + salt (basic)
    expect(m.missingCount).toBe(1); // soy sauce
    expect(m.score).toBeCloseTo(4 / 5);
    expect(m.ingredients.find((i) => i.name === "Salt")?.status).toBe("staple");
    expect(m.ingredients.find((i) => i.name === "Soy Sauce")?.status).toBe("missing");
  });

  it("counts basics as missing when assumeStaples is off", () => {
    const m = evaluateRecipe(eggFriedRice, [{ name: "rice" }], { assumeStaples: false });
    expect(m.ingredients.find((i) => i.name === "Salt")?.status).toBe("missing");
  });

  it("gives half a point when the pantry has only part of the amount", () => {
    const m = evaluateRecipe(pancakes, [
      { name: "eggs", quantity: 1, unit: "pcs", fromPantry: true },
      { name: "flour", quantity: 1, unit: "kg", fromPantry: true },
      { name: "milk", quantity: 1, unit: "l", fromPantry: true },
    ]);
    expect(m.ingredients.find((i) => i.name === "Eggs")?.status).toBe("partial");
    expect(m.ingredients.find((i) => i.name === "Plain Flour")?.status).toBe("have");
    expect(m.score).toBeCloseTo(2.5 / 3);
  });

  it("trusts the user when units cannot be compared", () => {
    const m = evaluateRecipe(pancakes, [{ name: "milk", quantity: 1, unit: "cup", fromPantry: true }]);
    // 1 cup = 240 ml < 300 ml -> partial, same base unit
    expect(m.ingredients.find((i) => i.name === "Milk")?.status).toBe("partial");
    const m2 = evaluateRecipe(pancakes, [{ name: "flour", quantity: 2, unit: "pcs", fromPantry: true }]);
    expect(m2.ingredients.find((i) => i.name === "Plain Flour")?.status).toBe("have");
  });

  it("flags pantry items that expire soon", () => {
    const now = new Date(2026, 8, 25);
    const m = evaluateRecipe(
      tomatoSoup,
      [{ name: "tomato", fromPantry: true, expiryDate: new Date(2026, 8, 26) }],
      { now },
    );
    expect(m.usesExpiring).toBe(1);
    expect(m.ingredients[0].expiringSoon).toBe(true);
  });
});

describe("rankRecipes", () => {
  const all = [eggFriedRice, tomatoSoup, pancakes, saltOnly];

  it("returns nothing without ingredients", () => {
    expect(rankRecipes(all, [])).toEqual([]);
  });

  it("only returns recipes that use at least one real ingredient", () => {
    const r = rankRecipes(all, [{ name: "salt" }, { name: "eggs" }]);
    expect(r.map((x) => x.recipe.name).sort()).toEqual(["Egg Fried Rice", "Pancakes"]);
  });

  it("sorts best match first", () => {
    const r = rankRecipes(all, [{ name: "eggs" }, { name: "rice" }, { name: "onion" }, { name: "tomato" }]);
    expect(r[0].recipe.name).toBe("Egg Fried Rice");
    expect(r.map((x) => x.recipe.name)).toEqual(["Egg Fried Rice", "Tomato Soup", "Pancakes"]);
  });

  it("filters by maximum missing ingredients", () => {
    const r = rankRecipes(all, [{ name: "eggs" }, { name: "rice" }, { name: "onion" }], { maxMissing: 1 });
    expect(r.map((x) => x.recipe.name)).toEqual(["Egg Fried Rice"]);
  });

  it("breaks ties in favour of recipes that use expiring food", () => {
    const now = new Date(2026, 8, 25);
    const a = recipe(10, "A", [["Spinach", "1"], ["Cheese", "1"]]);
    const b = recipe(11, "B", [["Spinach", "1"], ["Ham", "1"]]);
    const r = rankRecipes(
      [a, b],
      [
        { name: "spinach" },
        { name: "ham", fromPantry: true, expiryDate: new Date(2026, 8, 26) },
        { name: "cheese" },
      ],
      { now },
    );
    expect(r[0].recipe.name).toBe("B");
  });
});
