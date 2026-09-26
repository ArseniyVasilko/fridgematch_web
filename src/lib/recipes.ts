import "server-only";
import { prisma } from "./db";
import { slugifyIngredient } from "./ingredients";
import { rankRecipes, evaluateRecipe, type CatalogueRecipe, type UserIngredient, type MatchOptions } from "./matching";

/**
 * The recipe catalogue is small (TheMealDB has a few hundred meals), so it is
 * loaded once into memory and matched in JavaScript. Cached for 5 minutes.
 */
const CACHE_MS = 5 * 60 * 1000;
let cache: { at: number; recipes: CatalogueRecipe[] } | null = null;

export async function getCatalogue(): Promise<CatalogueRecipe[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.recipes;
  const rows = await prisma.recipe.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      area: true,
      imageUrl: true,
      ingredients: {
        orderBy: { position: "asc" },
        select: { measure: true, ingredient: { select: { name: true } } },
      },
    },
  });
  const recipes = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    area: r.area,
    imageUrl: r.imageUrl,
    ingredients: r.ingredients.map((i) => ({ name: i.ingredient.name, measure: i.measure })),
  }));
  cache = { at: Date.now(), recipes };
  return recipes;
}

export async function matchRecipes(user: UserIngredient[], options: MatchOptions & { category?: string | null }) {
  let recipes = await getCatalogue();
  if (options.category) recipes = recipes.filter((r) => r.category === options.category);
  return rankRecipes(recipes, user, options);
}

/** Browse / search by recipe name (UC7). */
export async function browseRecipes({ q, category }: { q?: string | null; category?: string | null }) {
  let recipes = await getCatalogue();
  if (category) recipes = recipes.filter((r) => r.category === category);
  const term = q?.trim().toLowerCase();
  if (term) {
    recipes = recipes.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.ingredients.some((i) => i.name.toLowerCase().includes(term)) ||
        (r.area ?? "").toLowerCase() === term ||
        (r.category ?? "").toLowerCase() === term,
    );
  }
  return recipes;
}

export async function getCategories(): Promise<string[]> {
  const recipes = await getCatalogue();
  return [...new Set(recipes.map((r) => r.category).filter((c): c is string => !!c))].sort();
}

/**
 * "Popular recipes" on the home page. We have no usage data yet, so this is
 * a daily-rotating pick that prefers recipes with photos.
 */
export async function getFeaturedRecipes(count = 4): Promise<CatalogueRecipe[]> {
  const recipes = await getCatalogue();
  if (recipes.length <= count) return recipes;
  const withImages = recipes.filter((r) => r.imageUrl);
  const pool = withImages.length >= count ? withImages : recipes;
  const day = Math.floor(Date.now() / 86_400_000);
  const step = Math.max(1, Math.floor(pool.length / count));
  return Array.from({ length: count }, (_, i) => pool[(day + i * step) % pool.length]);
}

export async function getRecipe(id: number) {
  if (!Number.isInteger(id) || id <= 0) return null;
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        orderBy: { position: "asc" },
        include: { ingredient: { select: { name: true } } },
      },
    },
  });
}

export function evaluateForDetails(
  recipe: NonNullable<Awaited<ReturnType<typeof getRecipe>>>,
  user: UserIngredient[],
  options: MatchOptions,
) {
  return evaluateRecipe(
    {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      area: recipe.area,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients.map((i) => ({ name: i.ingredient.name, measure: i.measure })),
    },
    user,
    options,
  );
}

/** Autocomplete for the ingredient input. Prefix matches first. */
export async function suggestIngredients(q: string, limit = 8): Promise<string[]> {
  const term = q.trim();
  if (term.length < 1) return [];
  // search the lowercase slug so it is case-insensitive on SQLite and Postgres
  const slugTerm = slugifyIngredient(term);
  if (!slugTerm) return [];
  const rows = await prisma.ingredient.findMany({
    where: { slug: { contains: slugTerm } },
    select: { name: true },
    take: 200,
  });
  const lower = term.toLowerCase();
  return rows
    .map((r) => r.name)
    .sort((a, b) => {
      const ap = a.toLowerCase().startsWith(lower) ? 0 : 1;
      const bp = b.toLowerCase().startsWith(lower) ? 0 : 1;
      return ap - bp || a.length - b.length || a.localeCompare(b);
    })
    .slice(0, limit);
}
