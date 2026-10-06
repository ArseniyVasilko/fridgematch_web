/**
 * Recipe filters: meal type, diet and cuisine.
 *
 * TheMealDB's categories mix courses with main ingredients ("Dessert",
 * "Beef", "Vegetarian"...) and only a handful of recipes are labelled vegan,
 * so meal type is grouped from the category and diets are worked out from
 * each recipe's ingredient list instead.
 */
import { slugifyIngredient } from "./ingredients";
import type { CatalogueRecipe } from "./matching";

export const MEAL_TYPES = [
  { id: "breakfast", label: "Breakfast" },
  { id: "main", label: "Main" },
  { id: "side", label: "Side & starter" },
  { id: "dessert", label: "Dessert" },
] as const;
export type MealTypeId = (typeof MEAL_TYPES)[number]["id"];

export const DIETS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "pescatarian", label: "Pescatarian" },
  { id: "gluten-free", label: "Gluten free" },
  { id: "dairy-free", label: "Dairy free" },
  { id: "egg-free", label: "Egg free" },
  { id: "nut-free", label: "Nut free" },
] as const;
export type DietId = (typeof DIETS)[number]["id"];

const CATEGORY_TYPES: Record<string, MealTypeId> = {
  Breakfast: "breakfast",
  Dessert: "dessert",
  Side: "side",
  Starter: "side",
};

/** Beef, Chicken, Pasta, Vegetarian, Miscellaneous... are all mains. */
export function mealTypeOf(category: string | null): MealTypeId | null {
  if (!category) return null;
  return CATEGORY_TYPES[category] ?? "main";
}

type Flag = "meat" | "fish" | "dairy" | "egg" | "honey" | "gluten" | "nut";

/**
 * Words and phrases (compared on the ingredient slug) that put an ingredient
 * in a group. When unsure we lean towards excluding the recipe: plain
 * "stock" counts as meat and oats count as gluten.
 */
const WORDS: Record<Flag, string[]> = {
  meat: [
    "beef", "chicken", "pork", "lamb", "mutton", "goat", "veal", "venison", "rabbit", "turkey",
    "duck", "goose", "frog", "pig", "bacon", "lardon", "ham", "prosciutto", "jamon", "pancetta",
    "chorizo", "salami", "sausage", "kielbasa", "kabano", "morcilla", "black pudding",
    "christma pudding", "mincemeat", "steak", "brisket", "oxtail", "chuck", "shank", "mince", "meat",
    "gravy", "lard", "suet", "gelatine", "gelatin", "marshmallow", "stock", "bouillon",
  ],
  fish: [
    "fish", "codfish", "seafood", "salmon", "tuna", "cod", "haddock", "hake", "herring", "mackerel",
    "sardine", "pilchard", "anchovy", "trout", "barramundi", "monkfish", "snapper", "bass", "prawn",
    "shrimp", "crab", "lobster", "mussel", "clam", "oyster", "squid", "scallop", "conch", "prahok",
    "oyster sauce", "worcestershire",
  ],
  dairy: [
    "milk", "buttermilk", "butter", "cream", "creme", "cheese", "curd", "yogurt", "yoghurt", "ghee",
    "paneer", "custard", "quark", "fromage", "leche", "malai", "whey", "caramel", "toffee", "knafeh",
    "brie", "feta", "cheddar", "mozzarella", "parmesan", "parmigiano-reggiano", "pecorino", "ricotta",
    "mascarpone", "gruyere", "gouda", "manchego", "emmentaler", "stilton", "halloumi", "queso",
    "white chocolate", "mar bar",
  ],
  egg: ["egg", "mayonnaise", "aioli", "meringue", "custard"],
  honey: ["honey"],
  gluten: [
    "flour", "wheat", "bulgur", "freekeh", "couscous", "semolina", "barley", "rye", "spelt", "oat",
    "oatmeal", "mixed grain", "bread", "breadcrumb", "toast", "bun", "baguette", "ciabatta", "naan",
    "pita", "tortilla", "muffin", "roll", "pastry", "filo", "phyllo", "biscuit", "cooky", "cookie",
    "cracker", "pretzel", "cake", "pasta", "lasagne", "fettuccine", "penne", "linguine", "paccheri",
    "orzo", "gnocchi", "ravioli", "noodle", "udon", "sevaiiya", "wonton", "wrapper", "seitan", "beer",
    "stout", "malt", "soy sauce", "hoisin", "gochujang", "doubanjiang", "chilli bean paste",
    "shaoxing", "oyster sauce", "rice krispy", "knafeh", "mar bar",
  ],
  nut: [
    "nut", "almond", "cashew", "pecan", "walnut", "hazelnut", "hazlenut", "pistachio", "macadamia",
    "peanut", "chestnut", "marzipan", "nougatine", "praline",
  ],
};

