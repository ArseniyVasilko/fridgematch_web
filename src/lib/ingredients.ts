/**
 * Ingredient name normalisation and matching.
 *
 * TheMealDB lists ingredients like "Chopped Tomatoes", "Chicken Breast" or
 * "Basmati Rice", while users type "tomato", "chicken" or "rice". We compare
 * ingredients by their *core*: the singular, lowercase name with harmless
 * descriptive words removed ("chopped", "basmati", "red" ...) and with
 * "part of" words removed from the end ("breast", "clove", "yolk" ...).
 *
 * Words that change what the ingredient *is* are kept on purpose, so
 * "chicken stock" is not "chicken", "peanut butter" is not "butter" and
 * "coconut milk" is not "milk".
 */

/** Leading words that only describe the ingredient, not change it. */
const MODIFIERS = new Set([
  // preparation / state
  "chopped", "diced", "sliced", "minced", "ground", "grated", "shredded", "crushed",
  "fresh", "frozen", "dried", "tinned", "canned", "cooked", "raw", "smoked", "peeled",
  "boneless", "skinless", "lean", "whole", "organic", "free", "range", "free-range",
  "unsalted", "salted", "plain", "natural", "mashed", "melted", "softened",
  // size / colour
  "large", "small", "medium", "baby", "mini", "red", "green", "yellow", "white",
  "black", "brown", "golden",
  // varieties that are still "the same thing" for a home cook
  "basmati", "jasmine", "long", "grain", "long-grain", "arborio", "cherry", "plum",
  "vine", "new", "maris", "piper", "floury", "waxy", "greek", "caster", "granulated",
  "icing", "soft", "light", "dark", "double", "single", "heavy", "whipping", "full",
  "fat", "semi", "skimmed", "semi-skimmed", "low", "extra", "virgin", "olive",
  "vegetable", "sunflower", "rapeseed", "canola", "self", "raising", "self-raising",
  "strong", "wholemeal", "all", "purpose", "all-purpose", "sea", "table", "flaked",
  "cold", "boiling",
]);

/** Trailing words naming a part or form of the ingredient. */
const PART_WORDS = new Set([
  "breast", "thigh", "leg", "drumstick", "wing", "fillet", "mince", "clove",
  "yolk", "white", "floret", "leaf", "stalk", "sprig", "head", "bulb", "piece",
  "chunk", "cube", "slice", "strip",
]);

/** Different names for the same thing (after singularising). */
const ALIASES: Record<string, string> = {
  "scallion": "spring onion",
  "green onion": "spring onion",
  "chili": "chilli",
  "chile": "chilli",
  "zucchini": "courgette",
  "eggplant": "aubergine",
  "cilantro": "coriander",
  "shrimp": "prawn",
  "king prawn": "prawn",
  "tiger prawn": "prawn",
  "bell pepper": "pepper",
  "capsicum": "pepper",
  "garbanzo bean": "chickpea",
  "yoghurt": "yogurt",
  "ground beef": "beef",
  "minced beef": "beef",
  "beef mince": "beef",
  "stock cube": "stock",
  "spaghetti": "pasta",
  "penne": "pasta",
  "fusilli": "pasta",
  "linguine": "pasta",
  "tagliatelle": "pasta",
  "macaroni": "pasta",
  "rigatoni": "pasta",
  "farfalle": "pasta",
  "cheddar cheese": "cheddar",
};

/** Words ending in "s" that are already singular (or plural-only). */
const KEEP_S = new Set([
  "asparagus", "couscous", "hummus", "swiss", "cress", "watercress", "molasses",
  "lemongrass", "citrus", "bass", "haggis", "brussels", "greens", "hummous", "chives",
]);

function singularWord(w: string): string {
  if (w.length <= 3 || KEEP_S.has(w)) return w;
  if (w.endsWith("ies")) return w.slice(0, -3) + "y"; // berries -> berry
  if (w.endsWith("oes")) return w.slice(0, -2); // tomatoes -> tomato
  if (w === "leaves" || w === "loaves" || w === "halves") return w.slice(0, -3) + "f"; // leaves -> leaf
  if (/(ch|sh|x|ss)es$/.test(w)) return w.slice(0, -2); // radishes -> radish
  if (w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1);
  return w;
}

/**
 * Normalised key used for storage and exact comparison:
 * lowercase, ASCII, no punctuation, singular words.
 * "Chopped Tomatoes" -> "chopped tomato"
 */
export function slugifyIngredient(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const singular = cleaned.split(" ").map(singularWord).join(" ");
  return ALIASES[singular] ?? singular;
}

/**
 * The core used for matching. "chopped tomato" -> "tomato",
 * "chicken breast" -> "chicken", "chicken stock" -> "chicken stock".
 */
export function coreIngredient(nameOrSlug: string): string {
  let words = slugifyIngredient(nameOrSlug).split(" ").filter(Boolean);
  // strip leading descriptive words, but always keep at least one word
  while (words.length > 1 && MODIFIERS.has(words[0])) words = words.slice(1);
  // strip trailing "part" words ("chicken breast" -> "chicken")
  while (words.length > 1 && PART_WORDS.has(words[words.length - 1])) {
    words = words.slice(0, -1);
  }
  const core = words.join(" ");
  return ALIASES[core] ?? core;
}

/** True when a user's ingredient can be used for a recipe ingredient. */
export function ingredientsMatch(a: string, b: string): boolean {
  return coreIngredient(a) === coreIngredient(b);
}

/**
 * Basics most kitchens have. When "I have the basics" is on, these never
 * count as missing. Compared on the full slug so that "red pepper" (a
 * vegetable) is not treated like "black pepper" (a seasoning).
 */
const STAPLE_SLUGS = new Set([
  "salt", "sea salt", "table salt", "salt and pepper", "pepper", "black pepper",
  "ground black pepper", "water", "cold water", "hot water", "boiling water", "warm water",
  "oil", "olive oil", "extra virgin olive oil", "vegetable oil", "sunflower oil",
  "rapeseed oil", "ice",
]);

export function isStaple(nameOrSlug: string): boolean {
  return STAPLE_SLUGS.has(slugifyIngredient(nameOrSlug));
}

/** "chopped tomato" -> "Chopped Tomato" for display of user-typed names. */
export function titleCase(s: string): string {
  return s.replace(/\b([a-z])/g, (m) => m.toUpperCase());
}
