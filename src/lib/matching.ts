/**
 * Core feature: ingredient matching and ranking (design document, 5.1).
 *
 *  1. Take the user's ingredients (typed in, and/or from My Pantry).
 *  2. Take the recipes that use at least one of them.
 *  3. Score each recipe = available ingredients / all ingredients, where an
 *     ingredient counts 1 if the user has enough, 0.5 if they only have part
 *     of the amount (e.g. 1 of 2 carrots) and 0 if they have none.
 *  4. Return every ingredient's status ("have", "partial", "missing").
 *  5. Sort from best to worst match.
 *
 * Pure functions only (no database access) so the logic is easy to unit test.
 */
import { coreIngredient, isStaple } from "./ingredients";
import { isExpiringSoon } from "./expiry";
import { parseMeasure, toBaseAmount } from "./measure";

export interface CatalogueIngredient {
  name: string;
  measure: string;
}

export interface CatalogueRecipe {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  imageUrl: string | null;
  ingredients: CatalogueIngredient[];
}

export interface UserIngredient {
  name: string;
  /** Only known for pantry items. */
  quantity?: number | null;
  unit?: string | null;
  expiryDate?: Date | null;
  fromPantry?: boolean;
}

export type IngredientStatus = "have" | "partial" | "missing" | "staple";

export interface IngredientMatch {
  name: string;
  measure: string;
  status: IngredientStatus;
  /** The user's ingredient that satisfied this one. */
  matchedWith?: string;
  expiringSoon?: boolean;
}

export interface RecipeMatch {
  recipe: Omit<CatalogueRecipe, "ingredients">;
  /** 0..1 */
  score: number;
  /** Ingredients the user has at least part of (incl. basics). */
  haveCount: number;
  total: number;
  missingCount: number;
  /** How many soon-to-expire pantry items this recipe uses up. */
  usesExpiring: number;
  ingredients: IngredientMatch[];
}

export interface MatchOptions {
  /** Treat salt, pepper, oil and water as always available. */
  assumeStaples?: boolean;
  /** Hide recipes with more missing ingredients than this. */
  maxMissing?: number | null;
  now?: Date;
}

interface PreparedUserIngredient extends UserIngredient {
  core: string;
}

function prepare(user: UserIngredient[]): Map<string, PreparedUserIngredient[]> {
  const byCore = new Map<string, PreparedUserIngredient[]>();
  for (const u of user) {
    const core = coreIngredient(u.name);
    if (!core) continue;
    const list = byCore.get(core) ?? [];
    list.push({ ...u, core });
    byCore.set(core, list);
  }
  return byCore;
}

/**
 * Decide if the user has enough of an ingredient. Only pantry items have a
 * quantity; if either side's amount is unknown or the units differ we trust
 * that the user has enough.
 */
function amountStatus(candidates: PreparedUserIngredient[], measure: string): "have" | "partial" {
  const needed = parseMeasure(measure);
  if (!needed) return "have";
  let total = 0;
  for (const c of candidates) {
    if (c.quantity == null) return "have"; // typed in without amount
    const amount = toBaseAmount(c.quantity, c.unit);
    if (!amount || amount.unit !== needed.unit) return "have";
    total += amount.value;
  }
  return total + 1e-9 >= needed.value ? "have" : "partial";
}

export function evaluateRecipe(
  recipe: CatalogueRecipe,
  userIngredients: UserIngredient[] | Map<string, PreparedUserIngredient[]>,
  options: MatchOptions = {},
): RecipeMatch & { matchedCount: number } {
  const { assumeStaples = true, now = new Date() } = options;
  const byCore = userIngredients instanceof Map ? userIngredients : prepare(userIngredients);

  let points = 0;
  let haveCount = 0;
  let missingCount = 0;
  let matchedCount = 0;
  let usesExpiring = 0;

  const ingredients: IngredientMatch[] = recipe.ingredients.map((ing) => {
    const candidates = byCore.get(coreIngredient(ing.name));
    if (candidates && candidates.length > 0) {
      const status = amountStatus(candidates, ing.measure);
      const expiringSoon = candidates.some((c) => c.fromPantry && isExpiringSoon(c.expiryDate, now));
      if (!isStaple(ing.name)) matchedCount += 1;
      if (expiringSoon) usesExpiring += 1;
      haveCount += 1;
      points += status === "have" ? 1 : 0.5;
      return { name: ing.name, measure: ing.measure, status, matchedWith: candidates[0].name, expiringSoon };
    }
    if (assumeStaples && isStaple(ing.name)) {
      haveCount += 1;
      points += 1;
      return { name: ing.name, measure: ing.measure, status: "staple" };
    }
    missingCount += 1;
    return { name: ing.name, measure: ing.measure, status: "missing" };
  });

  const total = recipe.ingredients.length;
  const { ingredients: _omit, ...summary } = recipe;
  void _omit;
  return {
    recipe: summary,
    score: total === 0 ? 0 : points / total,
    haveCount,
    total,
    missingCount,
    usesExpiring,
    ingredients,
    matchedCount,
  };
}

/** Rank recipes for the given ingredients, best match first. */
export function rankRecipes(
  recipes: CatalogueRecipe[],
  userIngredients: UserIngredient[],
  options: MatchOptions = {},
): RecipeMatch[] {
  const byCore = prepare(userIngredients);
  if (byCore.size === 0) return [];
  const { maxMissing = null } = options;

  const results: RecipeMatch[] = [];
  for (const recipe of recipes) {
    const { matchedCount, ...match } = evaluateRecipe(recipe, byCore, options);
    // step 2: only recipes that use at least one of the user's ingredients
    if (matchedCount === 0) continue;
    if (maxMissing != null && match.missingCount > maxMissing) continue;
    results.push(match);
  }

  return results.sort(
    (a, b) =>
      b.score - a.score ||
      a.missingCount - b.missingCount ||
      b.usesExpiring - a.usesExpiring ||
      a.recipe.name.localeCompare(b.recipe.name),
  );
}
