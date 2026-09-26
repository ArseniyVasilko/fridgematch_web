/**
 * Writes TheMealDB meals into our own database. Used by the sync script
 * (scripts/sync-mealdb.ts) and the offline seed (prisma/seed.ts).
 * No "server-only" import here because it also runs from the command line.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { slugifyIngredient } from "./ingredients";
import type { NormalisedMeal } from "./mealdb";

type Db = InstanceType<typeof PrismaClient>;

/** Returns ingredient ids by slug, creating missing ingredients. */
export async function ensureIngredients(db: Db, names: string[]): Promise<Map<string, number>> {
  const bySlug = new Map<string, string>();
  for (const name of names) {
    const slug = slugifyIngredient(name);
    if (slug && !bySlug.has(slug)) bySlug.set(slug, name.trim());
  }
  const existing = await db.ingredient.findMany({
    where: { slug: { in: [...bySlug.keys()] } },
    select: { id: true, slug: true },
  });
  const ids = new Map(existing.map((i) => [i.slug, i.id]));
  for (const [slug, name] of bySlug) {
    if (ids.has(slug)) continue;
    const created = await db.ingredient.create({ data: { slug, name }, select: { id: true } });
    ids.set(slug, created.id);
  }
  return ids;
}

export async function importMeals(db: Db, meals: NormalisedMeal[], source = "themealdb") {
  const ingredientIds = await ensureIngredients(
    db,
    meals.flatMap((m) => m.ingredients.map((i) => i.name)),
  );

  let count = 0;
  for (const meal of meals) {
    const data = {
      source,
      name: meal.name,
      category: meal.category,
      area: meal.area,
      instructions: meal.instructions,
      imageUrl: meal.imageUrl,
      youtubeUrl: meal.youtubeUrl,
      sourceUrl: meal.sourceUrl,
      tags: meal.tags,
    };
    const recipe = await db.recipe.upsert({
      where: { externalId: meal.externalId },
      create: { externalId: meal.externalId, ...data },
      update: data,
      select: { id: true },
    });
    await db.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
    await db.recipeIngredient.createMany({
      data: meal.ingredients
        .map((ing, position) => ({
          recipeId: recipe.id,
          ingredientId: ingredientIds.get(slugifyIngredient(ing.name))!,
          measure: ing.measure,
          position,
        }))
        .filter((r) => r.ingredientId != null),
    });
    count++;
  }
  return count;
}
