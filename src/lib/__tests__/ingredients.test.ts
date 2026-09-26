import { describe, expect, it } from "vitest";
import { coreIngredient, ingredientsMatch, isStaple, slugifyIngredient } from "../ingredients";

describe("slugifyIngredient", () => {
  it("lowercases, trims and singularises", () => {
    expect(slugifyIngredient("  Chopped Tomatoes ")).toBe("chopped tomato");
    expect(slugifyIngredient("Eggs")).toBe("egg");
    expect(slugifyIngredient("Blueberries")).toBe("blueberry");
    expect(slugifyIngredient("Bay Leaves")).toBe("bay leaf");
    expect(slugifyIngredient("Radishes")).toBe("radish");
  });
  it("keeps words that are already singular", () => {
    expect(slugifyIngredient("Asparagus")).toBe("asparagus");
    expect(slugifyIngredient("Couscous")).toBe("couscous");
    expect(slugifyIngredient("Chives")).toBe("chives");
  });
  it("applies aliases", () => {
    expect(slugifyIngredient("Zucchini")).toBe("courgette");
    expect(slugifyIngredient("Spaghetti")).toBe("pasta");
  });
});

describe("ingredientsMatch", () => {
  it.each([
    ["tomato", "Chopped Tomatoes"],
    ["tomatoes", "Cherry Tomatoes"],
    ["chicken", "Chicken Breast"],
    ["chicken", "Chicken Thighs"],
    ["rice", "Basmati Rice"],
    ["onion", "Red Onions"],
    ["egg", "Egg Yolks"],
    ["garlic", "Garlic Clove"],
    ["beef", "Minced Beef"],
    ["flour", "Plain Flour"],
    ["sugar", "Caster Sugar"],
    ["pasta", "Spaghetti"],
    ["zucchini", "Courgettes"],
    ["cherry tomatoes", "tomato"],
  ])("%s matches %s", (a, b) => {
    expect(ingredientsMatch(a, b)).toBe(true);
  });

  it.each([
    ["chicken", "Chicken Stock"],
    ["butter", "Peanut Butter"],
    ["milk", "Coconut Milk"],
    ["rice", "Rice Vinegar"],
    ["potato", "Sweet Potatoes"],
    ["egg", "Eggplant"],
    ["oil", "Sesame Oil"],
  ])("%s does not match %s", (a, b) => {
    expect(ingredientsMatch(a, b)).toBe(false);
  });

  it("strips modifiers but never to an empty core", () => {
    expect(coreIngredient("Red")).toBe("red");
  });
});

describe("isStaple", () => {
  it("knows seasoning basics", () => {
    expect(isStaple("Salt")).toBe(true);
    expect(isStaple("Black Pepper")).toBe(true);
    expect(isStaple("Olive Oil")).toBe(true);
  });
  it("does not treat vegetables as staples", () => {
    expect(isStaple("Red Pepper")).toBe(false);
    expect(isStaple("Onion")).toBe(false);
  });
});
