/**
 * Writes normalised recipes into our own database. Used by the sync scripts
 * (scripts/sync-mealdb.ts, scripts/sync-open-recipes.ts) and the offline seed (prisma/seed.ts).
 * No "server-only" import here because it also runs from the command line.
 */
import type { PrismaClient } from "@/generated/prisma/client";
import { slugifyIngredient, titleCase } from "./ingredients";
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
  const missing = [...bySlug].filter(([slug]) => !ids.has(slug)).map(([slug, name]) => ({ slug, name }));
  if (missing.length === 0) return ids;
  // one round trip for all new names; skipDuplicates covers a concurrent insert of the same slug
  await db.ingredient.createMany({ data: missing, skipDuplicates: true });
  const created = await db.ingredient.findMany({
    where: { slug: { in: missing.map((m) => m.slug) } },
    select: { id: true, slug: true },
  });
  for (const c of created) ids.set(c.slug, c.id);
  return ids;
}

/** Id for one ingredient name as a user typed it, creating it if needed. */
export async function ensureIngredient(db: Db, name: string): Promise<number> {
  const ids = await ensureIngredients(db, [titleCase(name)]);
  return ids.get(slugifyIngredient(name))!;
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
      attribution: meal.attribution ?? null,
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
