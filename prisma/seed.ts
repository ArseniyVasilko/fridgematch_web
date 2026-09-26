/**
 * Offline seed: loads 18 sample recipes (written for FridgeMatch, in
 * TheMealDB's format) so the app works without internet access.
 * For the real catalogue run `npm run sync:mealdb`, which replaces them.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createPrismaClient } from "../src/lib/create-prisma";
import { ensureIngredients, importMeals } from "../src/lib/import-meals";
import { normaliseMeal, type MealDbMeal } from "../src/lib/mealdb";

const COMMON_INGREDIENTS = [
  "Chicken", "Eggs", "Rice", "Tomatoes", "Onion", "Garlic", "Pasta", "Cheese", "Milk",
  "Butter", "Potatoes", "Carrots", "Spinach", "Mushrooms", "Beef", "Bacon", "Bread",
  "Lemon", "Broccoli", "Red Pepper", "Courgettes", "Cucumber", "Avocado", "Tuna",
  "Salmon", "Yogurt", "Flour", "Sugar", "Honey", "Oats", "Banana", "Apple", "Ham",
  "Tofu", "Chickpeas", "Lentils", "Sweetcorn", "Peas", "Cream", "Mozzarella",
];

async function main() {
  const db = createPrismaClient();
  const file = path.join(__dirname, "fixtures", "sample-meals.json");
  const { meals } = JSON.parse(readFileSync(file, "utf8")) as { meals: MealDbMeal[] };
  const count = await importMeals(db, meals.map(normaliseMeal), "sample");
  await ensureIngredients(db, COMMON_INGREDIENTS);
  console.log(`Seeded ${count} sample recipes.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
