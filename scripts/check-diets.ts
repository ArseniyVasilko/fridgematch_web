/**
 * Checks the diet filters (dietsOf in src/lib/recipe-filters.ts) against the
 * Open Recipe Corpus, whose recipes come with their own diet tags and
 * allergens. For each diet it prints how often we disagree and, where we say
 * a recipe fits but the corpus says it doesn't, the ingredient names most
 * likely to blame: candidates for new words in the rules.
 *
 *   npx tsx scripts/check-diets.ts            # downloads the corpus from GitHub
 *   npx tsx scripts/check-diets.ts ./dir      # or reads recipes.jsonl and en.jsonl from a folder
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import type { OpenRecipeMeta, OpenRecipeText } from "../src/lib/open-recipes";
import { dietsOf, type DietId } from "../src/lib/recipe-filters";

const BASE = "https://raw.githubusercontent.com/rippy1911/open-recipe-corpus/main/data";

type Meta = OpenRecipeMeta & { allergens?: string[] };

/** What the corpus says about each diet we filter on (pescatarian has no equivalent). */
const TRUTH: Partial<Record<DietId, (m: Meta) => boolean>> = {
  vegetarian: (m) => !!m.tags?.includes("vegetarian"),
  vegan: (m) => !!m.tags?.includes("vegan"),
  "gluten-free": (m) => !m.allergens?.includes("gluten"),
  "dairy-free": (m) => !m.allergens?.includes("milk"),
  "egg-free": (m) => !m.allergens?.includes("egg"),
  "nut-free": (m) => !m.allergens?.includes("nuts") && !m.allergens?.includes("peanuts"),
};

async function load(file: string, dir?: string) {
  if (dir) return readFileSync(path.join(dir, path.basename(file)), "utf8");
  const res = await fetch(`${BASE}/${file}`);
  if (!res.ok) throw new Error(`Downloading ${file} failed: ${res.status}`);
  return res.text();
}

const lines = <T>(s: string) => s.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l) as T);

async function main() {
  const dir = process.argv[2];
  const metas = lines<Meta>(await load("recipes.jsonl", dir));
  const texts = new Map(lines<OpenRecipeText>(await load("text/en.jsonl", dir)).map((t) => [t.id, t]));
  const recipes = metas
    .filter((m) => texts.has(m.id))
    .map((m) => ({ meta: m, names: texts.get(m.id)!.ingredients.map((i) => i.name) }));
  console.log(`${recipes.length} recipes with English ingredient names.\n`);

  for (const [diet, truth] of Object.entries(TRUTH) as [DietId, (m: Meta) => boolean][]) {
    let tooLoose = 0;
    let tooStrict = 0;
    const blame = new Map<string, number>();
    const fineIn = new Map<string, number>();
    for (const { meta, names } of recipes) {
      const ours = dietsOf(names).has(diet);
      const theirs = truth(meta);
      if (theirs) for (const n of names) fineIn.set(n, (fineIn.get(n) ?? 0) + 1);
      if (ours && !theirs) {
        tooLoose++;
        for (const n of names) blame.set(n, (blame.get(n) ?? 0) + 1);
      } else if (!ours && theirs) tooStrict++;
    }
    // names that show up in the wrongly accepted recipes but rarely in recipes that really fit
    const suspects = [...blame]
      .filter(([, n]) => n >= 2)
      .map(([name, n]) => ({ name, n, score: n / ((fineIn.get(name) ?? 0) + 1) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
    console.log(`${diet}: we wrongly accept ${tooLoose}, wrongly reject ${tooStrict} (of ${recipes.length})`);
    if (suspects.length) console.log(`  likely causes: ${suspects.map((s) => `${s.name} (${s.n})`).join(", ")}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
