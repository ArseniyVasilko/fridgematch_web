import { describe, expect, it } from "vitest";
import { applyFilters, dietsOf, mealTypeOf, type RecipeFacets } from "../recipe-filters";
import { parseList } from "../search-params";

const fits = (ingredients: string[]) => [...dietsOf(ingredients)].sort();

describe("dietsOf", () => {
  it("fits every diet for plain vegetables", () => {
    expect(fits(["Tomatoes", "Onion", "Olive Oil"])).toEqual(
      ["dairy-free", "egg-free", "gluten-free", "nut-free", "pescatarian", "vegan", "vegetarian"],
    );
  });

  it("does not mistake look-alike names", () => {
    // eggplant is not egg, butternut/nutmeg/water chestnut are not nuts, butter beans are not butter
    expect(fits(["Egg Plants", "Butternut Squash", "Nutmeg", "Water Chestnut", "Butter Beans"])).toContain("vegan");
    expect(fits(["Butternut Squash", "Nutmeg", "Water Chestnut"])).toContain("nut-free");
  });

  it("treats plant milks and creams as vegan", () => {
    expect(fits(["Coconut Milk", "Coconut Cream", "Soya Milk", "Cream Of Tartar"])).toContain("vegan");
    expect(fits(["Almond Milk"])).not.toContain("nut-free");
  });

  it("counts a phrase once, by what it really is", () => {
    const peanutButter = fits(["Peanut Butter"]);
    expect(peanutButter).toContain("dairy-free");
    expect(peanutButter).not.toContain("nut-free");

    const goatsCheese = fits(["Goats Cheese"]);
    expect(goatsCheese).toContain("vegetarian");
    expect(goatsCheese).not.toContain("dairy-free");
  });

  it("separates meat, fish and vegetarian stock", () => {
    expect(fits(["Chicken Stock"])).not.toContain("pescatarian");
    expect(fits(["Bouillon Cubes"])).not.toContain("vegetarian");
    expect(fits(["Vegetable Stock Cube"])).toContain("vegan");
    const fishSauce = fits(["Fish Sauce"]);
    expect(fishSauce).toContain("pescatarian");
    expect(fishSauce).not.toContain("vegetarian");
  });

  it("catches hidden animal products", () => {
    expect(fits(["Gelatine Leafs"])).not.toContain("vegetarian");
    expect(fits(["Worcestershire Sauce"])).not.toContain("vegetarian");
    const honey = fits(["Honey"]);
    expect(honey).toContain("vegetarian");
    expect(honey).not.toContain("vegan");
  });

  it("finds gluten, but not in gluten-free flours", () => {
    expect(fits(["Soy Sauce"])).not.toContain("gluten-free");
    expect(fits(["Spaghetti"])).not.toContain("gluten-free");
    expect(fits(["Rice Flour", "Rice Noodles", "Corn Tortillas", "Glutinous Rice"])).toContain("gluten-free");
    const eggNoodles = fits(["Egg Noodles"]);
    expect(eggNoodles).not.toContain("gluten-free");
    expect(eggNoodles).not.toContain("egg-free");
  });
});

describe("mealTypeOf", () => {
  it("groups TheMealDB categories into courses", () => {
    expect(mealTypeOf("Breakfast")).toBe("breakfast");
    expect(mealTypeOf("Dessert")).toBe("dessert");
    expect(mealTypeOf("Starter")).toBe("side");
    expect(mealTypeOf("Side")).toBe("side");
    expect(mealTypeOf("Beef")).toBe("main");
    expect(mealTypeOf("Vegetarian")).toBe("main");
    expect(mealTypeOf(null)).toBeNull();
  });
});

describe("applyFilters", () => {
  const facet = (mealType: RecipeFacets["mealType"], diets: string[], cuisine: string | null) =>
    ({ mealType, diets: new Set(diets), cuisine }) as RecipeFacets;
  const recipes = [
    facet("main", ["vegetarian", "vegan"], "Thai"),
    facet("main", ["vegetarian"], "Italian"),
    facet("dessert", ["vegetarian", "vegan"], "Italian"),
    facet("side", [], "Thai"),
  ];
  const run = (filters: Partial<Parameters<typeof applyFilters>[2]>) =>
    applyFilters(recipes, (f) => f, { types: [], diets: [], cuisine: null, ...filters });

  it("shows recipes of any chosen meal type", () => {
    expect(run({ types: ["main", "dessert"] }).items).toHaveLength(3);
  });

  it("needs every chosen diet", () => {
    expect(run({ diets: ["vegetarian", "vegan"] }).items).toHaveLength(2);
  });

  it("combines groups", () => {
    expect(run({ types: ["main"], diets: ["vegan"], cuisine: "Thai" }).items).toEqual([recipes[0]]);
  });

  it("counts meal types and cuisines as if that group were unset, diets on top", () => {
    const { counts } = run({ types: ["main"], diets: ["vegetarian"] });
    // meal type counts ignore the chosen type but keep the diet
    expect(counts.types).toEqual({ breakfast: 0, main: 2, side: 0, dessert: 1 });
    // diet counts keep both current filters and add the diet
    expect(counts.diets.vegan).toBe(1);
    expect(counts.cuisines).toEqual({ Thai: 1, Italian: 1 });
  });
});

describe("parseList", () => {
  const allowed = ["main", "side", "dessert"] as const;
  it("reads repeated and comma separated values, dropping unknown ones", () => {
    expect(parseList(["main", "dessert"], allowed)).toEqual(["main", "dessert"]);
    expect(parseList("side,main,pizza,main", allowed)).toEqual(["main", "side"]);
    expect(parseList(undefined, allowed)).toEqual([]);
  });
});
