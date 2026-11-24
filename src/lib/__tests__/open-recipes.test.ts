import { describe, expect, it } from "vitest";
import { measureOf, normaliseOpenRecipe, parseOpenRecipeCorpus, type OpenRecipeMeta, type OpenRecipeText } from "../open-recipes";
import { parseMeasure } from "../measure";

const meta = (overrides: Partial<OpenRecipeMeta> = {}): OpenRecipeMeta => ({
  id: "plwb:10140",
  category: "dinner",
  dish_type: "side",
  cuisine: "polish",
  tags: ["gluten_free", "dairy_free"],
  ingredients: [
    { qty: 200, unit: "g" },
    { qty: 500, unit: "ml" },
    { qty: null, unit: "to_taste" },
  ],
  provenance: {
    url: "https://pl.wikibooks.org/wiki/Ksi%C4%85%C5%BCka_kucharska/Sma%C5%BCony_ry%C5%BC",
    attribution: "Autorzy Wikibooks (pl.wikibooks.org, Książka kucharska)",
    license: "CC-BY-SA-4.0",
  },
  ...overrides,
});

const text = (overrides: Partial<OpenRecipeText> = {}): OpenRecipeText => ({
  id: "plwb:10140",
  name: "Pan-browned braised rice",
  ingredients: [{ name: "long-grain rice", note: "dry" }, { name: "broth" }, { name: "vegetable oil" }],
  steps: ["Toast the rice in oil.", "Add the hot broth and simmer."],
  machine_translated: true,
  ...overrides,
});

describe("measureOf", () => {
  it.each([
    [{ qty: 200, unit: "g" }, "200 g"],
    [{ qty: 2, unit: "pcs" }, "2"],
    [{ qty: 1.5, unit: "tbsp" }, "1.5 tbsp"],
    [{ qty: 2, unit: "clove" }, "2 cloves"],
    [{ qty: 1, unit: "bunch" }, "1 bunch"],
    [{ qty: null, unit: "to_taste" }, "to taste"],
    [{ qty: null, unit: "pinch" }, "pinch"],
    [{ qty: null, unit: "g" }, ""],
  ])("writes %o as %s", (input, expected) => {
    expect(measureOf(input)).toBe(expected);
  });

  it("writes amounts the matcher can compare", () => {
    expect(parseMeasure(measureOf({ qty: 200, unit: "g" }))).toEqual({ value: 200, unit: "g" });
    expect(parseMeasure(measureOf({ qty: 2, unit: "tbsp" }))).toEqual({ value: 30, unit: "ml" });
  });
});

describe("normaliseOpenRecipe", () => {
  it("converts a corpus recipe to the importer's format", () => {
    const meal = normaliseOpenRecipe(meta(), text())!;
    expect(meal.externalId).toBe("orc:plwb:10140");
    expect(meal.category).toBe("Side");
    expect(meal.area).toBe("Polish");
    expect(meal.ingredients).toEqual([
      { name: "Long-Grain Rice", measure: "200 g" },
      { name: "Broth", measure: "500 ml" },
      { name: "Vegetable Oil", measure: "to taste" },
    ]);
    expect(meal.instructions).toBe("Toast the rice in oil.\nAdd the hot broth and simmer.");
    expect(meal.imageUrl).toBeNull();
    expect(meal.sourceUrl).toContain("wikibooks.org");
    expect(meal.attribution).toContain("Autorzy Wikibooks");
    expect(meal.attribution).toContain("machine-translated");
  });

  it("maps dish types and cuisines", () => {
    expect(normaliseOpenRecipe(meta({ dish_type: "cake" }), text())?.category).toBe("Dessert");
    expect(normaliseOpenRecipe(meta({ dish_type: "soup" }), text())?.category).toBe("Starter");
    expect(normaliseOpenRecipe(meta({ dish_type: "other", category: "breakfast" }), text())?.category).toBe("Breakfast");
    expect(normaliseOpenRecipe(meta({ cuisine: "middle_eastern" }), text())?.area).toBe("Middle Eastern");
    expect(normaliseOpenRecipe(meta({ cuisine: "other" }), text())?.area).toBeNull();
  });

  it("skips drinks, preserves and recipes without steps", () => {
    expect(normaliseOpenRecipe(meta({ dish_type: "drink" }), text())).toBeNull();
    expect(normaliseOpenRecipe(meta({ dish_type: "preserve" }), text())).toBeNull();
    expect(normaliseOpenRecipe(meta(), text({ steps: [] }))).toBeNull();
  });
});

describe("parseOpenRecipeCorpus", () => {
  it("joins the two files by id and keeps only recipes with English text", () => {
    const recipes = [JSON.stringify(meta()), JSON.stringify(meta({ id: "plws:1" }))].join("\n");
    const english = JSON.stringify(text()) + "\n";
    const meals = parseOpenRecipeCorpus(recipes, english);
    expect(meals.map((m) => m.externalId)).toEqual(["orc:plwb:10140"]);
  });
});
