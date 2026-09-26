/**
 * Syncs the full TheMealDB catalogue into our database so ingredient
 * matching runs locally (fast, testable, and no premium API key needed).
 * Safe to re-run: recipes are upserted by TheMealDB id.
 *
 *   npm run sync:mealdb
 */
import "dotenv/config";
import { createPrismaClient } from "../src/lib/create-prisma";
import { ensureIngredients, importMeals } from "../src/lib/import-meals";
import { fetchAllMeals, fetchIngredientList, normaliseMeal } from "../src/lib/mealdb";

async function main() {
  const db = createPrismaClient();
  console.log("Fetching meals from TheMealDB…");
  const meals = await fetchAllMeals((letter, n) => process.stdout.write(`${letter}:${n} `));
  console.log(`\nFetched ${meals.length} meals.`);
  if (meals.length === 0) throw new Error("No meals returned – check your internet connection.");

  const removed = await db.recipe.deleteMany({ where: { source: "sample" } });
  if (removed.count) console.log(`Removed ${removed.count} offline sample recipes.`);

  const count = await importMeals(db, meals.map(normaliseMeal), "themealdb");
  console.log(`Imported ${count} recipes.`);

  const names = await fetchIngredientList();
  await ensureIngredients(db, names);
  console.log(`Ingredient list: ${names.length} names.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
