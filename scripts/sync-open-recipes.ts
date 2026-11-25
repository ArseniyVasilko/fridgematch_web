/**
 * Imports the English recipes of the Open Recipe Corpus (CC BY-SA 4.0) next
 * to TheMealDB's. Safe to re-run: recipes are upserted by corpus id.
 *
 *   npm run sync:open-recipes            # downloads the corpus from GitHub
 *   npm run sync:open-recipes -- ./dir   # or reads recipes.jsonl and en.jsonl from a folder
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createPrismaClient } from "../src/lib/create-prisma";
import { importMeals } from "../src/lib/import-meals";
import { parseOpenRecipeCorpus } from "../src/lib/open-recipes";

const BASE = "https://raw.githubusercontent.com/rippy1911/open-recipe-corpus/main/data";

async function download(file: string) {
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`Downloading ${file} failed: ${res.status}`);
  return res.text();
}

async function main() {
  const dir = process.argv[2];
  const [recipes, text] = dir
    ? [readFileSync(path.join(dir, "recipes.jsonl"), "utf8"), readFileSync(path.join(dir, "en.jsonl"), "utf8")]
    : await Promise.all([download("recipes.jsonl"), download("text/en.jsonl")]);

  const meals = parseOpenRecipeCorpus(recipes, text);
  console.log(`Read ${meals.length} English recipes from the Open Recipe Corpus.`);
  if (meals.length === 0) throw new Error("No recipes found – check the files.");

  const db = createPrismaClient();
  const count = await importMeals(db, meals, "open-recipe-corpus");
  console.log(`Imported ${count} recipes.`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