/** Phrases that look like a group but are not (or only partly). */
const EXCEPTIONS: Record<string, Flag[]> = {
  "egg plant": [],
  "flax egg": [],
  "butter bean": [],
  "cocoa butter": [],
  "vegan butter": [],
  "peanut butter": ["nut"],
  "coconut milk": [],
  "coconut cream": [],
  "soya milk": [],
  "soy milk": [],
  "rice milk": [],
  "vegetable milk": [],
  "vegetable millk": [],
  "almond milk": ["nut"],
  "oat milk": ["gluten"],
  "cream of tartar": [],
  "custard powder": [],
  "goat cheese": ["dairy"],
  "goat s cheese": ["dairy"],
  "vegetable stock": [],
  "fish stock": ["fish"],
  "seafood stock": ["fish"],
  "shrimp stock": ["fish"],
  "beef tomato": [],
  "duck sauce": [],
  "oyster mushroom": [],
  "chestnut mushroom": [],
  "water chestnut": [],
  "grape nut cereal": ["gluten"],
  "corn flour": [],
  "rice flour": [],
  "chickpea flour": [],
  "buckwheat flour": [],
  "cassava flour": [],
  "potato flour": [],
  "almond flour": ["nut"],
  "coconut flour": [],
  "gluten free flour": [],
  "corn tortilla": [],
  "rice noodle": [],
  "rice stick noodle": [],
  "rice vermicelli": [],
  "rice paper": [],
};

const RULES = new Map<string, Flag[]>(Object.entries(EXCEPTIONS));
for (const [flag, words] of Object.entries(WORDS) as [Flag, string[]][]) {
  for (const w of words) {
    if (!EXCEPTIONS[w]) RULES.set(w, [...(RULES.get(w) ?? []), flag]);
  }
}
const LONGEST_RULE = Math.max(...[...RULES.keys()].map((k) => k.split(" ").length));

/**
 * Groups an ingredient belongs to. Longer phrases are matched first and use
 * up their words, so "peanut butter" is not also "butter".
 */
function flagsOf(name: string): Flag[] {
  const words = slugifyIngredient(name).split(" ");
  const flags: Flag[] = [];
  for (let len = Math.min(LONGEST_RULE, words.length); len >= 1; len--) {
    for (let i = 0; i + len <= words.length; i++) {
      const rule = RULES.get(words.slice(i, i + len).join(" "));
      if (!rule) continue;
      flags.push(...rule);
      words.fill("", i, i + len);
    }
  }
  return flags;
}

/** Diets a recipe fits, judged from its ingredient names. */
export function dietsOf(ingredientNames: string[]): Set<DietId> {
  const has = new Set(ingredientNames.flatMap(flagsOf));
  const diets = new Set<DietId>();
  const vegetarian = !has.has("meat") && !has.has("fish");
  if (vegetarian) diets.add("vegetarian");
  if (vegetarian && !has.has("dairy") && !has.has("egg") && !has.has("honey")) diets.add("vegan");
  if (!has.has("meat")) diets.add("pescatarian");
  if (!has.has("gluten")) diets.add("gluten-free");
  if (!has.has("dairy")) diets.add("dairy-free");
  if (!has.has("egg")) diets.add("egg-free");
  if (!has.has("nut")) diets.add("nut-free");
  return diets;
}

export interface RecipeFacets {
  mealType: MealTypeId | null;
  diets: Set<DietId>;
  cuisine: string | null;
}

export function facetsOf(recipe: CatalogueRecipe): RecipeFacets {
  return {
    mealType: mealTypeOf(recipe.category),
    diets: dietsOf(recipe.ingredients.map((i) => i.name)),
    cuisine: recipe.area,
  };
}

export interface RecipeFilters {
  types: MealTypeId[];
  diets: DietId[];
  cuisine: string | null;
}

/** Meal types: any of them. Diets: all of them. */
export function matchesFilters(f: RecipeFacets, filters: RecipeFilters): boolean {
  return (
    (filters.types.length === 0 || (f.mealType != null && filters.types.includes(f.mealType))) &&
    filters.diets.every((d) => f.diets.has(d)) &&
    (!filters.cuisine || f.cuisine === filters.cuisine)
  );
}

/** The items that pass the filters, plus how many each option would show. */
export function applyFilters<T>(items: T[], getFacets: (item: T) => RecipeFacets, filters: RecipeFilters) {
  const facets = items.map(getFacets);
  return {
    items: items.filter((_, i) => matchesFilters(facets[i], filters)),
    counts: countOptions(facets, filters),
  };
}

/**
 * How many recipes each option would show. Meal type and cuisine are counted
 * as if that group were unset (picking one swaps or widens it); diets are
 * counted on top of the current filters (picking one narrows it).
 */
export type OptionCounts = ReturnType<typeof countOptions>;

function countOptions(all: RecipeFacets[], filters: RecipeFilters) {
  const count = (keep: (f: RecipeFacets) => boolean, ignore: Partial<RecipeFilters>) => {
    const base = { ...filters, ...ignore };
    return all.filter((f) => matchesFilters(f, base) && keep(f)).length;
  };
  return {
    types: Object.fromEntries(
      MEAL_TYPES.map(({ id }) => [id, count((f) => f.mealType === id, { types: [] })]),
    ) as Record<MealTypeId, number>,
    diets: Object.fromEntries(DIETS.map(({ id }) => [id, count((f) => f.diets.has(id), {})])) as Record<
      DietId,
      number
    >,
    cuisines: all.reduce<Record<string, number>>((acc, f) => {
      if (f.cuisine && matchesFilters(f, { ...filters, cuisine: null })) acc[f.cuisine] = (acc[f.cuisine] ?? 0) + 1;
      return acc;
    }, {}),
  };
}
