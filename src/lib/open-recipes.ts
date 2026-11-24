/**
 * Open Recipe Corpus (https://github.com/rippy1911/open-recipe-corpus): open
 * recipes from Wikibooks and public-domain cookbooks, CC BY-SA 4.0. Used as a
 * second recipe source next to TheMealDB (scripts/sync-open-recipes.ts).
 *
 * The corpus keeps amounts and text in two files that share an id:
 * data/recipes.jsonl (metadata, quantities) and data/text/en.jsonl (English
 * names and steps). Only recipes with English text are imported.
 */
import { titleCase } from "./ingredients";
import type { NormalisedMeal } from "./mealdb";

export interface OpenRecipeMeta {
  id: string;
  category: string | null;
  dish_type: string | null;
  cuisine: string | null;
  tags?: string[];
  ingredients: { qty: number | null; unit: string | null }[];
  provenance: {
    url: string;
    attribution: string;
    license: string;
    based_on?: { book?: string; author?: string; year?: string };
  };
}

export interface OpenRecipeText {
  id: string;
  name: string;
  ingredients: { name: string; note?: string }[];
  steps: string[];
  machine_translated?: boolean;
}

/** Not meals to cook from a fridge: jams, pickles and drinks are left out. */
const SKIPPED_DISH_TYPES = new Set(["preserve", "drink"]);

/** TheMealDB-style categories, so mealTypeOf() groups them like the rest of the catalogue. */
function categoryOf(meta: OpenRecipeMeta): string {
  switch (meta.dish_type) {
    case "breakfast":
      return "Breakfast";
    case "dessert":
    case "cake":
    case "cookie":
      return "Dessert";
    case "soup":
    case "snack":
      return "Starter";
    case "side":
    case "salad":
    case "sauce":
    case "bread":
      return "Side";
    case "main":
      return "Main";
  }
  if (meta.category === "breakfast") return "Breakfast";
  if (meta.category === "dessert") return "Dessert";
  if (meta.category === "snack") return "Starter";
  return "Main";
}

/** "middle_eastern" -> "Middle Eastern"; "other" -> null. */
function areaOf(cuisine: string | null): string | null {
  if (!cuisine || cuisine === "other") return null;
  return cuisine
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const COUNT_WORDS: Record<string, [one: string, many: string]> = {
  clove: ["clove", "cloves"],
  slice: ["slice", "slices"],
  bunch: ["bunch", "bunches"],
};

/** A measure in the same free-text style as TheMealDB: "200 g", "2", "2 cloves", "to taste". */
export function measureOf({ qty, unit }: { qty: number | null; unit: string | null }): string {
  if (unit === "to_taste") return "to taste";
  if (unit === "pinch") return qty && qty !== 1 ? `${qty} pinches` : "pinch";
  if (qty == null) return "";
  if (!unit || unit === "pcs") return String(qty);
  const words = COUNT_WORDS[unit];
  if (words) return `${qty} ${qty === 1 ? words[0] : words[1]}`;
  return `${qty} ${unit}`;
}

function creditOf(meta: OpenRecipeMeta, text: OpenRecipeText): string {
  const translated = text.machine_translated ? "machine-translated and " : "";
  return `${meta.provenance.attribution}; ${translated}structured by the Open Recipe Corpus (CC BY-SA 4.0)`;
}

/** One corpus recipe in the importer's format, or null if it should be skipped. */
export function normaliseOpenRecipe(meta: OpenRecipeMeta, text: OpenRecipeText): NormalisedMeal | null {
  if (meta.dish_type && SKIPPED_DISH_TYPES.has(meta.dish_type)) return null;
  if (!text.name?.trim() || text.steps.length === 0) return null;
  // amounts and names line up by position
  const ingredients = text.ingredients
    .map((ing, i) => ({ name: titleCase(ing.name.trim()), measure: measureOf(meta.ingredients[i] ?? { qty: null, unit: null }) }))
    .filter((ing) => ing.name);
  if (ingredients.length === 0) return null;
  return {
    externalId: `orc:${meta.id}`,
    name: text.name.trim(),
    category: categoryOf(meta),
    area: areaOf(meta.cuisine),
    instructions: text.steps.map((s) => s.trim()).filter(Boolean).join("\n"),
    imageUrl: null,
    youtubeUrl: null,
    sourceUrl: meta.provenance.url,
    tags: meta.tags?.length ? meta.tags.join(",") : null,
    ingredients,
    attribution: creditOf(meta, text),
  };
}

/** Joins the two JSON Lines files and normalises every recipe that has English text. */
export function parseOpenRecipeCorpus(recipesJsonl: string, textJsonl: string) {
  const texts = new Map<string, OpenRecipeText>();
  for (const line of textJsonl.split("\n")) {
    if (!line.trim()) continue;
    const t = JSON.parse(line) as OpenRecipeText;
    texts.set(t.id, t);
  }
  const meals: NormalisedMeal[] = [];
  for (const line of recipesJsonl.split("\n")) {
    if (!line.trim()) continue;
    const meta = JSON.parse(line) as OpenRecipeMeta;
    const text = texts.get(meta.id);
    const meal = text && normaliseOpenRecipe(meta, text);
    if (meal) meals.push(meal);
  }
  return meals;
}
